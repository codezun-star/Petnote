import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint, Plus, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PetAvatar } from "@/components/dashboard/pet-avatar";
import { HoverLift } from "@/components/motion/cta";
import { StaggerItem, StaggerList } from "@/components/motion/primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SEX_LABELS, SPECIES_LABELS, formatAge, formatWeight } from "@/lib/format";
import { isWithinLimit } from "@/lib/plans";
import { listPets, requireAccount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My pets",
  robots: { index: false, follow: false },
};

export default async function PetsPage() {
  const [account, pets] = await Promise.all([requireAccount(), listPets()]);
  const canAddPet = isWithinLimit(pets.length, account.limits.maxPets);

  return (
    <>
      <PageHeader
        title="My pets"
        description="Every profile, with a full health record behind it."
        action={
          canAddPet ? (
            <Button asChild>
              <Link href="/dashboard/pets/new">
                <Plus />
                Add pet
              </Link>
            </Button>
          ) : (
            <Button asChild variant="accent">
              <Link href="/dashboard/billing">
                <Sparkles />
                Upgrade to add more
              </Link>
            </Button>
          )
        }
      />

      {!canAddPet ? (
        <Alert variant="info" className="mb-6">
          <Sparkles />
          <AlertDescription>
            You&apos;ve used your Free plan pet profile. Pro adds unlimited pets for the price of a
            coffee a month.{" "}
            <Link href="/dashboard/billing" className="font-semibold underline underline-offset-2">
              See Pro
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {pets.length === 0 ? (
        <EmptyState
          icon={<PawPrint />}
          title="No pets yet"
          description="Add your first pet to start tracking vaccines, weight and medical history."
          action={
            <Button asChild>
              <Link href="/dashboard/pets/new">
                <Plus />
                Add pet
              </Link>
            </Button>
          }
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pets.map((pet) => {
            const age = formatAge(pet.date_of_birth);
            return (
              <StaggerItem key={pet.id}>
                <HoverLift withShadow={false}>
                  <Card className="h-full transition-colors hover:border-primary/30">
                    <CardContent className="p-5">
                      <Link href={`/dashboard/pets/${pet.id}`} className="flex items-start gap-4">
                        <PetAvatar name={pet.name} photoUrl={pet.photo_url} size={56} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-foreground">
                            {pet.name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {SPECIES_LABELS[pet.species]}
                            {pet.breed ? ` · ${pet.breed}` : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {age ? <Badge variant="outline">{age}</Badge> : null}
                            {pet.sex ? <Badge variant="outline">{SEX_LABELS[pet.sex]}</Badge> : null}
                            {pet.current_weight ? (
                              <Badge variant="outline">
                                {formatWeight(pet.current_weight, pet.weight_unit)}
                              </Badge>
                            ) : null}
                            {pet.allergies ? <Badge variant="danger">Allergies</Badge> : null}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </>
  );
}
