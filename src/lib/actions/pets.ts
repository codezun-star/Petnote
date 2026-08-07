"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Pet } from "@/lib/database.types";
import { countPets, requireAccount } from "@/lib/queries";
import { PHOTO_COMPRESSION } from "@/lib/image-profiles";
import { MAX_UPLOAD_BYTES, isWithinLimit } from "@/lib/plans";
import { optimiseImage } from "@/lib/server/image-compression";
import { createClient } from "@/lib/supabase/server";
import {
  assertPetOwnership,
  failure,
  firstIssue,
  ok,
  optionalDate,
  optionalText,
  uuid,
  type ActionState,
} from "./shared";

const PHOTO_BUCKET = "pet-photos";
const MAX_PHOTO_BYTES = MAX_UPLOAD_BYTES;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const petSchema = z.object({
  name: z.string().trim().min(1, "Give your pet a name.").max(80),
  species: z.enum(["dog", "cat", "rabbit", "bird", "reptile", "rodent", "other"], {
    message: "Choose a species.",
  }),
  breed: optionalText,
  sex: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .refine((value) => value === null || ["male", "female", "unknown"].includes(value), {
      message: "Choose a valid option.",
    }),
  date_of_birth: optionalDate,
  current_weight: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .nullable()
    .refine((value) => value === null || (Number.isFinite(value) && value > 0 && value < 1000), {
      message: "Enter a weight between 0 and 1000.",
    }),
  weight_unit: z.enum(["kg", "lb"]).catch("kg"),
  allergies: optionalText,
  microchip_number: optionalText,
  notes: optionalText,
});

function readPetForm(formData: FormData) {
  return petSchema.safeParse({
    name: formData.get("name") ?? "",
    species: formData.get("species") ?? "",
    breed: formData.get("breed") ?? "",
    sex: formData.get("sex") ?? "",
    date_of_birth: formData.get("date_of_birth") ?? "",
    current_weight: formData.get("current_weight") ?? "",
    weight_unit: formData.get("weight_unit") ?? "kg",
    allergies: formData.get("allergies") ?? "",
    microchip_number: formData.get("microchip_number") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

/**
 * Compresses a pet photo, uploads it and returns its public URL.
 *
 * The bucket is public read (Emergency Mode has no session), so the path is
 * namespaced by owner id — which is also what the storage policy checks.
 */
async function uploadPhoto(file: File, userId: string, petId: string): Promise<string | null> {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Photos must be a JPEG, PNG, WebP or GIF image.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photos must be smaller than 4 MB.");
  }

  const supabase = await createClient();

  // Second compression pass. The browser already did this for anyone using the
  // form — `optimiseImage` returns null when it finds nothing left to do — but
  // a request that skipped the form gets squeezed here instead of going into
  // the bucket at full size.
  const optimised = await optimiseImage(file, PHOTO_COMPRESSION);
  const extension =
    optimised?.extension ??
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ??
    "jpg";
  const path = `${userId}/${petId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, optimised?.data ?? file, {
    contentType: optimised?.contentType ?? file.type,
    upsert: false,
  });

  if (error) throw new Error(`Couldn't upload that photo: ${error.message}`);

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function createPet(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = readPetForm(formData);
  if (!parsed.success) return failure(firstIssue(parsed.error));

  const account = await requireAccount();

  // Plan limits are enforced here, not just in the UI — the form is only a
  // hint, this is the boundary that actually holds.
  const petCount = await countPets();
  if (!isWithinLimit(petCount, account.limits.maxPets)) {
    return failure(
      `The Free plan includes one pet profile. Upgrade to Pro to add ${petCount === 1 ? "another pet" : "more pets"}.`,
    );
  }

  const supabase = await createClient();
  const { data: pet, error } = await supabase
    .from("pets")
    .insert({ ...parsed.data, sex: parsed.data.sex as Pet["sex"], owner_id: account.userId })
    .select("id")
    .single();

  if (error || !pet) return failure(error?.message ?? "Couldn't create that pet profile.");

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      const photoUrl = await uploadPhoto(photo, account.userId, pet.id);
      await supabase.from("pets").update({ photo_url: photoUrl }).eq("id", pet.id);
    } catch {
      // The profile itself saved fine; surface the photo problem on the pet
      // page rather than throwing the whole submission away.
      revalidatePath("/dashboard");
      redirect(`/dashboard/pets/${pet.id}?photoError=1`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pets");
  redirect(`/dashboard/pets/${pet.id}`);
}

export async function updatePet(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const petId = uuid.safeParse(formData.get("petId"));
  if (!petId.success) return failure("That pet could not be found.");

  const parsed = readPetForm(formData);
  if (!parsed.success) return failure(firstIssue(parsed.error));

  const account = await requireAccount();
  if (!(await assertPetOwnership(petId.data))) return failure("That pet could not be found.");

  const supabase = await createClient();
  const updates: Partial<Pet> = { ...parsed.data, sex: parsed.data.sex as Pet["sex"] };

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      updates.photo_url = await uploadPhoto(photo, account.userId, petId.data);
    } catch (uploadError) {
      return failure(uploadError instanceof Error ? uploadError.message : "Couldn't upload that photo.");
    }
  }

  const { error } = await supabase.from("pets").update(updates).eq("id", petId.data);
  if (error) return failure(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pets");
  revalidatePath(`/dashboard/pets/${petId.data}`);
  return ok("Profile saved.");
}

export async function deletePet(formData: FormData): Promise<void> {
  const petId = uuid.safeParse(formData.get("petId"));
  if (!petId.success) redirect("/dashboard/pets");

  const supabase = await createClient();
  // Every child table cascades from `pets`, so this one delete clears the
  // whole record set.
  await supabase.from("pets").delete().eq("id", petId.data);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pets");
  redirect("/dashboard/pets");
}

export async function toggleEmergencyMode(formData: FormData): Promise<void> {
  const petId = uuid.safeParse(formData.get("petId"));
  if (!petId.success) return;

  const enabled = formData.get("enabled") === "true";
  const supabase = await createClient();
  await supabase.from("pets").update({ emergency_enabled: enabled }).eq("id", petId.data);

  revalidatePath(`/dashboard/pets/${petId.data}`);
  revalidatePath(`/dashboard/pets/${petId.data}/emergency`);
}
