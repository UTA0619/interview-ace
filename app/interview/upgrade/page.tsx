"use client";

import Link from "next/link";
import { useState } from "react";

export default function InterviewUpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold text-zinc-800 mb-2">
          今月の回数制限に達しました
        </h1>
        <p className="text-zinc-600 text-sm mb-6">
          Freeプランは月3回までです。無制限で練習するにはProプラン（月額980円）へアップグレードしてください。
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "Proプランへアップグレード（月額980円）"}
          </button>
          <Link
            href="/interview"
            className="text-zinc-500 hover:text-zinc-700 text-sm"
          >
            戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
