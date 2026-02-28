import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** クライアントコンポーネント用（ログイン・サインアップ等） */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
