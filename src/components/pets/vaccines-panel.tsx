import { Syringe } from "lucide-react";

import { DueBadge } from "@/components/dashboard/due-badge";
import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/forms/delete-button";
import { Field, FieldGrid } from "@/components/forms/field";
import { RecordList, RecordRow } from "@/components/motion/record-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addVaccine, deleteVaccine } from "@/lib/actions/health";
import type { Vaccine } from "@/lib/database.types";
import { formatDate, todayIso } from "@/lib/format";

export function VaccinesPanel({ petId, vaccines }: { petId: string; vaccines: Vaccine[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Vaccination history</CardTitle>
          <CardDescription>
            Records with a next due date feed the health calendar and your reminder emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vaccines.length === 0 ? (
            <EmptyState
              icon={<Syringe />}
              title="No vaccines recorded"
              description="Add the last shot your pet received and Petnote will remind you when the next one is due."
            />
          ) : (
            <RecordList className="divide-y divide-border">
              {vaccines.map((vaccine) => (
                <RecordRow
                  key={vaccine.id}
                  id={vaccine.id}
                  className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{vaccine.vaccine_type}</p>
                      {vaccine.next_due_date ? <DueBadge date={vaccine.next_due_date} /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Given {formatDate(vaccine.date_administered)}
                      {vaccine.administered_by ? ` · ${vaccine.administered_by}` : ""}
                    </p>
                    {vaccine.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{vaccine.notes}</p>
                    ) : null}
                  </div>
                  <DeleteButton
                    action={deleteVaccine}
                    payload={{ id: vaccine.id, pet_id: petId }}
                    title="Delete this vaccine record?"
                    description={`"${vaccine.vaccine_type}" will be removed from the health history. This can't be undone.`}
                  />
                </RecordRow>
              ))}
            </RecordList>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Add a vaccine</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={addVaccine} submitLabel="Add vaccine" resetOnSuccess>
            <input type="hidden" name="pet_id" value={petId} />

            <Field label="Vaccine" htmlFor="vaccine_type" required>
              <Input id="vaccine_type" name="vaccine_type" placeholder="Rabies" required maxLength={120} />
            </Field>

            <FieldGrid>
              <Field label="Date given" htmlFor="date_administered" required>
                <Input
                  id="date_administered"
                  name="date_administered"
                  type="date"
                  defaultValue={todayIso()}
                  required
                />
              </Field>
              <Field label="Next due" htmlFor="next_due_date">
                <Input id="next_due_date" name="next_due_date" type="date" />
              </Field>
            </FieldGrid>

            <Field label="Administered by" htmlFor="administered_by">
              <Input id="administered_by" name="administered_by" placeholder="Dr. Patel, Bayside Vets" />
            </Field>

            <Field label="Notes" htmlFor="vaccine_notes">
              <Textarea id="vaccine_notes" name="notes" rows={2} placeholder="Batch number, reaction…" />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
