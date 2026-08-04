"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatLongDate } from "@/lib/format";

export type WeightPoint = {
  /** ISO date, used as the category key. */
  date: string;
  weight: number;
};

// Single series, so identity never rests on color and no legend is needed —
// the card title names the measure. Brand primary carries the line; the grid
// and axes stay recessive so the data reads first.
const LINE_COLOR = "var(--brand-primary)";
const GRID_COLOR = "var(--border)";
const AXIS_TEXT_COLOR = "var(--muted-foreground)";

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type TooltipRenderProps = {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
};

function WeightTooltip({ active, payload, unit }: TooltipRenderProps & { unit: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as WeightPoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{formatLongDate(point.date)}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {point.weight.toFixed(1)} {unit}
      </p>
    </div>
  );
}

export function WeightChart({ data, unit }: { data: WeightPoint[]; unit: string }) {
  // A line needs two points to be a line. One entry renders as a single marker,
  // which Recharts handles, but a domain with no spread looks broken — so pad it.
  const weights = data.map((point) => point.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const padding = Math.max((max - min) * 0.2, 0.5);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: AXIS_TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            minTickGap={24}
          />
          <YAxis
            domain={[Number((min - padding).toFixed(1)), Number((max + padding).toFixed(1))]}
            tick={{ fill: AXIS_TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => `${value} ${unit}`}
          />
          <Tooltip
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
            content={(props) => <WeightTooltip {...props} unit={unit} />}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: LINE_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: LINE_COLOR, stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
