import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** API Route / Webhook 用（サービスロールで users / subscriptions を更新する） */
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}
