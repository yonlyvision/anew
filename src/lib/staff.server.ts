import type { SupabaseClient } from "@supabase/supabase-js";

/** User IDs with admin or moderator role — never shown in member dating flows. */
export async function getStaffUserIds(
  supabaseAdmin: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "moderator"]);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => row.user_id));
}

/** Staff accounts manage the platform only — no dating profile required. */
export async function ensureStaffProfileReady(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      onboarding_completed: true,
      is_paused: true,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
