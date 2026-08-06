"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { MAX_UPLOAD_BYTES, isWithinLimit } from "@/lib/plans";
import { countDocuments, requireAccount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { assertPetOwnership, failure, firstIssue, ok, uuid, type ActionState } from "./shared";

const DOCUMENT_BUCKET = "pet-documents";
const MAX_DOCUMENT_BYTES = MAX_UPLOAD_BYTES;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const uploadSchema = z.object({
  pet_id: uuid,
  document_type: z
    .enum(["lab_result", "xray", "certificate", "prescription", "invoice", "other"])
    .catch("other"),
});

/** Strips directory separators and anything that could confuse a storage key. */
function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[/\\]/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120) || "document"
  );
}

export async function uploadDocument(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = uploadSchema.safeParse({
    pet_id: formData.get("pet_id"),
    document_type: formData.get("document_type") ?? "other",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return failure("Choose a file to upload.");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return failure("Documents must be a PDF or an image (JPEG, PNG, WebP, HEIC).");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return failure("Documents must be smaller than 4 MB.");
  }

  const account = await requireAccount();
  if (!(await assertPetOwnership(parsed.data.pet_id))) return failure("That pet could not be found.");

  const documentCount = await countDocuments();
  if (!isWithinLimit(documentCount, account.limits.maxDocuments)) {
    return failure(
      `The Free plan stores up to ${account.limits.maxDocuments} documents. Upgrade to Pro for unlimited storage.`,
    );
  }

  const supabase = await createClient();
  const safeName = sanitizeFileName(file.name);
  const path = `${account.userId}/${parsed.data.pet_id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return failure(`Couldn't upload that file: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("documents").insert({
    pet_id: parsed.data.pet_id,
    storage_path: path,
    file_name: safeName,
    file_size: file.size,
    mime_type: file.type,
    document_type: parsed.data.document_type,
  });

  if (insertError) {
    // Don't leave an orphaned object behind if the row failed to save.
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    return failure(insertError.message);
  }

  revalidatePath(`/dashboard/pets/${parsed.data.pet_id}`);
  return ok("Document uploaded.");
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id.data)
    .maybeSingle();

  // RLS scoped the select above, so reaching this point means the caller owns it.
  if (document) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([document.storage_path]);
    await supabase.from("documents").delete().eq("id", id.data);
  }

  revalidatePath(`/dashboard/pets/${petId.data}`);
}

/**
 * Short-lived signed URL for a private document.
 *
 * The `documents` select is RLS-filtered, so a caller who doesn't own the row
 * gets `null` and never reaches the storage API.
 */
export async function getDocumentUrl(documentId: string): Promise<string | null> {
  const parsed = uuid.safeParse(documentId);
  if (!parsed.success) return null;

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!document) return null;

  const { data } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(document.storage_path, 60);

  return data?.signedUrl ?? null;
}
