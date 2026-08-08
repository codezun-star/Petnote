import { z } from "zod";

/**
 * One password rule for the whole app — signup, reset and change.
 *
 * Supabase enforces a minimum of its own, configured per project and six
 * characters by default, so keeping the check here means a project left on
 * that default still gets the stricter rule.
 */
export const MIN_PASSWORD_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Passwords must be at least ${MIN_PASSWORD_LENGTH} characters long.`);

export const confirmationSchema = z.string().min(1, "Confirm your new password.");

export const PASSWORDS_DO_NOT_MATCH = "Those passwords don't match.";

/** Shared by every form that asks for a new password twice. */
export function confirmationMatches(values: { password: string; confirmPassword: string }): boolean {
  return values.password === values.confirmPassword;
}

/**
 * A new password plus its confirmation.
 *
 * The mismatch is reported against the confirmation field, because that is the
 * one the person almost certainly mistyped.
 */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmationSchema,
  })
  .refine(confirmationMatches, {
    path: ["confirmPassword"],
    message: PASSWORDS_DO_NOT_MATCH,
  });
