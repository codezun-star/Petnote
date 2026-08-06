"use client";

import { useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/format";

/**
 * File picker that enforces the size limit before anything is submitted.
 *
 * Server Actions reject an oversized body before the action runs, so without
 * this the user gets an unexplained server error instead of being told the
 * file is too big. Checking in the browser also saves them uploading megabytes
 * only to have it refused.
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
}: {
  id?: string;
  name: string;
  accept?: string;
  required?: boolean;
  maxBytes: number;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setError(null);
      return;
    }

    if (file.size > maxBytes) {
      setError(
        `That file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(maxBytes)} — ` +
          `try a smaller one, or compress it first.`,
      );
      // Clear it so the oversized file can't be submitted at all.
      event.currentTarget.value = "";
      return;
    }

    setError(null);
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
    </>
  );
}
