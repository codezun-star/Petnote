import type { Metadata } from "next";
import Link from "next/link";

import { signIn } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Petnote account to manage your pet's health records.",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;
  // Fixed copy behind a flag rather than text read out of the URL — this page
  // is where a stranger's link is most likely to be opened.
  const deleted = searchParams.deleted === "1";

  return (
    <>
      {deleted ? (
        <Alert variant="success" className="mb-4">
          <AlertDescription>
            Your account and everything in it have been deleted. Thanks for giving Petnote a go.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Log in to pick up where you left off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <AuthForm
            action={signIn}
            next={next}
            initialError={error}
            submitLabel="Log in"
            pendingLabel="Logging in…"
            fields={[
              {
                name: "identifier",
                label: "Username",
                type: "text",
                placeholder: "alexrivera",
                autoComplete: "username",
                hint: "You can also use the email address on your account.",
              },
              {
                name: "password",
                label: "Password",
                type: "password",
                placeholder: "••••••••",
                autoComplete: "current-password",
              },
            ]}
          />

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot your password?
              </Link>
            </p>
            <p>
              New to Petnote?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
