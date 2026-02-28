import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase/middleware";
import { PLANS } from "./lib/stripe";

const FREE_MONTHLY_LIMIT = PLANS.free.monthlyLimit!; // 3
const UPGRADE_PATH = "/interview/upgrade"; // 制限超過時のリダイレクト先

/** 当月の開始日（UTC）の ISO 文字列 */
function startOfCurrentMonthUTC(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return start.toISOString();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 面接セッション開始ページのみ回数制限をチェック
  if (pathname !== "/interview/session") {
    return NextResponse.next();
  }

  const supabase = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインはそのまま通過（ページ側でログイン促す想定）
  if (!user?.id) {
    return NextResponse.next();
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = (userRow?.plan ?? "free") as "free" | "pro";

  // Pro は無制限
  if (plan === "pro") {
    return NextResponse.next();
  }

  const from = startOfCurrentMonthUTC();
  const { count, error } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", from);

  if (error) {
    console.error("[middleware] interview_sessions count error:", error);
    return NextResponse.next();
  }

  const used = count ?? 0;
  if (used >= FREE_MONTHLY_LIMIT) {
    const url = request.nextUrl.clone();
    url.pathname = UPGRADE_PATH;
    url.searchParams.set("reason", "limit");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/interview/session"],
};
