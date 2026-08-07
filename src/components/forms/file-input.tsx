"use client";

import { useState, type ChangeEvent } from "react";

import { useFormBusy } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/format";
import { compressImage } from "@/lib/image-compression";
import { MAX_SOURCE_BYTES, type CompressionProfile } from "@/lib/image-profiles";

/**
 * File picker that optimises images and enforces the size limit before
 * anything is submitted.
 *
 * With a `compress` profile, the chosen image is downscaled and re-encoded
 * here and the result is swapped back into the input, so the Server Action —
 * and therefore the storage bucket — only ever sees the small version. That is
 * the whole compression story: there is no second, full-size copy anywhere.
 *
 * The size check runs on whatever will actually be uploaded, so a 12 MB phone
 * photo is now accepted (it arrives as a few hundred KB) while a 12 MB PDF is
 * still refused. Server Actions reject an oversized body before the action
 * runs, so without this the user would get an unexplained server error.
 *
 * The server still validates independently — this is a courtesy, not a
 * boundary.
 */
export function FileInput({
  id,
  name,
  accept,
  required,
  maxBytes,
  compress,
}: {
  id?: string;
  name: string;
  accept?: string;
  required?: boolean;
  maxBytes: number;
  /** When set, images are downscaled and re-encoded in the browser first. */
  compress?: CompressionProfile;
}) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const whileBusy = useFormBusy();

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // Captured up front: `currentTarget` is only valid for the duration of the
    // event, and compression below is awaited.
    const input = event.currentTarget;
    const chosen = input.files?.[0];

    setError(null);
    setNote(null);
    if (!chosen) return;

    let file = chosen;

    if (compress && chosen.type.startsWith("image/")) {
      if (chosen.size > MAX_SOURCE_BYTES) {
        setError(
          `That image is ${formatFileSize(chosen.size)}, too large to optimise in the browser. ` +
            `Resize it below ${formatFileSize(MAX_SOURCE_BYTES)} and try again.`,
        );
        input.value = "";
        return;
      }

      setNote("Optimising…");
      try {
        file = await whileBusy(() => compressImage(chosen, compress));
      } catch {
        // Compression is best-effort; fall back to uploading the original.
        file = chosen;
      }

      if (file === chosen) {
        setNote(null);
      } else {
        // Swap the compressed file in so the form submits *it*, not the pick.
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        setNote(`Optimised — ${formatFileSize(chosen.size)} → ${formatFileSize(file.size)}`);
      }
    }

    if (file.size > maxBytes) {
      setNote(null);
      setError(
        `That file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(maxBytes)} — ` +
          `try a smaller one, or compress it first.`,
      );
      // Clear it so the oversized file can't be submitted at all.
      input.value = "";
    }
  }

  return (
    <>
      <Input
        id={id ?? name}
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
      {note && !error ? <p className="mt-1.5 text-xs text-muted-foreground">{note}</p> : null}
    </>
  );
}
