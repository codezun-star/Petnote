import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  success?: string;
};

export const EMPTY_STATE: ActionState = {};

export function failure(error: string): ActionState {
  return { error };
}

export function ok(success: string): ActionState {
  return { success };
}

/** Turns a Zod failure into the single message the form should display. */
export function firstIssue(error: z.ZodError, fallback = "Please check the form and try again."): string {
  return error.issues[0]?.message ?? fallback;
}

/** `""` from an untouched input means "no value", not an empty string. */
export const optionalText = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .catch(null);

export const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Enter a valid date.",
  });

export const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

/**
 * Confirms the caller owns `petId` before a write.
 *
 * RLS would reject the write anyway, but checking up front turns a confusing
 * "new row violates row-level security policy" into a clear message, and
 * prevents an unowned id from reaching a storage path.
 */
export async function assertPetOwnership(petId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("pets").select("id").eq("id", petId).maybeSingle();
  return Boolean(data);
}

export const uuid = z.string().uuid("That record could not be found.");
