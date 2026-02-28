import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Middleware 用（Cookie からセッションを読む） */
export function createSupabaseMiddlewareClient(
  request: Request
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")?.split(";").map((c) => {
          const [name, ...v] = c.trim().split("=");
          return { name, value: v.join("=").trim() };
        }) ?? [];
      },
      setAll() {
        // middleware では cookie の set は NextResponse で行う
      },
    },
  });
}
