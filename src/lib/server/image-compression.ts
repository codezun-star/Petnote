import "server-only";

import sharp, { type Metadata } from "sharp";

import { SKIPPED_IMAGE_TYPES, isAnimatedGif } from "@/lib/image-format";
import {
  MAX_RESCALES,
  MIN_EDGE,
  QUALITY_START,
  QUALITY_STEP,
  RESCALE_FACTOR,
  type CompressionProfile,
} from "@/lib/image-profiles";

/**
 * Server-side image compression — the pass that actually holds.
 *
 * The browser pass in `@/lib/image-compression` is the fast one: it shrinks
 * the file before it crosses the network, so it saves the upload as well as
 * the storage. But it is only reachable through the form. A request posted
 * straight at the Server Action skips it completely, and until this ran, that
 * request stored whatever it liked, up to the full 4 MB body limit.
 *
 * So the same budgets are enforced again here, on bytes that have already
 * arrived, immediately before the object is handed to Supabase Storage. Both
 * passes read `@/lib/image-profiles`, so they aim at the same targets, and
 * both defer to `@/lib/image-format` on what must not be touched.
 */

export type OptimisedImage = {
  data: Buffer;
  contentType: "image/webp";
  extension: "webp";
};

function asOptimised(data: Buffer): OptimisedImage {
  return { data, contentType: "image/webp", extension: "webp" };
}

/**
 * Re-encodes `file` to WebP within `profile`'s budget.
 *
 * Returns `null` to mean "store what you were given" — for a non-image, a
 * format that must be preserved, something sharp can't read, or a file that is
 * already small enough that a second encode would cost quality and save
 * nothing. Callers treat `null` as "upload the original untouched".
 */
export async function optimiseImage(
  file: File,
  profile: CompressionProfile,
): Promise<OptimisedImage | null> {
  if (!file.type.startsWith("image/")) return null;
  if (SKIPPED_IMAGE_TYPES.has(file.type)) return null;

  const input = Buffer.from(await file.arrayBuffer());
  if (file.type === "image/gif" && isAnimatedGif(input)) return null;

  let metadata: Metadata;
  try {
    metadata = await sharp(input).metadata();
  } catch {
    // Not something libvips can decode. The Server Action has already checked
    // the MIME type, so let its verdict stand and store the bytes as they are.
    return null;
  }

  // Animated WebP and multi-page TIFF would come back as frame one only.
  if ((metadata.pages ?? 1) > 1) return null;

  // EXIF orientation is baked into the pixels below via `.rotate()`, so the
  // dimensions that matter are the ones after rotation, not as stored.
  const oriented = metadata.autoOrient ?? { width: metadata.width, height: metadata.height };
  const longestEdge = Math.max(oriented.width ?? 0, oriented.height ?? 0);

  // Already inside the budget, in both bytes and pixels — which is the normal
  // case, because the browser pass got here first. Re-encoding now would just
  // stack a second generation of loss on top for no saving.
  if (file.size <= profile.targetBytes && longestEdge <= profile.maxEdge) return null;

  const startQuality = Math.round(QUALITY_START * 100);
  const stepQuality = Math.round(QUALITY_STEP * 100);
  const floorQuality = Math.round(profile.minQuality * 100);

  let edge = profile.maxEdge;
  let smallest: Buffer | null = null;

  for (let pass = 0; pass <= MAX_RESCALES; pass += 1) {
    // `.rotate()` with no argument applies EXIF orientation, which browsers do
    // on decode and sharp does not. Without it, phone photos land sideways.
    const resized = sharp(input)
      .rotate()
      .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true });

    for (let quality = startQuality; quality >= floorQuality; quality -= stepQuality) {
      const encoded = await resized.clone().webp({ quality }).toBuffer();

      if (!smallest || encoded.length < smallest.length) smallest = encoded;
      if (encoded.length <= profile.targetBytes) return asOptimised(encoded);
    }

    // Quality alone couldn't get there. Drop the bounding box and run the
    // ladder again — the same order the browser pass uses, because losing
    // pixels is the more visible of the two losses.
    edge = Math.round(edge * RESCALE_FACTOR);
    if (edge < MIN_EDGE) break;
  }

  // Never store something larger than what arrived.
  if (smallest && smallest.length < file.size) return asOptimised(smallest);
  return null;
}

/** Retargets a filename at the format actually stored. */
export function withExtension(name: string, extension: string): string {
  return `${name.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
}
