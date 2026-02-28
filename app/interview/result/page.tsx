"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { InterviewResult } from "../../../lib/interview-types";
import { SESSION_RESULT_STORAGE_KEY } from "../../../lib/interview-types";

const TOTAL_MARK = 100;

/** フィードバック文から「良かった点」「改善点」らしき部分を抽出（簡易） */
function splitFeedback(feedback: string): { good: string; improve: string } {
  const goodMatch = feedback.match(
    /(?:良かった点|良い点|強み|よかった点)[:：]\s*([^\n]+)/i
  );
  const improveMatch = feedback.match(
    /(?:改善点|伸ばす点|課題)[:：]\s*([^\n]+)/i
  );
  return {
    good: goodMatch ? goodMatch[1].trim() : "",
    improve: improveMatch ? improveMatch[1].trim() : "",
  };
}

/** スコアのカウントアップアニメーション */
function useAnimatedScore(target: number, durationMs = 1500, enabled: boolean) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) {
      setScore(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      const easeOut = 1 - Math.pow(1 - t, 2);
      setScore(Math.round(easeOut * target));
      if (t < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, durationMs, enabled]);
  return score;
}

export default function InterviewResultPage() {
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_RESULT_STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw) as InterviewResult);
    } catch {
      setResult(null);
    }
    setMounted(true);
  }, []);

  const totalScore = result ? result.totalScore : 0;
  const animatedScore = useAnimatedScore(totalScore, 1600, mounted && !!result);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  if (!result || result.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 p-4">
        <p className="text-zinc-600">結果データがありません。</p>
        <Link
          href="/interview/session"
          className="text-sky-600 hover:underline font-medium"
        >
          面接を開始する
        </Link>
      </div>
    );
  }

  const radarData = result.items.map((item, i) => ({
    subject: `Q${i + 1}`,
    score: item.score,
    fullMark: TOTAL_MARK,
  }));

  const handleShare = async () => {
    const text = [
      `面接練習 総合スコア: ${result.totalScore}/100`,
      result.finalFeedback ? `\n総評: ${result.finalFeedback}` : "",
      result.items
        .map(
          (item, i) =>
            `\nQ${i + 1}: ${item.question}\nスコア: ${item.score}\n${item.feedback}`
        )
        .join("\n"),
    ].join("");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "面接練習の結果",
          text,
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => alert("結果をクリップボードにコピーしました"),
      () => alert("コピーに失敗しました")
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* ヘッダー */}
        <h1 className="text-2xl font-bold text-zinc-800 mb-8">
          面接結果
        </h1>

        {/* 総合スコア（アニメーション付き） */}
        <section className="mb-10">
          <p className="text-sm font-medium text-zinc-500 mb-2">
            総合スコア
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="text-5xl sm:text-6xl font-bold tabular-nums text-zinc-800 transition-all"
              aria-live="polite"
            >
              {animatedScore}
            </span>
            <span className="text-2xl text-zinc-500">/ 100</span>
          </div>
          <div className="mt-2 h-2 w-full max-w-xs bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${(animatedScore / TOTAL_MARK) * 100}%`,
              }}
            />
          </div>
        </section>

        {/* レーダーチャート */}
        <section className="mb-10 bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            質問ごとのスコア
          </h2>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, TOTAL_MARK]}
                  tick={{ fill: "#71717a", fontSize: 10 }}
                />
                <Radar
                  name="スコア"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 各回答へのAIフィードバック */}
        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            回答へのフィードバック
          </h2>
          {result.items.map((item, index) => {
            const { good, improve } = splitFeedback(item.feedback);
            const hasSplit = good || improve;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden"
              >
                <div className="p-4 sm:p-5 border-b border-zinc-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Q{index + 1}
                    </span>
                    <span className="text-sm font-medium text-zinc-500">
                      スコア {item.score}
                    </span>
                  </div>
                  <p className="text-zinc-800 font-medium mb-2">
                    {item.question}
                  </p>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    {item.answer}
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-zinc-50/50">
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    AIフィードバック
                  </p>
                  {hasSplit ? (
                    <ul className="space-y-2 text-sm">
                      {good && (
                        <li className="flex gap-2">
                          <span className="text-emerald-600 shrink-0">
                            良かった点:
                          </span>
                          <span className="text-zinc-700">{good}</span>
                        </li>
                      )}
                      {improve && (
                        <li className="flex gap-2">
                          <span className="text-amber-600 shrink-0">
                            改善点:
                          </span>
                          <span className="text-zinc-700">{improve}</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-zinc-700 text-sm leading-relaxed">
                      {item.feedback}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* 総評（あれば） */}
        {result.finalFeedback && (
          <section className="mb-10 p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-800 mb-3">
              総評
            </h2>
            <p className="text-zinc-700 leading-relaxed">
              {result.finalFeedback}
            </p>
          </section>
        )}

        {/* アクションボタン */}
        <section className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/interview/session"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-white font-medium h-12 px-6 hover:bg-zinc-700 transition-colors"
          >
            もう一度練習する
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 font-medium h-12 px-6 hover:bg-zinc-50 transition-colors"
          >
            結果をシェアする
          </button>
        </section>
      </div>
    </div>
  );
}
