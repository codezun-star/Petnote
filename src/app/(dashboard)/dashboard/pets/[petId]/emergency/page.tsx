import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";

import { QrCard } from "@/components/emergency/qr-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleEmergencyMode } from "@/lib/actions/pets";
import { getPet, requireAccount } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Emergency Mode",
  robots: { index: false, follow: false },
};

export default async function PetEmergencyPage(
  props: PageProps<"/dashboard/pets/[petId]/emergency">,
) {
  const { petId } = await props.params;
  const [account, pet] = await Promise.all([requireAccount(), getPet(petId)]);
  if (!pet) notFound();

  const emergencyUrl = absoluteUrl(`/emergency/${pet.public_id}`);
  const hasContactInfo = Boolean(
    account.profile?.phone ||
      account.profile?.emergency_contact_phone ||
      account.profile?.vet_phone,
  );

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 print:hidden">
        <Link href={`/dashboard/pets/${pet.id}`}>
          <ArrowLeft />
          Back to {pet.name}
        </Link>
      </Button>

      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Emergency Mode for {pet.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Print this QR code onto a collar tag. Anyone who scans it sees {pet.name}&apos;s
          allergies, current medications and your contact details — no account needed.
        </p>
      </div>

      {!hasContactInfo ? (
        <Alert variant="warning" className="mb-6 print:hidden">
          <AlertDescription>
            <span className="font-semibold">Add a phone number first.</span> Without one, the
            emergency page has no way for a finder to reach you.{" "}
            <Link href="/dashboard/settings" className="font-semibold underline underline-offset-2">
              Add contact details
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="print:hidden">
            <CardTitle>Scannable code</CardTitle>
            <CardDescription>Download it as a PNG or print this page directly.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 print:pt-6">
            <QrCard url={emergencyUrl} petName={pet.name} />
          </CardContent>
        </Card>

        <div className="space-y-6 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>What the page shows</CardTitle>
              <CardDescription>
                Deliberately narrow — nothing else from {pet.name}&apos;s record is exposed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground">
                {[
                  `${pet.name}'s name, photo, species and breed`,
                  "Allergies",
                  "Current medications",
                  "Your name and phone number",
                  "Your emergency contact",
                  "Your vet's name and phone number",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-fresh" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Medical history, weight entries, documents and notes stay private.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <a href={emergencyUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Preview the public page
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Link status</CardTitle>
              <CardDescription>
                Turning this off makes the page return &ldquo;not found&rdquo; — useful if a tag is
                lost.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={toggleEmergencyMode} className="flex items-center justify-between gap-4">
                <input type="hidden" name="petId" value={pet.id} />
                <input type="hidden" name="enabled" value={pet.emergency_enabled ? "false" : "true"} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {pet.emergency_enabled ? "Public link is active" : "Public link is disabled"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {pet.emergency_enabled
                      ? "Anyone with the QR code can view the page."
                      : "Scanning the code shows nothing until you turn this back on."}
                  </p>
                </div>
                <Button
                  type="submit"
                  variant={pet.emergency_enabled ? "outline" : "fresh"}
                  className="shrink-0"
                >
                  {pet.emergency_enabled ? "Disable" : "Enable"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
