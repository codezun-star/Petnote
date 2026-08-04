import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PetForm } from "@/components/pets/pet-form";
import { createPet } from "@/lib/actions/pets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isWithinLimit } from "@/lib/plans";
import { countPets, requireAccount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Add a pet",
  robots: { index: false, follow: false },
};

export default async function NewPetPage() {
  const [account, petCount] = await Promise.all([requireAccount(), countPets()]);

  // The action re-checks this; blocking here just avoids showing a form that
  // can only fail.
  if (!isWithinLimit(petCount, account.limits.maxPets)) {
    return (
      <>
        <PageHeader title="Add a pet" description="You've reached your plan's pet limit." />
        <Alert variant="info">
          <Sparkles />
          <AlertDescription className="space-y-3">
            <p>
              The Free plan includes one pet profile. Upgrade to Pro for unlimited pets, unlimited
              documents and your complete weight history.
            </p>
            <Button asChild variant="accent" size="sm">
              <Link href="/dashboard/billing">See Pro</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add a pet"
        description="Only the name and species are required — you can fill in the rest later."
      />
      <Card>
        <CardContent className="p-6">
          <PetForm action={createPet} submitLabel="Create profile" cancelHref="/dashboard/pets" />
        </CardContent>
      </Card>
    </>
  );
}
