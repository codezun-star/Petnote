"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  PASSWORDS_DO_NOT_MATCH,
  confirmationMatches,
  confirmationSchema,
  passwordSchema,
} from "@/lib/password";
import { requireAccount } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { failure, firstIssue, ok, type ActionState } from "./shared";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: confirmationSchema,
  })
  .refine(confirmationMatches, {
    path: ["confirmPassword"],
    message: PASSWORDS_DO_NOT_MATCH,
  })
  .refine((values) => values.password !== values.currentPassword, {
    path: ["password"],
    message: "Your new password is the same as your current one.",
  });

/**
 * Confirms `password` is the account's current one.
 *
 * Deliberately *not* the request-scoped client: signing in on that one would
 * rewrite the caller's session cookies as a side effect of what is only meant
 * to be a check. This throwaway client keeps its session in memory, and that
 * session is revoked straight afterwards so verifying a password never leaves
 * a usable refresh token behind.
 */
async function passwordMatches(email: string, password: string): Promise<boolean> {
  const probe = createSupabaseClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;

  try {
    // `local` revokes only the session just minted. `global` — the default —
    // would sign the user out of the browser they are sitting in front of.
    await createAdminClient().auth.admin.signOut(data.session.access_token, "local");
  } catch (revokeError) {
    // Cleanup, not a gate: the password was still correct.
    console.error("[account] Could not revoke the verification session", revokeError);
  }

  return true;
}

/**
 * Changes the password of a signed-in user.
 *
 * The current password is required even though the session already
 * authenticates the request — otherwise a borrowed session could lock the real
 * owner out of their own account.
 */
export async function changePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));

  const account = await requireAccount();
  if (!account.email) {
    return failure("Your account has no email address on file, so we can't verify your password.");
  }

  if (!(await passwordMatches(account.email, parsed.data.currentPassword))) {
    return failure("That isn't your current password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.error("[account] Password change failed", error);
    return failure(error.message || "We couldn't update your password. Please try again.");
  }

  return ok("Password updated. Use the new one next time you log in.");
}
