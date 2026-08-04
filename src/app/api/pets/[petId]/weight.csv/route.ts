import { NextResponse, type NextRequest } from "next/server";

import { requireAccount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/** RFC 4180 escaping — quote the field and double any inner quotes. */
function csvCell(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV export of a pet's full weight history. Pro only — the Free plan's
 * chart already stops at 3 months.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/api/pets/[petId]/weight.csv">) {
  const { petId } = await context.params;
  const account = await requireAccount();

  if (!account.limits.canExportWeightHistory) {
    return NextResponse.json(
      { error: "CSV export is a Pro feature." },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  // RLS scopes this to the caller, so an unowned id simply isn't found.
  const { data: pet } = await supabase.from("pets").select("name").eq("id", petId).maybeSingle();
  if (!pet) return NextResponse.json({ error: "Pet not found." }, { status: 404 });

  const { data: logs } = await supabase
    .from("weight_logs")
    .select("logged_at, weight, unit, note")
    .eq("pet_id", petId)
    .order("logged_at", { ascending: true });

  const rows = [
    ["date", "weight", "unit", "note"],
    ...(logs ?? []).map((log) => [log.logged_at, String(log.weight), log.unit, log.note ?? ""]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const fileName = `${pet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-weight-history.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
