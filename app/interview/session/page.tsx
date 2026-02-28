"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function InterviewSessionPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
        <div className="animate-pulse text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-zinc-800 mb-2">面接セッション</h1>
          <p className="text-zinc-600 text-sm mb-6">
            面接を開始するにはログインしてください。Freeプランは月3回まで、Proプランで無制限に練習できます。
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-white font-medium h-12 px-6 hover:bg-zinc-700"
          >
            ログインする
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold text-zinc-800 mb-2">面接セッション</h1>
        <p className="text-zinc-600 text-sm mb-6">
          ログイン済みです（{session.user?.email}）。Freeプランは月3回まで、Proプランで無制限に練習できます。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-white font-medium h-12 px-6 hover:bg-zinc-700"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
