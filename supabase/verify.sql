-- Petnote — schema verification
--
-- Paste this whole file into the Supabase SQL editor and run it. It changes
-- nothing; it only reports what is present and what is missing.
--
-- Useful when migrations are applied by hand: one statement failing partway
-- through a file leaves the database in a state that looks fine in the table
-- list but is missing columns, policies or functions the app depends on.
--
-- Every row comes back as OK or MISSING, with the migration that provides it.

with expected_tables(name) as (
  values ('owner_profiles'), ('pets'), ('vaccines'), ('deworming_records'),
         ('medical_records'), ('medications'), ('weight_logs'), ('documents'),
         ('subscriptions')
),
expected_columns(tbl, col, migration) as (
  values
    ('pets', 'public_id', '1 init_schema'),
    ('pets', 'emergency_enabled', '1 init_schema'),
    ('pets', 'microchip_number', '1 init_schema'),
    ('vaccines', 'reminder_sent_at', '1 init_schema'),
    ('deworming_records', 'reminder_sent_at', '1 init_schema'),
    ('owner_profiles', 'reminders_enabled', '1 init_schema'),
    ('owner_profiles', 'username', '6 usernames')
),
expected_functions(fn, migration) as (
  values
    ('generate_public_id', '1 init_schema'),
    ('handle_new_user', '1 init_schema'),
    ('owns_pet', '2 rls_policies'),
    ('get_emergency_profile', '3 emergency_mode'),
    ('get_due_reminders', '5 reminders'),
    ('mark_reminders_sent', '5 reminders'),
    ('email_for_username', '6 usernames'),
    ('is_username_available', '6 usernames')
),
expected_buckets(id, migration) as (
  values ('pet-photos', '4 storage'), ('pet-documents', '4 storage')
)

-- 1. Tables ------------------------------------------------------------------
select
  '1. table' as check_type,
  t.name     as object_name,
  case when to_regclass('public.' || t.name) is null then 'MISSING' else 'OK' end as status,
  '1 init_schema' as provided_by
from expected_tables t

union all

-- 2. Columns (a table can exist while a later ALTER never ran) ---------------
select
  '2. column',
  c.tbl || '.' || c.col,
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = c.tbl and column_name = c.col
  ) then 'OK' else 'MISSING' end,
  c.migration
from expected_columns c

union all

-- 3. Row level security ------------------------------------------------------
select
  '3. RLS enabled',
  t.name,
  case when coalesce((
    select relrowsecurity from pg_class
    where oid = to_regclass('public.' || t.name)
  ), false) then 'OK' else 'MISSING' end,
  '2 rls_policies'
from expected_tables t

union all

-- 4. At least one policy per table -------------------------------------------
select
  '4. policies',
  t.name,
  case when (
    select count(*) from pg_policies
    where schemaname = 'public' and tablename = t.name
  ) > 0 then 'OK (' || (
    select count(*) from pg_policies where schemaname = 'public' and tablename = t.name
  ) || ')' else 'MISSING' end,
  '2 rls_policies'
from expected_tables t

union all

-- 5. Functions ---------------------------------------------------------------
select
  '5. function',
  f.fn,
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = f.fn
  ) then 'OK' else 'MISSING' end,
  f.migration
from expected_functions f

union all

-- 6. The signup trigger that creates the profile + free subscription ---------
select
  '6. trigger',
  'on_auth_user_created',
  case when exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal
  ) then 'OK' else 'MISSING' end,
  '1 init_schema'

union all

-- 7. Storage buckets ---------------------------------------------------------
select
  '7. bucket',
  b.id,
  case when exists (select 1 from storage.buckets where id = b.id) then 'OK' else 'MISSING' end,
  b.migration
from expected_buckets b

order by check_type, object_name;
