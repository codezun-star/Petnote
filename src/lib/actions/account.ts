"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ACCOUNT_DELETION_PHRASE } from "@/lib/account";
import {
  PASSWORDS_DO_NOT_MATCH,
  confirmationMatches,
  confirmationSchema,
  passwordSchema,
} from "@/lib/password";
import { requireAccount } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { sameUsername, usernameSchema } from "@/lib/username";
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

/**
 * Changes the handle used to log in.
 *
 * No password is asked for: a username is public, and losing it costs nobody
 * their account — the email address on the account is what recovers it.
 */
export async function changeUsername(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z.object({ username: usernameSchema }).safeParse({
    username: formData.get("username") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));

  const account = await requireAccount();
  const current = account.profile?.username ?? null;
  const next = parsed.data.username;

  if (current === next) return ok("That's already your username.");

  const supabase = await createClient();

  // Only a genuinely different handle needs the availability check. Re-casing
  // your own — "alex" to "Alex" — collides with nothing, because the unique
  // index on lower(username) is already pointing at this very row.
  if (!sameUsername(current, next)) {
    const { data: available, error: lookupError } = await supabase.rpc("is_username_available", {
      candidate: next,
    });

    if (lookupError) {
      console.error("[account] Username availability check failed", lookupError);
      return failure("We couldn't check that username just now. Please try again.");
    }
    if (available === false) {
      return failure(`The username "${next}" is taken. Try another one.`);
    }
  }

  // Upsert rather than update, for the same reason `updateOwnerProfile` does:
  // accounts created before the bootstrap trigger existed have no row yet, and
  // an update would silently match nothing.
  const { error } = await supabase
    .from("owner_profiles")
    .upsert({ id: account.userId, username: next }, { onConflict: "id" });

  if (error) {
    // The unique index is the real guard — two people can pass the check above
    // at the same moment and only one of them can win.
    if (error.code === "23505") return failure(`The username "${next}" is taken. Try another one.`);
    console.error("[account] Username change failed", error);
    return failure(error.message || "We couldn't save that username. Please try again.");
  }

  revalidatePath("/dashboard/settings");
  return ok(`Saved. You'll log in as "${next}" from now on.`);
}

const changeEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your new email address.")
    .email("Enter a valid email address."),
  currentPassword: z.string().min(1, "Enter your current password."),
});

/**
 * Starts a change of the account's email address.
 *
 * Two things guard this. The current password, because the email address *is*
 * the account recovery mechanism: if a stolen session were enough to move it,
 * stealing a session would be enough to take the account outright. And
 * Supabase's own confirmation step, which leaves the old address in place
 * until the link sent to the new one is opened — so a typo is recoverable
 * rather than locking the owner out.
 */
export async function changeEmail(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email") ?? "",
    currentPassword: formData.get("currentPassword") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));

  const account = await requireAccount();
  if (!account.email) {
    return failure("Your account has no email address on file, so we can't verify your password.");
  }

  if (account.email.toLowerCase() === parsed.data.email.toLowerCase()) {
    return failure("That's already the email address on your account.");
  }

  if (!(await passwordMatches(account.email, parsed.data.currentPassword))) {
    return failure("That isn't your current password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: absoluteUrl("/auth/callback?next=/dashboard/settings&flow=email-change") },
  );

  if (error) {
    console.error("[account] Email change failed", error);
    return failure(error.message || "We couldn't start that email change. Please try again.");
  }

  return ok(
    `Almost there — open the confirmation link we emailed to ${parsed.data.email}. Check ${account.email} too: for security you may be asked to confirm from both. Your address changes once every link has been opened, so keep logging in with ${account.email} until then.`,
  );
}

/** Both buckets key objects by `<owner id>/<pet id>/<file>`. */
const STORAGE_BUCKETS = ["pet-photos", "pet-documents"] as const;

const STORAGE_PAGE_SIZE = 100;
/** Enough for any plausible account, and a guard against a paging loop. */
const STORAGE_MAX_PAGES = 200;

/**
 * Every entry under `prefix`, paged out, or `null` if storage couldn't be read.
 *
 * `null` and `[]` mean very different things to the caller: one is "this
 * account has no files", the other is "we don't know what this account has",
 * and deleting on the second would be deleting blind.
 */
async function listStorageEntries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  prefix: string,
): Promise<{ name: string; id: string | null }[] | null> {
  const entries: { name: string; id: string | null }[] = [];

  for (let page = 0; page < STORAGE_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: STORAGE_PAGE_SIZE, offset: page * STORAGE_PAGE_SIZE });

    if (error) {
      console.error(`[account] Could not list ${bucket}/${prefix}`, error);
      return null;
    }

    entries.push(...(data ?? []));
    if (!data || data.length < STORAGE_PAGE_SIZE) return entries;
  }

  console.error(`[account] Gave up paging ${bucket}/${prefix} after ${STORAGE_MAX_PAGES} pages`);
  return null;
}

/**
 * Storage paths belonging to `userId` in `bucket`.
 *
 * Listed by prefix rather than read off `documents.storage_path` and
 * `pets.photo_url`, because replacing a pet's photo leaves the previous object
 * in the bucket with no row pointing at it. Deriving paths from the tables
 * would tidy the referenced files and quietly leave those behind.
 */
async function listOwnedFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  userId: string,
): Promise<string[] | null> {
  const top = await listStorageEntries(supabase, bucket, userId);
  if (top === null) return null;

  const paths: string[] = [];

  for (const entry of top) {
    // Storage reports folders with a null id.
    if (entry.id !== null) {
      paths.push(`${userId}/${entry.name}`);
      continue;
    }

    const nested = await listStorageEntries(supabase, bucket, `${userId}/${entry.name}`);
    if (nested === null) return null;
    for (const file of nested) {
      if (file.id !== null) paths.push(`${userId}/${entry.name}/${file.name}`);
    }
  }

  return paths;
}

const deleteAccountSchema = z.object({
  confirmation: z.string().trim(),
  currentPassword: z.string().min(1, "Enter your current password."),
});

/**
 * Deletes the account and everything hanging off it.
 *
 * Three gates, because this is the one action nobody can undo: the exact
 * confirmation word, typed out; the current password; and only then the
 * delete itself.
 *
 * Order matters. Stored files go first and a failure there stops everything,
 * because storage has no foreign key to `auth.users` and the database cascade
 * therefore doesn't reach it. Deleting the account first would strand every
 * pet photo in a public-read bucket — still fetchable at its URL, with no
 * session left in existence that could ever clean it up. Losing files while
 * the account survives is recoverable by retrying; the other way round is not.
 */
export async function deleteAccount(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation") ?? "",
    currentPassword: formData.get("currentPassword") ?? "",
  });

  if (!parsed.success) return failure(firstIssue(parsed.error));

  if (parsed.data.confirmation !== ACCOUNT_DELETION_PHRASE) {
    return failure(
      `Type ${ACCOUNT_DELETION_PHRASE} exactly as shown to confirm. Nothing has been deleted.`,
    );
  }

  const account = await requireAccount();
  if (!account.email) {
    return failure("Your account has no email address on file, so we can't verify your password.");
  }

  if (!(await passwordMatches(account.email, parsed.data.currentPassword))) {
    return failure("That isn't your current password. Nothing has been deleted.");
  }

  const supabase = await createClient();

  for (const bucket of STORAGE_BUCKETS) {
    const paths = await listOwnedFiles(supabase, bucket, account.userId);
    if (paths === null) {
      return failure(
        "We couldn't reach your stored files, so nothing has been deleted. Please try again in a moment.",
      );
    }
    if (paths.length === 0) continue;

    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error(`[account] Could not delete files from ${bucket}`, error);
      return failure(
        "We couldn't delete your stored files, so nothing has been deleted. Please try again in a moment.",
      );
    }
  }

  // The service role is required — a user cannot delete their own auth row.
  // Everything in the database hangs off auth.users with `on delete cascade`,
  // so this one call takes the profile, the pets and every record under them.
  const { error } = await createAdminClient().auth.admin.deleteUser(account.userId);

  if (error) {
    console.error("[account] Account deletion failed", error);
    return failure(
      "We couldn't delete your account. Please try again, or contact support if this keeps happening.",
    );
  }

  // The user this session belonged to no longer exists; this is what clears
  // the cookies so the browser isn't left holding a dead session.
  await supabase.auth.signOut();

  redirect("/login?deleted=1");
}
