import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, FieldGrid } from "@/components/forms/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ACCOUNT_DELETION_PHRASE } from "@/lib/account";
import {
  changeEmail,
  changePassword,
  changeUsername,
  deleteAccount,
} from "@/lib/actions/account";
import { updateOwnerProfile } from "@/lib/actions/profile";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { requireAccount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * Fixed copy for the notices `/auth/callback` can send here.
 *
 * The messages are looked up by key rather than echoed from the query string —
 * a link that can put arbitrary text in an alert on a signed-in page is a
 * ready-made phishing surface.
 */
const NOTICES: Record<string, string> = {
  "email-change-pending":
    "Thanks — that confirmation is in. Your email address changes once the remaining link we sent has been opened too.",
  "email-change-done": "Your email address has been updated.",
};

export default async function SettingsPage(props: PageProps<"/dashboard/settings">) {
  const [account, searchParams] = await Promise.all([requireAccount(), props.searchParams]);
  const profile = account.profile;
  const notice = typeof searchParams.notice === "string" ? NOTICES[searchParams.notice] : undefined;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your contact details and how Petnote reaches you."
      />

      {notice ? (
        <Alert variant="success" className="mb-6">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <Alert variant="info" className="mb-6">
        <ShieldCheck />
        <AlertDescription>
          The contact details below are what Emergency Mode shows to whoever scans your pet&apos;s
          QR code. Nothing else from your account is made public.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-6">
          <ActionForm action={updateOwnerProfile} submitLabel="Save details" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  You
                </h2>
              </div>
              <FieldGrid>
                <Field label="Full name" htmlFor="full_name">
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profile?.full_name ?? ""}
                    placeholder="Alex Rivera"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone" htmlFor="phone" hint="Shown first on the emergency page.">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile?.phone ?? ""}
                    placeholder="+1 555 010 4477"
                    autoComplete="tel"
                  />
                </Field>
              </FieldGrid>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Emergency contact
              </h2>
              <FieldGrid>
                <Field label="Name" htmlFor="emergency_contact_name">
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    defaultValue={profile?.emergency_contact_name ?? ""}
                    placeholder="Sam Okafor"
                  />
                </Field>
                <Field label="Phone" htmlFor="emergency_contact_phone">
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    type="tel"
                    defaultValue={profile?.emergency_contact_phone ?? ""}
                    placeholder="+1 555 010 9922"
                  />
                </Field>
              </FieldGrid>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Your vet
              </h2>
              <FieldGrid>
                <Field label="Vet name" htmlFor="vet_name">
                  <Input
                    id="vet_name"
                    name="vet_name"
                    defaultValue={profile?.vet_name ?? ""}
                    placeholder="Dr. Patel"
                  />
                </Field>
                <Field label="Clinic" htmlFor="vet_clinic">
                  <Input
                    id="vet_clinic"
                    name="vet_clinic"
                    defaultValue={profile?.vet_clinic ?? ""}
                    placeholder="Bayside Veterinary"
                  />
                </Field>
                <Field label="Vet phone" htmlFor="vet_phone">
                  <Input
                    id="vet_phone"
                    name="vet_phone"
                    type="tel"
                    defaultValue={profile?.vet_phone ?? ""}
                    placeholder="+1 555 010 3311"
                  />
                </Field>
              </FieldGrid>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Reminders
              </h2>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="reminders_enabled"
                  defaultChecked={profile?.reminders_enabled ?? true}
                  className="mt-0.5 size-4 rounded border-input accent-[var(--brand-primary)]"
                />
                <span>
                  <span className="font-medium text-foreground">Email me before things fall due</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    One daily email covering anything due in the next 7 days, across all your pets.
                  </span>
                </span>
              </label>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Username
          </h2>
          <ActionForm action={changeUsername} submitLabel="Save username" className="space-y-4">
            <Field
              label="Username"
              htmlFor="username"
              hint="What you log in with. Letters, numbers, dots, hyphens and underscores; 3–30 characters."
            >
              <Input
                id="username"
                name="username"
                defaultValue={profile?.username ?? ""}
                placeholder="alexrivera"
                autoComplete="username"
                required
              />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Email
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Reminders go here, and it&apos;s how you get back in if you forget your password —
            which is why changing it takes your password and a confirmation link. Your current
            address stays in place until you&apos;ve confirmed the new one.
          </p>
          <ActionForm
            action={changeEmail}
            submitLabel="Send confirmation link"
            pendingLabel="Sending…"
            className="space-y-4"
          >
            <FieldGrid>
              <Field label="Current email" htmlFor="current_email">
                <Input id="current_email" value={account.email ?? "—"} readOnly disabled />
              </Field>
              <Field label="New email" htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>
            </FieldGrid>
            <Field label="Current password" htmlFor="emailCurrentPassword">
              <Input
                id="emailCurrentPassword"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Password
          </h2>
          <ActionForm
            action={changePassword}
            submitLabel="Update password"
            pendingLabel="Updating…"
            resetOnSuccess
            className="space-y-4"
          >
            <Field
              label="Current password"
              htmlFor="currentPassword"
              hint="Asked for so a borrowed session can't lock you out of your own account."
            >
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>
            <FieldGrid>
              <Field
                label="New password"
                htmlFor="password"
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              >
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field label="Confirm new password" htmlFor="confirmPassword">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </Field>
            </FieldGrid>
          </ActionForm>
        </CardContent>
      </Card>

      <Card className="mt-6 border-danger/40">
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-danger">
            Delete account
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            This deletes your account and everything attached to it: every pet profile, vaccine and
            deworming record, medical history, medication, weight entry, uploaded document and
            photo. Any Emergency Mode QR code you&apos;ve printed stops working immediately. It
            cannot be undone, and we can&apos;t get any of it back for you afterwards.
          </p>

          {account.plan === "pro" ? (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                Your Pro subscription is billed through Paddle and isn&apos;t cancelled by deleting
                your account. Cancel it from the billing page first, or you&apos;ll keep being
                charged for an account that no longer exists.
              </AlertDescription>
            </Alert>
          ) : null}

          <ActionForm
            action={deleteAccount}
            submitLabel="Delete my account"
            pendingLabel="Deleting…"
            submitVariant="danger"
            className="space-y-4"
          >
            <FieldGrid>
              <Field
                label={`Type ${ACCOUNT_DELETION_PHRASE} to confirm`}
                htmlFor="confirmation"
                hint="In capitals, exactly as shown."
              >
                <Input
                  id="confirmation"
                  name="confirmation"
                  placeholder={ACCOUNT_DELETION_PHRASE}
                  autoComplete="off"
                  required
                />
              </Field>
              <Field label="Current password" htmlFor="deleteCurrentPassword">
                <Input
                  id="deleteCurrentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </Field>
            </FieldGrid>
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
