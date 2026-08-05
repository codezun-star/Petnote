"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";

export type AuthFormState = {
  error?: string;
  notice?: string;
};

const emailSchema = z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address.");

/** Mirrors the `owner_profiles_username_format` constraint in the database. */
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Usernames must be at least 3 characters long.")
  .max(30, "Usernames can be at most 30 characters long.")
  .regex(
    /^[a-zA-Z][a-zA-Z0-9._-]{2,29}$/,
    "Usernames must start with a letter and use only letters, numbers, dots, hyphens or underscores.",
  );

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  username: usernameSchema,
  email: emailSchema,
  password: z.string().min(8, "Passwords must be at least 8 characters long."),
});

const signInSchema = z.object({
  // Accepts a username or an email. People forget which handle they picked;
  // rejecting a correct email would be a pointless dead end.
  identifier: z.string().trim().min(1, "Enter your username or email."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * Resolves a username to the email Supabase Auth actually signs in with.
 *
 * Runs through the service role because the underlying function is not
 * executable by `anon` or `authenticated` — a public username must never be
 * convertible into a private email address from the browser. The resolved
 * address is used to call signInWithPassword and is never returned to the
 * client.
 */
async function resolveLoginEmail(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("email_for_username", {
      lookup_username: identifier,
    });
    if (error) {
      console.error("[auth] Failed to resolve username", error);
      return null;
    }
    return data ?? null;
  } catch (error) {
    // Missing service role key, most likely. Surface it in the logs rather
    // than telling the visitor their password is wrong.
    console.error("[auth] Username lookup is unavailable", error);
    return null;
  }
}

/**
 * Only same-origin, absolute-path redirects are honoured, so a crafted
 * `?next=https://evil.example` can't turn login into an open redirect.
 */
function safeRedirectPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

export async function signUp(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const supabase = await createClient();

  // Check the handle up front so the user gets a clear message instead of a
  // constraint violation. The unique index is still the real guard — two
  // simultaneous signups can pass this check, and the second one then fails
  // its insert, which rolls back the whole auth user rather than creating a
  // duplicate.
  const { data: available } = await supabase.rpc("is_username_available", {
    candidate: parsed.data.username,
  });
  if (available === false) {
    return { error: `The username "${parsed.data.username}" is taken. Try another one.` };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, username: parsed.data.username },
      emailRedirectTo: absoluteUrl("/auth/callback"),
    },
  });

  if (error) return { error: error.message };

  // When email confirmation is on, Supabase returns a user with no session.
  if (!data.session) {
    return {
      notice: "Check your inbox — we sent you a link to confirm your email address and finish signing up.",
    };
  }

  redirect("/dashboard");
}

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  // One message for every failure — unknown username, unknown email, wrong
  // password. Distinguishing them would let anyone probe which handles exist.
  const genericError = "That username and password combination doesn't match an account.";

  const email = await resolveLoginEmail(parsed.data.identifier);
  if (!email) return { error: genericError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) return { error: genericError };

  redirect(safeRedirectPath(formData.get("next")));
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: absoluteUrl("/auth/callback?next=/dashboard/settings"),
  });

  // Always the same response, whether or not the address is registered.
  return { notice: "If that address has a Petnote account, a password reset link is on its way." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
