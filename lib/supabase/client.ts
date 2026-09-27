import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
