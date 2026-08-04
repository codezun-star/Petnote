"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";

export type AuthFormState = {
  error?: string;
  notice?: string;
};

const emailSchema = z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address.");

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  email: emailSchema,
  password: z.string().min(8, "Passwords must be at least 8 characters long."),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

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
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
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
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Don't leak whether the address exists.
    return { error: "That email and password combination doesn't match an account." };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeRedirectPath(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent("Google sign-in is unavailable right now.")}`);
  }

  redirect(data.url);
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
