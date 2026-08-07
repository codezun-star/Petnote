/**
 * Size budgets for uploaded images, shared by the two places that enforce them:
 * the browser (`@/lib/image-compression`) and the Server Actions
 * (`@/lib/server/image-compression`).
 *
 * They live apart from both implementations so the numbers can't drift — the
 * server is the backstop for the client, and a backstop aiming at a different
 * target isn't one.
 */

export type CompressionProfile = {
  /** Longest edge in pixels. Smaller images are never scaled up. */
  maxEdge: number;
  /** What the quality search aims for. */
  targetBytes: number;
  /** Floor for the quality search, 0–1. Below this, artefacts get obvious. */
  minQuality: number;
};

/**
 * Pet photos: public, shown at avatar and hero sizes, and by far the largest
 * share of stored bytes. Squeezed hard.
 */
export const PHOTO_COMPRESSION: CompressionProfile = {
  maxEdge: 1600,
  targetBytes: 200 * 1024,
  minQuality: 0.5,
};

/**
 * Document scans: lab results, x-rays, prescriptions, invoices. Treated far
 * more gently — these are medical records, and small text has to stay
 * readable, so they get more pixels and a higher quality floor.
 */
export const DOCUMENT_COMPRESSION: CompressionProfile = {
  maxEdge: 2400,
  targetBytes: 600 * 1024,
  minQuality: 0.65,
};

/**
 * Refuse to decode anything larger than this in the browser. A 24-megapixel
 * photo expands to roughly 100 MB once it is a bitmap, and decoding several
 * times that on a mid-range phone kills the tab.
 *
 * The server has its own, much lower ceiling: Server Actions cap bodies at
 * 4 MB (see `next.config.ts`), so nothing bigger ever reaches sharp.
 */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/** Shared by both encoders, so client and server climb the same ladder. */
export const QUALITY_START = 0.85;
export const QUALITY_STEP = 0.07;
/** How far dimensions shrink when the quality floor still isn't enough. */
export const RESCALE_FACTOR = 0.8;
export const MIN_EDGE = 480;
export const MAX_RESCALES = 3;
