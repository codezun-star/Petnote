-- Petnote — reminder queue + daily schedule
--
-- The `send-reminders` edge function runs once a day, asks this function which
-- vaccine/deworming items are coming due, emails the owners via Resend, and
-- stamps `reminder_sent_at` so nobody gets the same nudge twice.

-- ---------------------------------------------------------------------------
-- Which items need an email today?
-- ---------------------------------------------------------------------------

create or replace function public.get_due_reminders(days_ahead integer default 7)
returns table (
  record_id uuid,
  record_kind text,
  label text,
  next_due_date date,
  pet_id uuid,
  pet_name text,
  owner_id uuid,
  owner_email text,
  owner_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.id                          as record_id,
    'vaccine'::text               as record_kind,
    v.vaccine_type                as label,
    v.next_due_date               as next_due_date,
    p.id                          as pet_id,
    p.name                        as pet_name,
    p.owner_id                    as owner_id,
    u.email::text                 as owner_email,
    o.full_name                   as owner_name
  from public.vaccines v
  join public.pets p on p.id = v.pet_id
  join auth.users u on u.id = p.owner_id
  left join public.owner_profiles o on o.id = p.owner_id
  where v.next_due_date is not null
    and v.reminder_sent_at is null
    and v.next_due_date <= current_date + days_ahead
    and v.next_due_date >= current_date - 30
    and coalesce(o.reminders_enabled, true)
    and u.email is not null

  union all

  select
    d.id                          as record_id,
    'deworming'::text             as record_kind,
    coalesce(d.product_used, initcap(d.type) || ' deworming') as label,
    d.next_due_date               as next_due_date,
    p.id                          as pet_id,
    p.name                        as pet_name,
    p.owner_id                    as owner_id,
    u.email::text                 as owner_email,
    o.full_name                   as owner_name
  from public.deworming_records d
  join public.pets p on p.id = d.pet_id
  join auth.users u on u.id = p.owner_id
  left join public.owner_profiles o on o.id = p.owner_id
  where d.next_due_date is not null
    and d.reminder_sent_at is null
    and d.next_due_date <= current_date + days_ahead
    and d.next_due_date >= current_date - 30
    and coalesce(o.reminders_enabled, true)
    and u.email is not null;
$$;

-- Only the service role (the edge function) may read the reminder queue: it
-- joins against auth.users and therefore exposes email addresses.
revoke all on function public.get_due_reminders(integer) from public, anon, authenticated;
grant execute on function public.get_due_reminders(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Mark a batch as sent
-- ---------------------------------------------------------------------------

create or replace function public.mark_reminders_sent(vaccine_ids uuid[], deworming_ids uuid[])
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update public.vaccines
     set reminder_sent_at = now()
   where id = any(coalesce(vaccine_ids, '{}'::uuid[]));

  update public.deworming_records
     set reminder_sent_at = now()
   where id = any(coalesce(deworming_ids, '{}'::uuid[]));
end;
$$;

revoke all on function public.mark_reminders_sent(uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.mark_reminders_sent(uuid[], uuid[]) to service_role;

-- ---------------------------------------------------------------------------
-- Daily schedule
--
-- pg_cron cannot call an edge function directly, so it uses pg_net to POST to
-- it. Both the function URL and the service role key live in Vault rather than
-- in this migration — populate them once per project with:
--
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
-- ---------------------------------------------------------------------------

-- Everything below is wrapped so it can never abort the migration.
--
-- pg_cron and pg_net are not enabled on every project, and `cron.schedule`
-- needs privileges a plain migration role may not have. Left bare, a failure
-- here aborts `supabase db push` — and because migrations run in order, every
-- *later* migration silently never applies. Reminders are a background nicety;
-- they must not be able to hold up the schema the app actually runs on.
--
-- If this is skipped, the tables and functions above still exist. Enable the
-- extensions under Database → Extensions and re-run `supabase db push` to
-- pick the schedule up.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
  create extension if not exists pg_net with schema extensions;
exception
  when others then
    raise notice 'Petnote: could not enable pg_cron/pg_net (%). Reminder scheduling skipped; the rest of the schema is unaffected.', sqlerrm;
    return;
end;
$$;

do $$
begin
  -- Nothing to unschedule on a first run; a missing job is not an error.
  begin
    perform cron.unschedule('petnote-daily-reminders');
  exception
    when others then null;
  end;

  perform cron.schedule(
    'petnote-daily-reminders',
    '0 9 * * *', -- 09:00 UTC every day
    $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer '
          || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $job$
  );
exception
  when others then
    raise notice 'Petnote: could not schedule the daily reminder job (%). Everything else applied normally.', sqlerrm;
end;
$$;
