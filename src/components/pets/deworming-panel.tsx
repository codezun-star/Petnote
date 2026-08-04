import { Bug } from "lucide-react";

import { DueBadge } from "@/components/dashboard/due-badge";
import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/forms/delete-button";
import { Field, FieldGrid, SelectField } from "@/components/forms/field";
import { RecordList, RecordRow } from "@/components/motion/record-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDeworming, deleteDeworming } from "@/lib/actions/health";
import type { DewormingRecord } from "@/lib/database.types";
import { formatDate, todayIso } from "@/lib/format";

const TYPE_OPTIONS = [
  { value: "internal", label: "Internal (worms)" },
  { value: "external", label: "External (fleas & ticks)" },
  { value: "both", label: "Internal + external" },
];

const TYPE_LABELS: Record<string, string> = {
  internal: "Internal",
  external: "External",
  both: "Internal + external",
};

export function DewormingPanel({
  petId,
  records,
}: {
  petId: string;
  records: DewormingRecord[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="min-w-0 lg:col-span-3">
        <CardHeader>
          <CardTitle>Deworming & parasite control</CardTitle>
          <CardDescription>
            Internal treatments, flea and tick products — with the next treatment date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState
              icon={<Bug />}
              title="No treatments recorded"
              description="Log the last deworming or flea treatment to start the reminder cycle."
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
                        {record.product_used ?? TYPE_LABELS[record.type]}
                      </p>
                      {record.next_due_date ? <DueBadge date={record.next_due_date} /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {TYPE_LABELS[record.type]} · Given {formatDate(record.date_administered)}
                    </p>
                    {record.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{record.notes}</p>
                    ) : null}
                  </div>
                  <DeleteButton
                    action={deleteDeworming}
                    payload={{ id: record.id, pet_id: petId }}
                    title="Delete this treatment record?"
                    description="This deworming record will be removed from the health history. This can't be undone."
                  />
                </RecordRow>
              ))}
            </RecordList>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0 lg:col-span-2">
        <CardHeader>
          <CardTitle>Add a treatment</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={addDeworming} submitLabel="Add treatment" resetOnSuccess>
            <input type="hidden" name="pet_id" value={petId} />

            <Field label="Type" htmlFor="type" required>
              <SelectField name="type" defaultValue="internal" options={TYPE_OPTIONS} required />
            </Field>

            <Field label="Product used" htmlFor="product_used">
              <Input id="product_used" name="product_used" placeholder="Milbemax, Bravecto…" />
            </Field>

            <FieldGrid>
              <Field label="Date given" htmlFor="deworming_date" required>
                <Input
                  id="deworming_date"
                  name="date_administered"
                  type="date"
                  defaultValue={todayIso()}
                  required
                />
              </Field>
              <Field label="Next due" htmlFor="deworming_next_due">
                <Input id="deworming_next_due" name="next_due_date" type="date" />
              </Field>
            </FieldGrid>

            <Field label="Notes" htmlFor="deworming_notes">
              <Textarea id="deworming_notes" name="notes" rows={2} placeholder="Dose, weight at time…" />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
