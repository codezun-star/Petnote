import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PetAvatar } from "@/components/dashboard/pet-avatar";
import { DewormingPanel } from "@/components/pets/deworming-panel";
import { DocumentsPanel } from "@/components/pets/documents-panel";
import { MedicalPanel } from "@/components/pets/medical-panel";
import { PetOverview } from "@/components/pets/pet-overview";
import { PetTabs } from "@/components/pets/pet-tabs";
import { VaccinesPanel } from "@/components/pets/vaccines-panel";
import { WeightPanel } from "@/components/pets/weight-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEX_LABELS, SPECIES_LABELS, formatAge, formatWeight } from "@/lib/format";
import { countDocuments, getPet, requireAccount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pet",
  robots: { index: false, follow: false },
};

export default async function PetDetailPage(props: PageProps<"/dashboard/pets/[petId]">) {
  const { petId } = await props.params;
  const searchParams = await props.searchParams;

  const [account, pet] = await Promise.all([requireAccount(), getPet(petId)]);
  if (!pet) notFound();

  const supabase = await createClient();

  const [vaccines, deworming, medicalRecords, medications, weightLogs, documents, documentCount] =
    await Promise.all([
      supabase
        .from("vaccines")
        .select("*")
        .eq("pet_id", pet.id)
        .order("date_administered", { ascending: false }),
      supabase
        .from("deworming_records")
        .select("*")
        .eq("pet_id", pet.id)
        .order("date_administered", { ascending: false }),
      supabase
        .from("medical_records")
        .select("*")
        .eq("pet_id", pet.id)
        .order("visit_date", { ascending: false }),
      supabase
        .from("medications")
        .select("*")
        .eq("pet_id", pet.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("weight_logs")
        .select("*")
        .eq("pet_id", pet.id)
        .order("logged_at", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("pet_id", pet.id)
        .order("uploaded_at", { ascending: false }),
      countDocuments(),
    ]);

  // The Free plan charts a rolling window rather than deleting history — the
  // rows stay, they're just not shown until the user upgrades.
  const allWeightLogs = weightLogs.data ?? [];
  let visibleWeightLogs = allWeightLogs;
  if (account.limits.weightHistoryDays !== null) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - account.limits.weightHistoryDays);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    visibleWeightLogs = allWeightLogs.filter((log) => log.logged_at >= cutoffIso);
  }

  const age = formatAge(pet.date_of_birth);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/dashboard/pets">
          <ArrowLeft />
          All pets
        </Link>
      </Button>

      {searchParams.photoError ? (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>
            {pet.name}&apos;s profile was created, but the photo couldn&apos;t be uploaded. Try
            adding it again below — photos must be under 5 MB.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <PetAvatar name={pet.name} photoUrl={pet.photo_url} size={72} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{pet.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SPECIES_LABELS[pet.species]}
            {pet.breed ? ` · ${pet.breed}` : ""}
            {age ? ` · ${age}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pet.sex ? <Badge variant="outline">{SEX_LABELS[pet.sex]}</Badge> : null}
            {pet.current_weight ? (
              <Badge variant="outline">{formatWeight(pet.current_weight, pet.weight_unit)}</Badge>
            ) : null}
            {pet.allergies ? <Badge variant="danger">Allergies</Badge> : null}
            {pet.emergency_enabled ? (
              <Badge variant="fresh">Emergency Mode on</Badge>
            ) : (
              <Badge variant="outline">Emergency Mode off</Badge>
            )}
          </div>
        </div>
      </div>

      <PetTabs
        panels={{
          overview: <PetOverview pet={pet} />,
          vaccines: <VaccinesPanel petId={pet.id} vaccines={vaccines.data ?? []} />,
          deworming: <DewormingPanel petId={pet.id} records={deworming.data ?? []} />,
          medical: (
            <MedicalPanel
              petId={pet.id}
              records={medicalRecords.data ?? []}
              medications={medications.data ?? []}
            />
          ),
          weight: (
            <WeightPanel
              petId={pet.id}
              logs={visibleWeightLogs}
              defaultUnit={pet.weight_unit}
              limits={account.limits}
              hiddenCount={allWeightLogs.length - visibleWeightLogs.length}
            />
          ),
          documents: (
            <DocumentsPanel
              petId={pet.id}
              documents={documents.data ?? []}
              limits={account.limits}
              documentCount={documentCount}
            />
          ),
        }}
      />
    </>
  );
}
