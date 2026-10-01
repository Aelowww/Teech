import type { SupabaseClient } from "@supabase/supabase-js";

export async function accountRole(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("auth_user_id", userId).maybeSingle();
  if (profile?.role) return profile.role as string;
  const { data: restoredRole } = await supabase.rpc("ensure_my_profile");
  return typeof restoredRole === "string" ? restoredRole : null;
}
