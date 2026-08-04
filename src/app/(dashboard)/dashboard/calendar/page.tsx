import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarCheck, CalendarDays, Syringe } from "lucide-react";

import { DueBadge } from "@/components/dashboard/due-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLongDate, daysUntil } from "@/lib/format";
import { listUpcomingItems, requireAccount, type UpcomingItem } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Health calendar",
  robots: { index: false, follow: false },
};

export default async function CalendarPage() {
  const [account, items] = await Promise.all([requireAccount(), listUpcomingItems(365)]);

  const overdue = items.filter((item) => daysUntil(item.nextDueDate) < 0);
  const dueSoon = items.filter((item) => {
    const days = daysUntil(item.nextDueDate);
    return days >= 0 && days <= 30;
  });
  const later = items.filter((item) => daysUntil(item.nextDueDate) > 30);

  const remindersOn = account.profile?.reminders_enabled ?? true;

  return (
    <>
      <PageHeader
        title="Health calendar"
        description="Every vaccine and deworming treatment with a next due date, across all your pets."
      />

      <Card className="mb-6">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-foreground">
            <CalendarCheck className="size-5" />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              {remindersOn ? "Email reminders are on" : "Email reminders are off"}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {remindersOn
                ? "We email you once a day when something is due within the next 7 days."
                : "Turn reminders back on in Settings to get an email before things fall due."}{" "}
              <Link href="/dashboard/settings" className="font-medium text-primary hover:underline">
                Manage in Settings
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="Nothing scheduled"
          description="Add a next due date to a vaccine or deworming record and it will appear here."
        />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 ? (
            <CalendarSection
              title="Overdue"
              description="These slipped past their due date."
              items={overdue}
              tone="danger"
            />
          ) : null}
          {dueSoon.length > 0 ? (
            <CalendarSection
              title="Due in the next 30 days"
              description="Worth booking now."
              items={dueSoon}
            />
          ) : null}
          {later.length > 0 ? (
            <CalendarSection title="Later this year" description="Nothing to do yet." items={later} />
          ) : null}
        </div>
      )}
    </>
  );
}

function CalendarSection({
  title,
  description,
  items,
  tone = "default",
}: {
  title: string;
  description: string;
  items: UpcomingItem[];
  tone?: "default" | "danger";
}) {
  return (
    <Card className={tone === "danger" ? "border-danger/25" : undefined}>
      <CardHeader>
        <CardTitle className={tone === "danger" ? "flex items-center gap-2 text-danger" : undefined}>
          {tone === "danger" ? <AlertTriangle className="size-4" /> : null}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link
                href={`/dashboard/pets/${item.petId}`}
                className="flex items-center gap-3 py-3 transition-colors hover:opacity-80"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Syringe className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.petName} · {item.kind === "vaccine" ? "Vaccine" : "Deworming"} ·{" "}
                    {formatLongDate(item.nextDueDate)}
                  </p>
                </div>
                <DueBadge date={item.nextDueDate} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
