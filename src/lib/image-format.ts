/**
 * Format checks shared by the browser and server encoders.
 *
 * Both passes have to make the same call about what is safe to re-encode. The
 * browser reaches its answer by failing to decode; the server has sharp and
 * would happily succeed. Keeping the rules here — rather than letting each
 * side infer them from what it happens to support — is what makes the two
 * passes agree.
 */

/**
 * Formats left exactly as uploaded.
 *
 * HEIC can't be decoded by `createImageBitmap` outside Safari, so the browser
 * pass always skips it. sharp's prebuilt libvips *can* read HEIC, but taking
 * that path would mean an iPhone upload is stored as WebP on the server and
 * untouched everywhere else — the same file compressing differently depending
 * on which browser sent it. Skipping it in both places keeps one behaviour.
 */
export const SKIPPED_IMAGE_TYPES: ReadonlySet<string> = new Set(["image/heic", "image/heif"]);

/**
 * Animated GIFs would come back as a single frame, so they are left alone.
 * Every frame in an animation is preceded by a Graphic Control Extension
 * (`21 F9 04`), so finding a second one means there is motion worth keeping.
 *
 * Verified against both a still GIF (one marker) and a two-frame animation
 * (two markers), matching what sharp reports as `metadata.pages`.
 */
export function isAnimatedGif(bytes: Uint8Array): boolean {
  let frames = 0;

  for (let i = 0; i + 2 < bytes.length; i += 1) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
      frames += 1;
      if (frames > 1) return true;
    }
  }

  return false;
}
