import type { Metadata } from "next";
import Link from "next/link";

import { signUp } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free Petnote account and start organizing your pet's health records.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your free account</CardTitle>
        <CardDescription>
          One pet, full health history and an Emergency Mode QR code — no card required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AuthForm
          action={signUp}
          submitLabel="Create account"
          pendingLabel="Creating account…"
          fields={[
            {
              name: "fullName",
              label: "Your name",
              type: "text",
              placeholder: "Alex Rivera",
              autoComplete: "name",
            },
            {
              name: "email",
              label: "Email",
              type: "email",
              placeholder: "you@example.com",
              autoComplete: "email",
            },
            {
              name: "password",
              label: "Password",
              type: "password",
              placeholder: "At least 8 characters",
              autoComplete: "new-password",
              hint: "Use at least 8 characters.",
            },
          ]}
        />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
