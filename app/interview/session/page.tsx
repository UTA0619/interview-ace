"use client";

import Link from "next/link";

export default function InterviewSessionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold text-zinc-800 mb-2">面接セッション</h1>
        <p className="text-zinc-600 text-sm mb-6">
          面接を開始するにはログインしてください。Freeプランは月3回まで、Proプランで無制限に練習できます。
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
