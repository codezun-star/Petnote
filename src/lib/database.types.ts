/**
 * Hand-maintained mirror of supabase/migrations.
 *
 * Regenerate from a live project with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Species = "dog" | "cat" | "rabbit" | "bird" | "reptile" | "rodent" | "other";
export type Sex = "male" | "female" | "unknown";
export type WeightUnit = "kg" | "lb";
export type DewormingType = "internal" | "external" | "both";
export type MedicalRecordType = "visit" | "surgery" | "procedure" | "emergency";
export type DocumentType =
  | "lab_result"
  | "xray"
  | "certificate"
  | "prescription"
  | "invoice"
  | "other";
export type PlanId = "free" | "pro";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "paused" | "canceled";

export type OwnerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_clinic: string | null;
  reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Pet = {
  id: string;
  owner_id: string;
  public_id: string;
  name: string;
  species: Species;
  breed: string | null;
  sex: Sex | null;
  date_of_birth: string | null;
  current_weight: number | null;
  weight_unit: WeightUnit;
  photo_url: string | null;
  notes: string | null;
  allergies: string | null;
  microchip_number: string | null;
  emergency_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Vaccine = {
  id: string;
  pet_id: string;
  vaccine_type: string;
  date_administered: string;
  next_due_date: string | null;
  administered_by: string | null;
  notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
};

export type DewormingRecord = {
  id: string;
  pet_id: string;
  type: DewormingType;
  date_administered: string;
  product_used: string | null;
  next_due_date: string | null;
  notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
};

export type MedicalRecord = {
  id: string;
  pet_id: string;
  record_type: MedicalRecordType;
  visit_date: string;
  reason: string | null;
  diagnosis: string | null;
  treatment: string | null;
  vet_name: string | null;
  created_at: string;
};

export type Medication = {
  id: string;
  pet_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
};

export type WeightLog = {
  id: string;
  pet_id: string;
  weight: number;
  unit: WeightUnit;
  logged_at: string;
  note: string | null;
  created_at: string;
};

export type PetDocument = {
  id: string;
  pet_id: string;
  storage_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  document_type: DocumentType;
  uploaded_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  paddle_price_id: string | null;
  paddle_product_id: string | null;
  status: SubscriptionStatus;
  plan: PlanId;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type EmergencyMedication = {
  name: string;
  dosage: string | null;
  frequency: string | null;
};

export type EmergencyProfile = {
  pet_name: string;
  species: Species;
  breed: string | null;
  photo_url: string | null;
  allergies: string | null;
  medications: EmergencyMedication[];
  owner_name: string | null;
  owner_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_clinic: string | null;
};

/**
 * Reads are fully typed off `Row`. Writes are `Partial<Row>` because almost
 * every column carries a database-side default (ids, timestamps, `public_id`,
 * plan flags) — spelling out which subset is required per table would only
 * duplicate the migration, and drift from it.
 */
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      owner_profiles: Table<OwnerProfile>;
      pets: Table<Pet>;
      vaccines: Table<Vaccine>;
      deworming_records: Table<DewormingRecord>;
      medical_records: Table<MedicalRecord>;
      medications: Table<Medication>;
      weight_logs: Table<WeightLog>;
      documents: Table<PetDocument>;
      subscriptions: Table<Subscription>;
    };
    Views: Record<never, never>;
    Functions: {
      get_emergency_profile: {
        Args: { lookup_public_id: string };
        Returns: EmergencyProfile[];
      };
      get_due_reminders: {
        Args: { days_ahead?: number };
        Returns: {
          record_id: string;
          record_kind: "vaccine" | "deworming";
          label: string;
          next_due_date: string;
          pet_id: string;
          pet_name: string;
          owner_id: string;
          owner_email: string;
          owner_name: string | null;
        }[];
      };
      mark_reminders_sent: {
        Args: { vaccine_ids: string[]; deworming_ids: string[] };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
