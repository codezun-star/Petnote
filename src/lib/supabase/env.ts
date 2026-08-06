/**
 * Environment lookup for the Supabase clients.
 *
 * Supabase renamed both keys — "anon" became "publishable", "service_role"
 * became "secret" — so either spelling is accepted, whichever the project
 * dashboard hands you today.
 */

function required(name: string, value: string | undefined, alternative?: string): string {
  if (!value) {
    const names = alternative ? `${name} (or ${alternative})` : name;
    throw new Error(
      `Missing environment variable ${names}. ` +
        // The NEXT_PUBLIC_ prefix is the usual culprit on a hosted deploy: without
        // it the value never reaches the browser bundle, so the variable looks set
        // in the dashboard but reads as undefined here. It is also inlined at build
        // time, so adding it requires a redeploy rather than a restart.
        (name.startsWith("NEXT_PUBLIC_")
          ? "Check the name is spelled exactly as above — the NEXT_PUBLIC_ prefix is required — then redeploy, since these are baked in at build time."
          : "Add it to your hosting provider's environment variables, or to .env.local for local development.")
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", key, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  return required("SUPABASE_SERVICE_ROLE_KEY", key, "SUPABASE_SECRET_KEY");
}
