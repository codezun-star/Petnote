import type { DocumentType, MedicalRecordType, Sex, Species } from "@/lib/database.types";

export const SPECIES_LABELS: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  rabbit: "Rabbit",
  bird: "Bird",
  reptile: "Reptile",
  rodent: "Small rodent",
  other: "Other",
};

export const SEX_LABELS: Record<Sex, string> = {
  male: "Male",
  female: "Female",
  unknown: "Unknown",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  lab_result: "Lab result",
  xray: "X-ray / imaging",
  certificate: "Certificate",
  prescription: "Prescription",
  invoice: "Invoice",
  other: "Other",
};

export const MEDICAL_RECORD_TYPE_LABELS: Record<MedicalRecordType, string> = {
  visit: "Vet visit",
  surgery: "Surgery",
  procedure: "Procedure",
  emergency: "Emergency",
};

/**
 * Formats a `date` column. These are calendar dates with no timezone, so they
 * are pinned to UTC — otherwise a user west of Greenwich sees yesterday.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatLongDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length > 10 ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days from today to `value`. Negative means the date has passed. */
export function daysUntil(value: string): number {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = new Date(`${value.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((target - todayUtc) / 86_400_000);
}

export function describeDueDate(value: string): string {
  const days = daysUntil(value);
  if (days < -1) return `${Math.abs(days)} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 30) return `Due in ${days} days`;
  return `Due ${formatDate(value)}`;
}

export function formatAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (now.getUTCMonth() - birth.getUTCMonth());
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  if (months < 0) return null;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${months} month${months === 1 ? "" : "s"} old`;
  if (remainingMonths === 0) return `${years} year${years === 1 ? "" : "s"} old`;
  return `${years}y ${remainingMonths}m old`;
}

export function formatWeight(weight: number | null | undefined, unit: string = "kg"): string {
  if (weight === null || weight === undefined) return "—";
  return `${Number(weight).toFixed(1)} ${unit}`;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
