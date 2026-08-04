-- Petnote — initial schema
--
-- Every table is owned (directly or through `pets`) by an `auth.users` row and
-- is locked down with row level security. The only public surface is the
-- Emergency Mode reader defined in 20260804000300_emergency_mode.sql, which is
-- a narrowly scoped SECURITY DEFINER function rather than table-level access.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- URL-safe, non-sequential public identifier for Emergency Mode links.
-- 12 chars of a 32-symbol alphabet ≈ 60 bits of entropy, which keeps the
-- printed QR payload short while staying impractical to enumerate.
create or replace function public.generate_public_id()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  result text := '';
  i integer;
begin
  for i in 1..12 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner profiles
-- ---------------------------------------------------------------------------

create table if not exists public.owner_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  vet_name text,
  vet_phone text,
  vet_clinic text,
  reminders_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger owner_profiles_set_updated_at
  before update on public.owner_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Pets
-- ---------------------------------------------------------------------------

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  public_id text not null unique default public.generate_public_id(),
  name text not null,
  species text not null,
  breed text,
  sex text,
  date_of_birth date,
  current_weight numeric(6, 2),
  weight_unit text not null default 'kg',
  photo_url text,
  notes text,
  allergies text,
  microchip_number text,
  -- Emergency Mode is free for everyone, but owners can revoke a printed QR
  -- code by flipping this off.
  emergency_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_species_check check (species in ('dog', 'cat', 'rabbit', 'bird', 'reptile', 'rodent', 'other')),
  constraint pets_sex_check check (sex is null or sex in ('male', 'female', 'unknown')),
  constraint pets_weight_unit_check check (weight_unit in ('kg', 'lb'))
);

create index if not exists pets_owner_id_idx on public.pets (owner_id);
create index if not exists pets_public_id_idx on public.pets (public_id);

create trigger pets_set_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Health calendar
-- ---------------------------------------------------------------------------

create table if not exists public.vaccines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  vaccine_type text not null,
  date_administered date not null,
  next_due_date date,
  administered_by text,
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists vaccines_pet_id_idx on public.vaccines (pet_id);
create index if not exists vaccines_next_due_date_idx on public.vaccines (next_due_date)
  where next_due_date is not null;

create table if not exists public.deworming_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  type text not null default 'internal',
  date_administered date not null,
  product_used text,
  next_due_date date,
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint deworming_type_check check (type in ('internal', 'external', 'both'))
);

create index if not exists deworming_pet_id_idx on public.deworming_records (pet_id);
create index if not exists deworming_next_due_date_idx on public.deworming_records (next_due_date)
  where next_due_date is not null;

-- ---------------------------------------------------------------------------
-- Medical history
-- ---------------------------------------------------------------------------

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  record_type text not null default 'visit',
  visit_date date not null,
  reason text,
  diagnosis text,
  treatment text,
  vet_name text,
  created_at timestamptz not null default now(),
  constraint medical_records_type_check check (record_type in ('visit', 'surgery', 'procedure', 'emergency'))
);

create index if not exists medical_records_pet_id_idx on public.medical_records (pet_id);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists medications_pet_id_idx on public.medications (pet_id);

-- ---------------------------------------------------------------------------
-- Weight tracker
-- ---------------------------------------------------------------------------

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  weight numeric(6, 2) not null check (weight > 0),
  unit text not null default 'kg',
  logged_at date not null,
  note text,
  created_at timestamptz not null default now(),
  constraint weight_logs_unit_check check (unit in ('kg', 'lb'))
);

create index if not exists weight_logs_pet_id_logged_at_idx on public.weight_logs (pet_id, logged_at desc);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  storage_path text not null,
  file_name text,
  file_size integer,
  mime_type text,
  document_type text not null default 'other',
  uploaded_at timestamptz not null default now(),
  constraint documents_type_check check (
    document_type in ('lab_result', 'xray', 'certificate', 'prescription', 'invoice', 'other')
  )
);

create index if not exists documents_pet_id_idx on public.documents (pet_id);

-- ---------------------------------------------------------------------------
-- Subscriptions
--
-- Written exclusively by the Paddle webhook handler using the service role
-- key. Users get read-only access through RLS (see the policies migration).
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  paddle_subscription_id text unique,
  paddle_customer_id text,
  paddle_price_id text,
  paddle_product_id text,
  status text not null default 'active',
  plan text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_plan_check check (plan in ('free', 'pro')),
  constraint subscriptions_status_check check (
    status in ('active', 'trialing', 'past_due', 'paused', 'canceled')
  )
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New-user bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.owner_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
