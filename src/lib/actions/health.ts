"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  assertPetOwnership,
  failure,
  firstIssue,
  ok,
  optionalDate,
  optionalText,
  requiredDate,
  uuid,
  type ActionState,
} from "./shared";

const vaccineSchema = z.object({
  pet_id: uuid,
  vaccine_type: z.string().trim().min(1, "Enter the vaccine name.").max(120),
  date_administered: requiredDate,
  next_due_date: optionalDate,
  administered_by: optionalText,
  notes: optionalText,
});

const dewormingSchema = z.object({
  pet_id: uuid,
  type: z.enum(["internal", "external", "both"], { message: "Choose a treatment type." }),
  date_administered: requiredDate,
  next_due_date: optionalDate,
  product_used: optionalText,
  notes: optionalText,
});

function revalidatePet(petId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/pets/${petId}`);
  revalidatePath("/dashboard/calendar");
}

// ---------------------------------------------------------------------------
// Vaccines
// ---------------------------------------------------------------------------

export async function addVaccine(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = vaccineSchema.safeParse({
    pet_id: formData.get("pet_id"),
    vaccine_type: formData.get("vaccine_type") ?? "",
    date_administered: formData.get("date_administered") ?? "",
    next_due_date: formData.get("next_due_date") ?? "",
    administered_by: formData.get("administered_by") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));
  if (!(await assertPetOwnership(parsed.data.pet_id))) return failure("That pet could not be found.");

  if (parsed.data.next_due_date && parsed.data.next_due_date < parsed.data.date_administered) {
    return failure("The next due date can't be before the date it was administered.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vaccines").insert(parsed.data);
  if (error) return failure(error.message);

  revalidatePet(parsed.data.pet_id);
  return ok("Vaccine record added.");
}

export async function deleteVaccine(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const supabase = await createClient();
  await supabase.from("vaccines").delete().eq("id", id.data);
  revalidatePet(petId.data);
}

// ---------------------------------------------------------------------------
// Deworming
// ---------------------------------------------------------------------------

export async function addDeworming(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = dewormingSchema.safeParse({
    pet_id: formData.get("pet_id"),
    type: formData.get("type") ?? "internal",
    date_administered: formData.get("date_administered") ?? "",
    next_due_date: formData.get("next_due_date") ?? "",
    product_used: formData.get("product_used") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));
  if (!(await assertPetOwnership(parsed.data.pet_id))) return failure("That pet could not be found.");

  if (parsed.data.next_due_date && parsed.data.next_due_date < parsed.data.date_administered) {
    return failure("The next due date can't be before the date it was administered.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("deworming_records").insert(parsed.data);
  if (error) return failure(error.message);

  revalidatePet(parsed.data.pet_id);
  return ok("Deworming record added.");
}

export async function deleteDeworming(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const supabase = await createClient();
  await supabase.from("deworming_records").delete().eq("id", id.data);
  revalidatePet(petId.data);
}
