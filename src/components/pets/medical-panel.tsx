import Link from "next/link";
import { Pill, Sparkles, Stethoscope } from "lucide-react";

import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/forms/delete-button";
import { Field, FieldGrid, SelectField } from "@/components/forms/field";
import { RecordList, RecordRow } from "@/components/motion/record-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addMedicalRecord,
  addMedication,
  deleteMedicalRecord,
  deleteMedication,
  setMedicationActive,
} from "@/lib/actions/medical";
import type { MedicalRecord, Medication } from "@/lib/database.types";
import { MEDICAL_RECORD_TYPE_LABELS, formatDate, pluralize, todayIso } from "@/lib/format";
import type { PlanLimits } from "@/lib/plans";

const RECORD_TYPE_OPTIONS = Object.entries(MEDICAL_RECORD_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function MedicalPanel({
  petId,
  records,
  medications,
  limits,
  hiddenRecordCount,
  hiddenMedicationCount,
}: {
  petId: string;
  /** Newest first, already trimmed to the plan's history window. */
  records: MedicalRecord[];
  /** Newest first, already trimmed to the plan's history window. */
  medications: Medication[];
  limits: PlanLimits;
  /** Visits beyond the Free plan's window, so we can say what's hidden. */
  hiddenRecordCount: number;
  /** Medications beyond the Free plan's window. */
  hiddenMedicationCount: number;
}) {
  const activeMedications = medications.filter((medication) => medication.active);
  const pastMedications = medications.filter((medication) => !medication.active);
  const entryLimit = limits.medicalHistoryEntries;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Visits, surgeries & procedures</CardTitle>
            <CardDescription>
              {entryLimit === null
                ? "The full history a new vet would want to see."
                : `The ${entryLimit} most recent entries on your Free plan.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {records.length === 0 ? (
              <EmptyState
                icon={<Stethoscope />}
                title="No medical records yet"
                description="Log vet visits, diagnoses and treatments so nothing lives only in your memory."
              />
            ) : (
              <RecordList className="divide-y divide-border">
                {records.map((record) => (
                  <RecordRow
                    key={record.id}
                    id={record.id}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {record.reason ?? MEDICAL_RECORD_TYPE_LABELS[record.record_type]}
                        </p>
                        <Badge variant="outline">
                          {MEDICAL_RECORD_TYPE_LABELS[record.record_type]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(record.visit_date)}
                        {record.vet_name ? ` · ${record.vet_name}` : ""}
                      </p>
                      {record.diagnosis ? (
                        <p className="mt-2 text-sm text-foreground">
                          <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                        </p>
                      ) : null}
                      {record.treatment ? (
                        <p className="mt-1 text-sm text-foreground">
                          <span className="font-medium">Treatment:</span> {record.treatment}
                        </p>
                      ) : null}
                    </div>
                    <DeleteButton
                      action={deleteMedicalRecord}
                      payload={{ id: record.id, pet_id: petId }}
                      title="Delete this medical record?"
                      description="This entry will be removed from the medical history. This can't be undone."
                    />
                  </RecordRow>
                ))}
              </RecordList>
            )}

            <HiddenHistoryNotice count={hiddenRecordCount} noun="record" limit={entryLimit} />
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Add a record</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={addMedicalRecord} submitLabel="Add record" resetOnSuccess>
              <input type="hidden" name="pet_id" value={petId} />

              <FieldGrid>
                <Field label="Type" htmlFor="record_type" required>
                  <SelectField name="record_type" defaultValue="visit" options={RECORD_TYPE_OPTIONS} />
                </Field>
                <Field label="Date" htmlFor="visit_date" required>
                  <Input id="visit_date" name="visit_date" type="date" defaultValue={todayIso()} required />
                </Field>
              </FieldGrid>

              <Field label="Reason for visit" htmlFor="reason">
                <Input id="reason" name="reason" placeholder="Limping on front left leg" />
              </Field>

              <Field label="Diagnosis" htmlFor="diagnosis">
                <Textarea id="diagnosis" name="diagnosis" rows={2} placeholder="Mild sprain" />
              </Field>

              <Field label="Treatment" htmlFor="treatment">
                <Textarea id="treatment" name="treatment" rows={2} placeholder="Rest for 10 days, anti-inflammatory" />
              </Field>

              <Field label="Vet / clinic" htmlFor="vet_name">
                <Input id="vet_name" name="vet_name" placeholder="Dr. Patel, Bayside Vets" />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Medications</CardTitle>
            <CardDescription>
              Anything marked active appears on the public Emergency Mode page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {medications.length === 0 ? (
              <EmptyState
                icon={<Pill />}
                title="No medications recorded"
                description="Add current medications so they're visible to a vet in an emergency."
              />
            ) : (
              <>
                <MedicationList
                  heading="Currently taking"
                  petId={petId}
                  medications={activeMedications}
                  emptyLabel="No active medications."
                />
                {pastMedications.length > 0 ? (
                  <MedicationList heading="Past medications" petId={petId} medications={pastMedications} />
                ) : null}
              </>
            )}

            <HiddenHistoryNotice
              count={hiddenMedicationCount}
              noun="medication"
              limit={entryLimit}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Add a medication</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={addMedication} submitLabel="Add medication" resetOnSuccess>
              <input type="hidden" name="pet_id" value={petId} />

              <Field label="Name" htmlFor="medication_name" required>
                <Input id="medication_name" name="name" placeholder="Apoquel" required maxLength={120} />
              </Field>

              <FieldGrid>
                <Field label="Dosage" htmlFor="dosage">
                  <Input id="dosage" name="dosage" placeholder="5.4 mg" />
                </Field>
                <Field label="Frequency" htmlFor="frequency">
                  <Input id="frequency" name="frequency" placeholder="Twice daily" />
                </Field>
                <Field label="Start date" htmlFor="start_date">
                  <Input id="start_date" name="start_date" type="date" />
                </Field>
                <Field label="End date" htmlFor="end_date">
                  <Input id="end_date" name="end_date" type="date" />
                </Field>
              </FieldGrid>

              <label className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="size-4 rounded border-input accent-[var(--brand-primary)]"
                />
                Currently taking this
              </label>

              <Field label="Notes" htmlFor="medication_notes">
                <Textarea id="medication_notes" name="notes" rows={2} placeholder="Give with food" />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Tells a Free user what the plan is holding back, without implying it's gone.
 *
 * The wording matters: these rows are still in the database and come straight
 * back on upgrade, so this says "hidden", never "deleted".
 */
function HiddenHistoryNotice({
  count,
  noun,
  limit,
}: {
  count: number;
  noun: "record" | "medication";
  limit: number | null;
}) {
  if (count <= 0 || limit === null) return null;

  return (
    <Alert variant="info">
      <Sparkles />
      <AlertDescription>
        <span className="font-semibold">
          {pluralize(count, `older ${noun}`)} {count === 1 ? "is" : "are"} hidden.
        </span>{" "}
        The Free plan shows the {limit} most recent. Pro shows the complete medical history — and
        your older entries are still saved, waiting for you.{" "}
        <Link href="/dashboard/billing" className="font-semibold underline underline-offset-2">
          See Pro
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}

function MedicationList({
  heading,
  petId,
  medications,
  emptyLabel,
}: {
  heading: string;
  petId: string;
  medications: Medication[];
  emptyLabel?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      {medications.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <RecordList className="divide-y divide-border">
          {medications.map((medication) => (
            <RecordRow
              key={medication.id}
              id={medication.id}
              // Two action buttons plus a drug name squeeze badly under ~500px,
              // so the actions drop onto their own line instead of crushing the
              // name into three wrapped words.
              className="flex flex-wrap items-start gap-x-2 gap-y-1 py-3 first:pt-0 last:pb-0"
            >
              <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                <p className="font-medium text-foreground">{medication.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[medication.dosage, medication.frequency].filter(Boolean).join(" · ") || "No dosage recorded"}
                </p>
                {medication.start_date || medication.end_date ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(medication.start_date)} → {formatDate(medication.end_date)}
                  </p>
                ) : null}
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <form action={setMedicationActive}>
                  <input type="hidden" name="id" value={medication.id} />
                  <input type="hidden" name="pet_id" value={petId} />
                  <input type="hidden" name="active" value={medication.active ? "false" : "true"} />
                  <Button type="submit" variant="ghost" size="sm">
                    {medication.active ? "Mark ended" : "Reactivate"}
                  </Button>
                </form>
                <DeleteButton
                  action={deleteMedication}
                  payload={{ id: medication.id, pet_id: petId }}
                  title="Delete this medication?"
                  description={`"${medication.name}" will be removed, including from Emergency Mode. This can't be undone.`}
                />
              </div>
            </RecordRow>
          ))}
        </RecordList>
      )}
    </div>
  );
}
