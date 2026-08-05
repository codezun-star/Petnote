import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ActionForm } from "@/components/forms/action-form";
import { Field, FieldGrid } from "@/components/forms/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateOwnerProfile } from "@/lib/actions/profile";
import { requireAccount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const account = await requireAccount();
  const profile = account.profile;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your contact details and how Petnote reaches you."
      />

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
              <FieldGrid>
                <Field label="Username" htmlFor="username" hint="What you log in with.">
                  <Input id="username" value={profile?.username ?? "—"} readOnly disabled />
                </Field>
                <Field
                  label="Email"
                  htmlFor="email"
                  hint="Reminders are sent here. Contact support to change it."
                >
                  <Input id="email" value={account.email ?? ""} readOnly disabled />
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
    </>
  );
}
