import Link from "next/link";
import { AlertTriangle, QrCode } from "lucide-react";

import { PetForm } from "@/components/pets/pet-form";
import { DeleteButton } from "@/components/forms/delete-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deletePet, updatePet } from "@/lib/actions/pets";
import type { Pet } from "@/lib/database.types";

export function PetOverview({ pet }: { pet: Pet }) {
  return (
    <div className="space-y-6">
      {pet.allergies ? (
        <Alert variant="danger">
          <AlertTriangle />
          <AlertDescription>
            <span className="font-semibold">Allergies:</span> {pet.allergies}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Emergency Mode</CardTitle>
            <CardDescription>
              A public page and printable QR code showing {pet.name}&apos;s allergies, medications
              and your contact details. Always free.
            </CardDescription>
          </div>
          <Button asChild variant="fresh" className="shrink-0">
            <Link href={`/dashboard/pets/${pet.id}/emergency`}>
              <QrCode />
              QR code
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Keep this current — Emergency Mode reads from it.</CardDescription>
        </CardHeader>
        <CardContent>
          <PetForm
            action={updatePet}
            pet={pet}
            submitLabel="Save changes"
            cancelHref="/dashboard/pets"
          />
        </CardContent>
      </Card>

      <Card className="border-danger/20">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-danger">Delete {pet.name}</CardTitle>
            <CardDescription>
              Removes the profile and every vaccine, medical record, weight entry and document
              attached to it.
            </CardDescription>
          </div>
          <DeleteButton
            action={deletePet}
            payload={{ petId: pet.id }}
            variant="button"
            triggerLabel="Delete pet"
            confirmLabel="Delete permanently"
            title={`Delete ${pet.name}'s profile?`}
            description="Their entire health record — vaccines, medical history, weight entries and documents — will be permanently deleted. This can't be undone."
          />
        </CardHeader>
      </Card>
    </div>
  );
}
