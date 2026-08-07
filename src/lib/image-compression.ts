/**
 * Browser-side image compression — the first of two passes.
 *
 * Supabase Storage is a bucket, not an image CDN: it keeps exactly the bytes
 * it is handed. So "store it already optimised" has to happen *before* the
 * upload, and doing it here means the big original never leaves the device.
 *
 * This is the fast path, not the guarantee. It can be skipped entirely by
 * posting straight to the Server Action, so `@/lib/server/image-compression`
 * runs the same budgets again before anything is stored. Both read their
 * numbers from `@/lib/image-profiles` so the two passes can't disagree.
 *
 * Everything here needs `document`, `createImageBitmap` and `canvas.toBlob`,
 * so it only runs in the browser.
 */

import { SKIPPED_IMAGE_TYPES, isAnimatedGif } from "@/lib/image-format";
import {
  MAX_RESCALES,
  MAX_SOURCE_BYTES,
  MIN_EDGE,
  QUALITY_START,
  QUALITY_STEP,
  RESCALE_FACTOR,
  type CompressionProfile,
} from "@/lib/image-profiles";

type OutputType = "image/webp" | "image/jpeg";

let cachedOutputType: OutputType | null = null;

/**
 * WebP where it encodes, JPEG where it doesn't. Both are already accepted by
 * the `pet-photos` and `pet-documents` buckets and by the Server Actions, so
 * either output passes validation unchanged.
 */
function outputType(): OutputType {
  if (cachedOutputType) return cachedOutputType;
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  cachedOutputType = probe.toDataURL("image/webp").startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";
  return cachedOutputType;
}

function draw(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  type: OutputType,
): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  // JPEG has no alpha channel; without this a transparent PNG comes out black.
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: OutputType, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function asFile(blob: Blob, original: File, type: OutputType): File {
  const stem = original.name.replace(/\.[^./\\]+$/, "") || "image";
  const extension = type === "image/webp" ? "webp" : "jpg";
  // The name carries the new extension so the stored object key, its
  // Content-Type and what the user downloads all agree.
  return new File([blob], `${stem}.${extension}`, { type, lastModified: Date.now() });
}

/**
 * Downscales and re-encodes `file` to land at or under `profile.targetBytes`.
 *
 * Quality steps down first, because dropping pixels is the more visible loss.
 * Only when the quality floor still isn't enough do the dimensions shrink and
 * the ladder run again.
 *
 * Best-effort by design: anything the browser can't decode, an animated GIF, a
 * non-image, or a file that simply doesn't get smaller comes back untouched —
 * the caller uploads what it was given.
 */
export async function compressImage(file: File, profile: CompressionProfile): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (SKIPPED_IMAGE_TYPES.has(file.type)) return file;
  if (file.size > MAX_SOURCE_BYTES) return file;
  if (file.type === "image/gif" && isAnimatedGif(new Uint8Array(await file.arrayBuffer()))) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // HEIC outside Safari, SVG, a truncated file — leave it exactly as it came
    // in and let the Server Action decide whether to accept it.
    return file;
  }

  try {
    const type = outputType();
    const fit = Math.min(1, profile.maxEdge / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * fit));
    let height = Math.max(1, Math.round(bitmap.height * fit));
    let smallest: Blob | null = null;

    for (let pass = 0; pass <= MAX_RESCALES; pass += 1) {
      const canvas = draw(bitmap, width, height, type);
      if (!canvas) return file;

      for (let quality = QUALITY_START; quality >= profile.minQuality - 1e-6; quality -= QUALITY_STEP) {
        const blob = await toBlob(canvas, type, quality);
        if (!blob) return file;

        if (!smallest || blob.size < smallest.size) smallest = blob;
        if (blob.size <= profile.targetBytes) return asFile(blob, file, type);
      }

      width = Math.round(width * RESCALE_FACTOR);
      height = Math.round(height * RESCALE_FACTOR);
      if (Math.max(width, height) < MIN_EDGE) break;
    }

    // Never hand back something bigger than we were given: a small, already
    // optimised file can easily grow when re-encoded.
    if (smallest && smallest.size < file.size) return asFile(smallest, file, type);
    return file;
  } finally {
    bitmap.close();
  }
}
