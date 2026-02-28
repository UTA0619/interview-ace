import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** API Route で認証ユーザーを取得する用（Cookie 利用） */
export async function getAuthUser(request: NextRequest) {
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}
