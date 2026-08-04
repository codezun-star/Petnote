import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Phone, PawPrint, Pill, Stethoscope, User } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import type { EmergencyProfile } from "@/lib/database.types";
import { SPECIES_LABELS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

/**
 * Public, unauthenticated Emergency Mode page.
 *
 * Reads through `get_emergency_profile`, a SECURITY DEFINER function that
 * returns a fixed set of columns — the pets table itself is never exposed to
 * the `anon` role.
 */
async function loadProfile(publicId: string): Promise<EmergencyProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_emergency_profile", {
    lookup_public_id: publicId,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as EmergencyProfile;
}

export async function generateMetadata(
  props: PageProps<"/emergency/[publicId]">,
): Promise<Metadata> {
  const { publicId } = await props.params;
  const profile = await loadProfile(publicId);

  return {
    title: profile ? `${profile.pet_name} — Emergency information` : "Emergency information",
    description: profile
      ? `Emergency contact details and medical information for ${profile.pet_name}.`
      : "Petnote emergency information.",
    // A pet's medical details and an owner's phone number have no business in
    // a search index.
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function EmergencyPage(props: PageProps<"/emergency/[publicId]">) {
  const { publicId } = await props.params;
  const profile = await loadProfile(publicId);
  if (!profile) notFound();

  const contacts = [
    {
      icon: User,
      label: profile.owner_name ? `${profile.owner_name} (owner)` : "Owner",
      phone: profile.owner_phone,
      primary: true,
    },
    {
      icon: Phone,
      label: profile.emergency_contact_name
        ? `${profile.emergency_contact_name} (emergency contact)`
        : "Emergency contact",
      phone: profile.emergency_contact_phone,
      primary: false,
    },
    {
      icon: Stethoscope,
      label: [profile.vet_name, profile.vet_clinic].filter(Boolean).join(" · ") || "Veterinarian",
      phone: profile.vet_phone,
      primary: false,
    },
  ].filter((contact) => Boolean(contact.phone));

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-4 py-8">
        <header className="mb-6 text-center">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
            <AlertTriangle className="size-3.5" />
            Emergency information
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{profile.pet_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SPECIES_LABELS[profile.species] ?? "Pet"}
            {profile.breed ? ` · ${profile.breed}` : ""}
          </p>
        </header>

        <div className="mb-6 flex justify-center">
          <div className="relative size-40 overflow-hidden rounded-full border-4 border-white bg-primary-soft shadow-sm">
            {profile.photo_url ? (
              <Image
                src={profile.photo_url}
                alt={profile.pet_name}
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <PawPrint className="size-16" />
              </div>
            )}
          </div>
        </div>

        {contacts.length > 0 ? (
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Call for help
            </h2>
            <ul className="space-y-2">
              {contacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <li key={`${contact.label}-${contact.phone}`}>
                    {/* A tap-to-call target is the single most useful thing on
                        this page — keep it large and unmissable. */}
                    <a
                      href={`tel:${contact.phone!.replace(/[^\d+]/g, "")}`}
                      className={
                        contact.primary
                          ? "flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary-hover"
                          : "flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-foreground transition-colors hover:border-primary/30"
                      }
                    >
                      <span
                        className={
                          contact.primary
                            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15"
                            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
                        }
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm opacity-80">{contact.label}</span>
                        <span className="block truncate text-lg font-bold">{contact.phone}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <p className="mb-5 rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            No contact number has been added for this pet yet.
          </p>
        )}

        {profile.allergies ? (
          <section className="mb-4 rounded-xl border-2 border-danger/30 bg-danger/10 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-danger">
              <AlertTriangle className="size-4" />
              Allergies
            </h2>
            <p className="mt-1.5 text-base font-medium text-foreground">{profile.allergies}</p>
          </section>
        ) : null}

        {profile.medications.length > 0 ? (
          <section className="mb-4 rounded-xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
              <Pill className="size-4" />
              Current medications
            </h2>
            <ul className="mt-2 space-y-2">
              {profile.medications.map((medication, index) => (
                <li key={`${medication.name}-${index}`} className="text-sm">
                  <span className="font-semibold text-foreground">{medication.name}</span>
                  {medication.dosage || medication.frequency ? (
                    <span className="text-muted-foreground">
                      {" — "}
                      {[medication.dosage, medication.frequency].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!profile.allergies && profile.medications.length === 0 ? (
          <p className="mb-4 rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            No known allergies or current medications on record.
          </p>
        ) : null}

        <footer className="mt-8 text-center">
          <Link href="/" className="inline-flex" aria-label="Petnote home">
            <Logo />
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            This page was shared by {profile.pet_name}&apos;s owner through Petnote.
          </p>
        </footer>
      </div>
    </div>
  );
}
