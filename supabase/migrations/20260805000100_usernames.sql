-- Petnote — usernames
--
-- Supabase Auth only authenticates by email, so a username login works by
-- resolving the username to its email server-side and signing in with that.
--
-- The resolver is the sensitive part: it maps a public handle to a private
-- email address. It is therefore a SECURITY DEFINER function executable ONLY
-- by the service role, never by `anon` or `authenticated`. Nothing reachable
-- from the browser can turn a username into an email.

alter table public.owner_profiles
  add column if not exists username text;

-- Case-insensitive uniqueness: "Alex" and "alex" are the same account.
create unique index if not exists owner_profiles_username_lower_idx
  on public.owner_profiles (lower(username))
  where username is not null;

alter table public.owner_profiles
  drop constraint if exists owner_profiles_username_format;

alter table public.owner_profiles
  add constraint owner_profiles_username_format check (
    username is null
    or (
      length(username) between 3 and 30
      -- Must start with a letter, then letters/digits/._- . Keeping the
      -- alphabet narrow avoids handles that are indistinguishable from each
      -- other or from an email address.
      and username ~ '^[a-zA-Z][a-zA-Z0-9._-]{2,29}$'
    )
  );

-- ---------------------------------------------------------------------------
-- Backfill for accounts created before usernames existed
-- ---------------------------------------------------------------------------

do $$
declare
  profile record;
  base text;
  candidate text;
  suffix integer;
begin
  for profile in
    select o.id, u.email
    from public.owner_profiles o
    join auth.users u on u.id = o.id
    where o.username is null
      and u.email is not null
  loop
    -- Derive a handle from the email's local part, then force it to satisfy
    -- the format constraint.
    base := lower(regexp_replace(split_part(profile.email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g'));
    if base !~ '^[a-zA-Z]' then
      base := 'user' || base;
    end if;
    base := left(base, 24);
    if length(base) < 3 then
      base := rpad(base, 3, '0');
    end if;

    candidate := base;
    suffix := 0;
    while exists (select 1 from public.owner_profiles where lower(username) = lower(candidate)) loop
      suffix := suffix + 1;
      candidate := left(base, 24) || suffix::text;
    end loop;

    update public.owner_profiles set username = candidate where id = profile.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bootstrap trigger — persist the username chosen at signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.owner_profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    nullif(new.raw_user_meta_data ->> 'username', '')
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Username -> email resolver (service role only)
-- ---------------------------------------------------------------------------

create or replace function public.email_for_username(lookup_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from public.owner_profiles o
  join auth.users u on u.id = o.id
  where lower(o.username) = lower(trim(lookup_username))
  limit 1;
$$;

revoke all on function public.email_for_username(text) from public, anon, authenticated;
grant execute on function public.email_for_username(text) to service_role;

-- ---------------------------------------------------------------------------
-- Availability check (safe for signed-out visitors)
--
-- Returns only a boolean, never an email or a user id, so it can be exposed
-- to `anon` for the signup form. It does confirm whether a handle exists,
-- which is unavoidable for any "username taken" message.
-- ---------------------------------------------------------------------------

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.owner_profiles
    where lower(username) = lower(trim(candidate))
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated, service_role;
