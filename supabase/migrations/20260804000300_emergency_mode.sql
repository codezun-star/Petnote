-- Petnote — Emergency Mode public reader
--
-- Emergency Mode is the one part of Petnote reachable without a session: a
-- stranger scans the QR tag on a collar and needs allergies, medications and a
-- phone number immediately.
--
-- Rather than opening a `select` policy on `pets` to the `anon` role (which
-- would expose every column of the row, including notes and internal ids),
-- access goes through this SECURITY DEFINER function. It returns a fixed,
-- hand-picked column list and nothing else, so widening the pets table later
-- can never accidentally widen the public surface.

create or replace function public.get_emergency_profile(lookup_public_id text)
returns table (
  pet_name text,
  species text,
  breed text,
  photo_url text,
  allergies text,
  medications jsonb,
  owner_name text,
  owner_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  vet_name text,
  vet_phone text,
  vet_clinic text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.name                       as pet_name,
    p.species                    as species,
    p.breed                      as breed,
    p.photo_url                  as photo_url,
    p.allergies                  as allergies,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'name', m.name,
                   'dosage', m.dosage,
                   'frequency', m.frequency
                 )
                 order by m.created_at
               )
        from public.medications m
        where m.pet_id = p.id
          and m.active
          and (m.end_date is null or m.end_date >= current_date)
      ),
      '[]'::jsonb
    )                            as medications,
    o.full_name                  as owner_name,
    o.phone                      as owner_phone,
    o.emergency_contact_name     as emergency_contact_name,
    o.emergency_contact_phone    as emergency_contact_phone,
    o.vet_name                   as vet_name,
    o.vet_phone                  as vet_phone,
    o.vet_clinic                 as vet_clinic
  from public.pets p
  left join public.owner_profiles o on o.id = p.owner_id
  where p.public_id = lookup_public_id
    and p.emergency_enabled;
$$;

revoke all on function public.get_emergency_profile(text) from public;
grant execute on function public.get_emergency_profile(text) to anon, authenticated;
