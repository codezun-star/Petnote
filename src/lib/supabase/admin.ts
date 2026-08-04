import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Service-role client. Bypasses row level security entirely.
 *
 * Only two callers should ever need this: the Paddle webhook handler (the sole
 * writer of `subscriptions`) and server-side jobs. Never import it into
 * anything that runs with a user's session, and never expose its results
 * without an explicit ownership check.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
