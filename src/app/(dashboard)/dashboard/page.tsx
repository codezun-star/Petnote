import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  PawPrint,
  Plus,
  QrCode,
  Syringe,
} from "lucide-react";

import { DueBadge } from "@/components/dashboard/due-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { PetAvatar } from "@/components/dashboard/pet-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SPECIES_LABELS, daysUntil, formatAge, formatWeight } from "@/lib/format";
import { listPets, listUpcomingItems, requireAccount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const [account, pets, upcoming] = await Promise.all([
    requireAccount(),
    listPets(),
    listUpcomingItems(60),
  ]);

  const overdue = upcoming.filter((item) => daysUntil(item.nextDueDate) < 0);
  const dueSoon = upcoming.filter((item) => {
    const days = daysUntil(item.nextDueDate);
    return days >= 0 && days <= 30;
  });

  const profileIncomplete = !account.profile?.phone && !account.profile?.emergency_contact_phone;

  if (pets.length === 0) {
    return (
      <>
        <PageHeader
          title={`Welcome to Petnote${account.profile?.full_name ? `, ${account.profile.full_name.split(" ")[0]}` : ""}`}
          description="Add your first pet to start building their health record."
        />
        <EmptyState
          icon={<PawPrint />}
          title="No pets yet"
          description="Create a profile for your pet and Petnote will keep their vaccines, medical history, weight and documents in one place."
          action={
            <Button asChild>
              <Link href="/dashboard/pets/new">
                <Plus />
                Add your first pet
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything that needs your attention, across all your pets."
        action={
          <Button asChild>
            <Link href="/dashboard/pets/new">
              <Plus />
              Add pet
            </Link>
          </Button>
        }
      />

      {profileIncomplete ? (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle />
          <AlertDescription>
            <span className="font-semibold">Add your contact details.</span> Emergency Mode shows
            your phone number to whoever finds your pet — right now it has nothing to display.{" "}
            <Link href="/dashboard/settings" className="font-semibold underline underline-offset-2">
              Add them now
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pets" value={String(pets.length)} icon={<PawPrint />} />
        <StatCard
          label="Overdue"
          value={String(overdue.length)}
          icon={<AlertTriangle />}
          tone={overdue.length > 0 ? "danger" : "default"}
        />
        <StatCard label="Due in 30 days" value={String(dueSoon.length)} icon={<CalendarDays />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Coming up</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/calendar">View calendar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due in the next 60 days. Add vaccine or deworming records with a next due
                date and they&apos;ll show up here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.slice(0, 6).map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Syringe className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.petName} · {item.kind === "vaccine" ? "Vaccine" : "Deworming"}
                      </p>
                    </div>
                    <DueBadge date={item.nextDueDate} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your pets</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/pets">See all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {pets.map((pet) => {
                const age = formatAge(pet.date_of_birth);
                return (
                  <li key={pet.id}>
                    <Link
                      href={`/dashboard/pets/${pet.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <PetAvatar name={pet.name} photoUrl={pet.photo_url} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{pet.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {SPECIES_LABELS[pet.species]}
                          {age ? ` · ${age}` : ""}
                          {pet.current_weight
                            ? ` · ${formatWeight(pet.current_weight, pet.weight_unit)}`
                            : ""}
                        </p>
                      </div>
                      {pet.allergies ? <Badge variant="danger">Allergies</Badge> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <QuickLink
          href={`/dashboard/pets/${pets[0].id}/emergency`}
          icon={<QrCode />}
          title="Print an Emergency Mode tag"
          description="Download a QR code for your pet's collar. Always free, no login needed to view."
        />
        <QuickLink
          href={`/dashboard/pets/${pets[0].id}`}
          icon={<FileText />}
          title="Add a record"
          description="Log a vet visit, a vaccine, a weight entry or upload a document."
        />
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={
            tone === "danger"
              ? "flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger [&_svg]:size-5"
              : "flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary [&_svg]:size-5"
          }
        >
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-primary-soft/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-foreground [&_svg]:size-5">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
