import Link from "next/link";
import { Download, Scale, Sparkles } from "lucide-react";

import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/forms/delete-button";
import { Field, FieldGrid, SelectField } from "@/components/forms/field";
import { WeightChart, type WeightPoint } from "@/components/pets/weight-chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { addWeightLog, deleteWeightLog } from "@/lib/actions/weight";
import type { WeightLog } from "@/lib/database.types";
import { formatDate, todayIso } from "@/lib/format";
import type { PlanLimits } from "@/lib/plans";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "lb", label: "lb" },
];

export function WeightPanel({
  petId,
  logs,
  defaultUnit,
  limits,
  hiddenCount,
}: {
  petId: string;
  /** Newest first, already trimmed to the plan's history window. */
  logs: WeightLog[];
  defaultUnit: string;
  limits: PlanLimits;
  /** Entries outside the Free plan's window, so we can say what's hidden. */
  hiddenCount: number;
}) {
  const unit = logs[0]?.unit ?? defaultUnit;
  const chartData: WeightPoint[] = [...logs]
    .reverse()
    .map((log) => ({ date: log.logged_at, weight: Number(log.weight) }));

  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const change = first && last ? last.weight - first.weight : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Weight over time ({unit})</CardTitle>
            <CardDescription>
              {chartData.length >= 2
                ? `${change >= 0 ? "Up" : "Down"} ${Math.abs(change).toFixed(1)} ${unit} across ${chartData.length} entries.`
                : "Log at least two entries to see a trend."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyState
                icon={<Scale />}
                title="No weight entries yet"
                description="Weigh your pet at each vet visit — steady tracking catches problems early."
              />
            ) : (
              <WeightChart data={chartData} unit={unit} />
            )}
          </CardContent>
        </Card>

        {hiddenCount > 0 ? (
          <Alert variant="info">
            <Sparkles />
            <AlertDescription>
              <span className="font-semibold">
                {hiddenCount} older {hiddenCount === 1 ? "entry is" : "entries are"} hidden.
              </span>{" "}
              The Free plan charts the last 3 months. Pro shows the full history and exports it to
              CSV.{" "}
              <Link href="/dashboard/billing" className="font-semibold underline underline-offset-2">
                See Pro
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {logs.length > 0 ? (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>All entries</CardTitle>
              {limits.canExportWeightHistory ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/pets/${petId}/weight.csv`} download>
                    <Download />
                    Export CSV
                  </a>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {/* Doubles as the chart's accessible table view. */}
              <table className="w-full text-sm">
                <caption className="sr-only">Recorded weight entries, newest first</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="pb-2 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="pb-2 font-semibold">
                      Weight
                    </th>
                    <th scope="col" className="pb-2 font-semibold">
                      Note
                    </th>
                    <th scope="col" className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 text-muted-foreground">{formatDate(log.logged_at)}</td>
                      <td className="py-2.5 font-medium text-foreground">
                        {Number(log.weight).toFixed(1)} {log.unit}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{log.note ?? "—"}</td>
                      <td className="py-1 text-right">
                        <DeleteButton
                          action={deleteWeightLog}
                          payload={{ id: log.id, pet_id: petId }}
                          title="Delete this weight entry?"
                          description="This entry will be removed from the chart and history. This can't be undone."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="lg:col-span-2 lg:self-start">
        <CardHeader>
          <CardTitle>Log a weight</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={addWeightLog} submitLabel="Log weight" resetOnSuccess>
            <input type="hidden" name="pet_id" value={petId} />

            <FieldGrid>
              <Field label="Weight" htmlFor="weight" required>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="999"
                    placeholder="12.4"
                    required
                  />
                  <SelectField
                    name="unit"
                    defaultValue={unit}
                    options={UNIT_OPTIONS}
                    className="w-24 shrink-0"
                  />
                </div>
              </Field>
              <Field label="Date" htmlFor="logged_at" required>
                <Input id="logged_at" name="logged_at" type="date" defaultValue={todayIso()} required />
              </Field>
            </FieldGrid>

            <Field label="Note" htmlFor="note">
              <Input id="note" name="note" placeholder="Weighed at the clinic" />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
