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

const medicalRecordSchema = z.object({
  pet_id: uuid,
  record_type: z.enum(["visit", "surgery", "procedure", "emergency"]).catch("visit"),
  visit_date: requiredDate,
  reason: optionalText,
  diagnosis: optionalText,
  treatment: optionalText,
  vet_name: optionalText,
});

const medicationSchema = z.object({
  pet_id: uuid,
  name: z.string().trim().min(1, "Enter the medication name.").max(120),
  dosage: optionalText,
  frequency: optionalText,
  start_date: optionalDate,
  end_date: optionalDate,
  active: z.boolean(),
  notes: optionalText,
});

function revalidatePet(petId: string) {
  revalidatePath(`/dashboard/pets/${petId}`);
  // Active medications are surfaced on the public Emergency page.
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------------
// Medical records
// ---------------------------------------------------------------------------

export async function addMedicalRecord(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = medicalRecordSchema.safeParse({
    pet_id: formData.get("pet_id"),
    record_type: formData.get("record_type") ?? "visit",
    visit_date: formData.get("visit_date") ?? "",
    reason: formData.get("reason") ?? "",
    diagnosis: formData.get("diagnosis") ?? "",
    treatment: formData.get("treatment") ?? "",
    vet_name: formData.get("vet_name") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));
  if (!(await assertPetOwnership(parsed.data.pet_id))) return failure("That pet could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.from("medical_records").insert(parsed.data);
  if (error) return failure(error.message);

  revalidatePet(parsed.data.pet_id);
  return ok("Medical record added.");
}

export async function deleteMedicalRecord(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const supabase = await createClient();
  await supabase.from("medical_records").delete().eq("id", id.data);
  revalidatePet(petId.data);
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export async function addMedication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = medicationSchema.safeParse({
    pet_id: formData.get("pet_id"),
    name: formData.get("name") ?? "",
    dosage: formData.get("dosage") ?? "",
    frequency: formData.get("frequency") ?? "",
    start_date: formData.get("start_date") ?? "",
    end_date: formData.get("end_date") ?? "",
    active: formData.get("active") === "on" || formData.get("active") === "true",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));
  if (!(await assertPetOwnership(parsed.data.pet_id))) return failure("That pet could not be found.");

  if (parsed.data.start_date && parsed.data.end_date && parsed.data.end_date < parsed.data.start_date) {
    return failure("The end date can't be before the start date.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("medications").insert(parsed.data);
  if (error) return failure(error.message);

  revalidatePet(parsed.data.pet_id);
  return ok("Medication added.");
}

export async function setMedicationActive(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const active = formData.get("active") === "true";
  const supabase = await createClient();
  await supabase.from("medications").update({ active }).eq("id", id.data);
  revalidatePet(petId.data);
}

export async function deleteMedication(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const supabase = await createClient();
  await supabase.from("medications").delete().eq("id", id.data);
  revalidatePet(petId.data);
}
