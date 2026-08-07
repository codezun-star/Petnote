"use client";

import Link from "next/link";

import { ActionForm } from "@/components/forms/action-form";
import { Field, FieldGrid, SelectField } from "@/components/forms/field";
import { FileInput } from "@/components/forms/file-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/actions/shared";
import type { Pet } from "@/lib/database.types";
import { SPECIES_LABELS } from "@/lib/format";
import { PHOTO_COMPRESSION } from "@/lib/image-profiles";
import { MAX_UPLOAD_BYTES } from "@/lib/plans";

const SPECIES_OPTIONS = Object.entries(SPECIES_LABELS).map(([value, label]) => ({ value, label }));

const SEX_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "unknown", label: "Unknown" },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "lb", label: "lb" },
];

type PetFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  pet?: Pet;
  submitLabel: string;
  cancelHref: string;
};

export function PetForm({ action, pet, submitLabel, cancelHref }: PetFormProps) {
  return (
    <ActionForm
      action={action}
      submitLabel={submitLabel}
      pendingLabel="Saving…"
      className="space-y-6"
      footer={
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      }
    >
      {pet ? <input type="hidden" name="petId" value={pet.id} /> : null}

      <FieldGrid>
        <Field label="Name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={pet?.name} placeholder="Luna" required maxLength={80} />
        </Field>

        <Field label="Species" htmlFor="species" required>
          <SelectField name="species" defaultValue={pet?.species ?? "dog"} options={SPECIES_OPTIONS} required />
        </Field>

        <Field label="Breed" htmlFor="breed">
          <Input id="breed" name="breed" defaultValue={pet?.breed ?? ""} placeholder="Border Collie" />
        </Field>

        <Field label="Sex" htmlFor="sex">
          <SelectField name="sex" defaultValue={pet?.sex ?? ""} options={SEX_OPTIONS} />
        </Field>

        <Field label="Date of birth" htmlFor="date_of_birth" hint="Approximate is fine.">
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={pet?.date_of_birth ?? ""}
          />
        </Field>

        <Field label="Current weight" htmlFor="current_weight">
          <div className="flex gap-2">
            <Input
              id="current_weight"
              name="current_weight"
              type="number"
              step="0.1"
              min="0"
              max="999"
              defaultValue={pet?.current_weight ?? ""}
              placeholder="12.4"
            />
            <SelectField
              name="weight_unit"
              defaultValue={pet?.weight_unit ?? "kg"}
              options={UNIT_OPTIONS}
              className="w-24 shrink-0"
            />
          </div>
        </Field>
      </FieldGrid>

      <Field
        label="Allergies"
        htmlFor="allergies"
        hint="Shown prominently on the public Emergency Mode page. Leave empty if there are none."
      >
        <Textarea
          id="allergies"
          name="allergies"
          defaultValue={pet?.allergies ?? ""}
          placeholder="Penicillin, chicken protein…"
          rows={2}
        />
      </Field>

      <FieldGrid>
        <Field label="Microchip number" htmlFor="microchip_number">
          <Input
            id="microchip_number"
            name="microchip_number"
            defaultValue={pet?.microchip_number ?? ""}
            placeholder="985141000123456"
          />
        </Field>

        <Field
          label="Photo"
          htmlFor="photo"
          hint="Optional — JPEG, PNG, WebP or GIF, any size. Large photos are optimised in your browser before upload. You can add or change it any time. Appears on the Emergency Mode page."
        >
          <FileInput
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
            maxBytes={MAX_UPLOAD_BYTES}
            compress={PHOTO_COMPRESSION}
          />
        </Field>
      </FieldGrid>

      <Field
        label="Notes & distinguishing marks"
        htmlFor="notes"
        hint="Scars, markings, temperament, anything a vet or finder should know."
      >
        <Textarea
          id="notes"
          name="notes"
          defaultValue={pet?.notes ?? ""}
          placeholder="White patch on left ear, nervous around strangers…"
          rows={3}
        />
      </Field>
    </ActionForm>
  );
}
