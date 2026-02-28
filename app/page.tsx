import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-lg w-full text-center space-y-8">
        <h1 className="text-3xl font-bold text-zinc-800">
          AI面接練習
        </h1>
        <p className="text-zinc-600">
          厳格だが公平なAI面接官と練習して、本番に備えましょう。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-white font-medium h-12 px-6 hover:bg-zinc-700 transition-colors"
          >
            面接を始める
          </Link>
          <Link
            href="/interview/result"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 font-medium h-12 px-6 hover:bg-zinc-50 transition-colors"
          >
            結果を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
