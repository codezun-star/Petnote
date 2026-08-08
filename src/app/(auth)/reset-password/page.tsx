import type { Metadata } from "next";
import Link from "next/link";

import { updatePassword } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Petnote account.",
  robots: { index: false, follow: false },
};

/**
 * Where the emailed reset link lands, by way of `/auth/callback`.
 *
 * The callback has already exchanged the link's code for a session by the time
 * this renders, so the visitor is signed in — that session *is* the proof of
 * identity, which is why this form asks only for the new password. No session
 * means the link was stale, and there is nothing to update.
 */
export default async function ResetPasswordPage() {
  const user = await getUser();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">That link has expired</CardTitle>
          <CardDescription>
            Reset links can only be used once, and they have to be opened in the same browser that
            asked for them. Request a fresh one and you&apos;ll be straight back here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Send me a new reset link
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          Pick something you haven&apos;t used elsewhere. You&apos;ll use it to log in from now on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AuthForm
          action={updatePassword}
          submitLabel="Update password"
          pendingLabel="Updating…"
          fields={[
            {
              name: "password",
              label: "New password",
              type: "password",
              placeholder: "••••••••",
              autoComplete: "new-password",
              hint: `At least ${MIN_PASSWORD_LENGTH} characters.`,
            },
            {
              name: "confirmPassword",
              label: "Confirm new password",
              type: "password",
              placeholder: "••••••••",
              autoComplete: "new-password",
            },
          ]}
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            Go to your dashboard
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
