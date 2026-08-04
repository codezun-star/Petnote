"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { failure, firstIssue, ok, optionalText, type ActionState } from "./shared";

const profileSchema = z.object({
  full_name: optionalText,
  phone: optionalText,
  emergency_contact_name: optionalText,
  emergency_contact_phone: optionalText,
  vet_name: optionalText,
  vet_phone: optionalText,
  vet_clinic: optionalText,
  reminders_enabled: z.boolean(),
});

export async function updateOwnerProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
    emergency_contact_name: formData.get("emergency_contact_name") ?? "",
    emergency_contact_phone: formData.get("emergency_contact_phone") ?? "",
    vet_name: formData.get("vet_name") ?? "",
    vet_phone: formData.get("vet_phone") ?? "",
    vet_clinic: formData.get("vet_clinic") ?? "",
    reminders_enabled: formData.get("reminders_enabled") === "on",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));

  const account = await requireAccount();
  const supabase = await createClient();

  // The signup trigger creates this row, but upsert keeps the form working for
  // accounts created before the trigger existed.
  const { error } = await supabase
    .from("owner_profiles")
    .upsert({ id: account.userId, ...parsed.data }, { onConflict: "id" });

  if (error) return failure(error.message);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return ok("Contact details saved. These are what Emergency Mode shows.");
}
