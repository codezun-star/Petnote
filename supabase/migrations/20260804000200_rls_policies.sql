-- Petnote — row level security
--
-- Rule of thumb: a row is visible if the caller owns the pet it hangs off of.
-- `public.owns_pet()` centralises that check so every child table stays
-- consistent, and marking it STABLE + SECURITY DEFINER keeps the planner from
-- re-running the lookup per row.

alter table public.owner_profiles enable row level security;
alter table public.pets enable row level security;
alter table public.vaccines enable row level security;
alter table public.deworming_records enable row level security;
alter table public.medical_records enable row level security;
alter table public.medications enable row level security;
alter table public.weight_logs enable row level security;
alter table public.documents enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.owns_pet(target_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pets p
    where p.id = target_pet_id
      and p.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_pet(uuid) from public;
grant execute on function public.owns_pet(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- owner_profiles — a user sees and edits exactly one row: their own.
-- ---------------------------------------------------------------------------

drop policy if exists "owner_profiles_select_own" on public.owner_profiles;
create policy "owner_profiles_select_own" on public.owner_profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "owner_profiles_insert_own" on public.owner_profiles;
create policy "owner_profiles_insert_own" on public.owner_profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "owner_profiles_update_own" on public.owner_profiles;
create policy "owner_profiles_update_own" on public.owner_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- pets
-- ---------------------------------------------------------------------------

drop policy if exists "pets_select_own" on public.pets;
create policy "pets_select_own" on public.pets
  for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "pets_insert_own" on public.pets;
create policy "pets_insert_own" on public.pets
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pets_update_own" on public.pets;
create policy "pets_update_own" on public.pets
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pets_delete_own" on public.pets;
create policy "pets_delete_own" on public.pets
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- Pet-scoped child tables
-- ---------------------------------------------------------------------------

do $$
declare
  child_table text;
begin
  foreach child_table in array array[
    'vaccines',
    'deworming_records',
    'medical_records',
    'medications',
    'weight_logs',
    'documents'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', child_table || '_select_own', child_table);
    execute format($p$
      create policy %I on public.%I
        for select to authenticated
        using (public.owns_pet(pet_id))
    $p$, child_table || '_select_own', child_table);

    execute format('drop policy if exists %I on public.%I', child_table || '_insert_own', child_table);
    execute format($p$
      create policy %I on public.%I
        for insert to authenticated
        with check (public.owns_pet(pet_id))
    $p$, child_table || '_insert_own', child_table);

    execute format('drop policy if exists %I on public.%I', child_table || '_update_own', child_table);
    execute format($p$
      create policy %I on public.%I
        for update to authenticated
        using (public.owns_pet(pet_id))
        with check (public.owns_pet(pet_id))
    $p$, child_table || '_update_own', child_table);

    execute format('drop policy if exists %I on public.%I', child_table || '_delete_own', child_table);
    execute format($p$
      create policy %I on public.%I
        for delete to authenticated
        using (public.owns_pet(pet_id))
    $p$, child_table || '_delete_own', child_table);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- subscriptions — read-only for users.
--
-- There is deliberately no insert/update/delete policy: billing state may only
-- change through the Paddle webhook handler, which uses the service role key
-- and therefore bypasses RLS. A user forging a row to grant themselves Pro is
-- impossible because no write policy exists for the `authenticated` role.
-- ---------------------------------------------------------------------------

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);
