import "server-only";

import { redirect } from "next/navigation";

import type { OwnerProfile, Pet, Subscription } from "@/lib/database.types";
import { getLimits, resolvePlan, type PlanId, type PlanLimits } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  userId: string;
  email: string | null;
  profile: OwnerProfile | null;
  subscription: Subscription | null;
  plan: PlanId;
  limits: PlanLimits;
};

/**
 * Loads the signed-in user plus their plan entitlements, or bounces to login.
 *
 * Every dashboard page calls this — the proxy redirect is only an optimistic
 * first pass, this is the check that actually gates rendering.
 */
export async function requireAccount(): Promise<Account> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, subscriptionResult] = await Promise.all([
    supabase.from("owner_profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  // Neither query is fatal — a missing profile or subscription row just means
  // "no details yet" and "Free plan". But swallowing a real failure silently
  // would quietly downgrade a paying user, or hide a missing migration behind
  // an empty-looking account, so it gets logged.
  if (profileResult.error) {
    console.error("[account] Could not load owner profile", profileResult.error);
  }
  if (subscriptionResult.error) {
    console.error("[account] Could not load subscription", subscriptionResult.error);
  }

  const profile = profileResult.data;
  const subscription = subscriptionResult.data;
  const plan = resolvePlan(subscription);

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
    subscription: subscription ?? null,
    plan,
    limits: getLimits(plan),
  };
}

/** All of the caller's pets, oldest first. RLS scopes this to the owner. */
export async function listPets(): Promise<Pet[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("pets").select("*").order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * A single pet the caller owns, or `null`.
 *
 * RLS already filters by owner, so a pet belonging to somebody else simply
 * isn't found — there's no separate ownership branch to get wrong.
 */
export async function getPet(petId: string): Promise<Pet | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("pets").select("*").eq("id", petId).maybeSingle();
  return data ?? null;
}

export async function countPets(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("pets").select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Documents are limited per account, not per pet, so this counts across pets. */
export async function countDocuments(): Promise<number> {
  const supabase = await createClient();
  const { data: pets } = await supabase.from("pets").select("id");
  const petIds = (pets ?? []).map((pet) => pet.id);
  if (petIds.length === 0) return 0;

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .in("pet_id", petIds);
  return count ?? 0;
}

export type UpcomingItem = {
  id: string;
  kind: "vaccine" | "deworming";
  label: string;
  nextDueDate: string;
  petId: string;
  petName: string;
};

/**
 * Everything due (or overdue) across all of the caller's pets, soonest first.
 *
 * Overdue items reach back 180 days so a long-forgotten booster still shows up
 * on the dashboard instead of silently ageing out.
 */
export async function listUpcomingItems(daysAhead = 60): Promise<UpcomingItem[]> {
  const supabase = await createClient();

  const { data: pets } = await supabase.from("pets").select("id, name");
  if (!pets || pets.length === 0) return [];

  const petNames = new Map(pets.map((pet) => [pet.id, pet.name]));
  const petIds = pets.map((pet) => pet.id);

  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + daysAhead);
  const horizonIso = horizon.toISOString().slice(0, 10);

  const floor = new Date();
  floor.setUTCDate(floor.getUTCDate() - 180);
  const floorIso = floor.toISOString().slice(0, 10);

  const [vaccines, deworming] = await Promise.all([
    supabase
      .from("vaccines")
      .select("id, pet_id, vaccine_type, next_due_date")
      .in("pet_id", petIds)
      .not("next_due_date", "is", null)
      .gte("next_due_date", floorIso)
      .lte("next_due_date", horizonIso),
    supabase
      .from("deworming_records")
      .select("id, pet_id, type, product_used, next_due_date")
      .in("pet_id", petIds)
      .not("next_due_date", "is", null)
      .gte("next_due_date", floorIso)
      .lte("next_due_date", horizonIso),
  ]);

  const items: UpcomingItem[] = [
    ...(vaccines.data ?? []).map((row) => ({
      id: row.id,
      kind: "vaccine" as const,
      label: row.vaccine_type,
      nextDueDate: row.next_due_date as string,
      petId: row.pet_id,
      petName: petNames.get(row.pet_id) ?? "Your pet",
    })),
    ...(deworming.data ?? []).map((row) => ({
      id: row.id,
      kind: "deworming" as const,
      label: row.product_used ?? `${row.type === "external" ? "External" : "Internal"} deworming`,
      nextDueDate: row.next_due_date as string,
      petId: row.pet_id,
      petName: petNames.get(row.pet_id) ?? "Your pet",
    })),
  ];

  return items.sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}
