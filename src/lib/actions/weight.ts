"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  assertPetOwnership,
  failure,
  firstIssue,
  ok,
  optionalText,
  requiredDate,
  uuid,
  type ActionState,
} from "./shared";

const weightSchema = z.object({
  pet_id: uuid,
  weight: z.coerce
    .number({ message: "Enter a weight." })
    .positive("Weight must be greater than zero.")
    .max(999, "Enter a weight below 1000."),
  unit: z.enum(["kg", "lb"]).catch("kg"),
  logged_at: requiredDate,
  note: optionalText,
});

export async function addWeightLog(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = weightSchema.safeParse({
    pet_id: formData.get("pet_id"),
    weight: formData.get("weight"),
    unit: formData.get("unit") ?? "kg",
    logged_at: formData.get("logged_at") ?? "",
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));
  if (!(await assertPetOwnership(parsed.data.pet_id))) return failure("That pet could not be found.");

  const supabase = await createClient();
  const { error } = await supabase.from("weight_logs").insert(parsed.data);
  if (error) return failure(error.message);

  // Keep the pet's headline weight in step with the newest entry, so the
  // profile card and the chart never disagree.
  const { data: latest } = await supabase
    .from("weight_logs")
    .select("weight, unit")
    .eq("pet_id", parsed.data.pet_id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) {
    await supabase
      .from("pets")
      .update({ current_weight: latest.weight, weight_unit: latest.unit })
      .eq("id", parsed.data.pet_id);
  }

  revalidatePath(`/dashboard/pets/${parsed.data.pet_id}`);
  revalidatePath("/dashboard");
  return ok("Weight logged.");
}

export async function deleteWeightLog(formData: FormData): Promise<void> {
  const id = uuid.safeParse(formData.get("id"));
  const petId = uuid.safeParse(formData.get("pet_id"));
  if (!id.success || !petId.success) return;

  const supabase = await createClient();
  await supabase.from("weight_logs").delete().eq("id", id.data);

  revalidatePath(`/dashboard/pets/${petId.data}`);
  revalidatePath("/dashboard");
}
