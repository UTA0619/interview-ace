"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { QAPair } from "../../../lib/openai";
import type { InterviewResult } from "../../../lib/interview-types";
import { SESSION_RESULT_STORAGE_KEY } from "../../../lib/interview-types";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";

const INDUSTRIES = ["IT", "金融", "商社", "メーカー", "コンサル"] as const;
const JOB_TYPES = ["新卒", "中途", "管理職"] as const;
const TOTAL_QUESTIONS = 5;

type Step = "config" | "interview" | "result";

export default function InterviewSessionPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [industry, setIndustry] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [step, setStep] = useState<Step>("config");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [previousQA, setPreviousQA] = useState<QAPair[]>([]);
  const [answer, setAnswer] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [finalFeedback, setFinalFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleStart = async () => {
    if (!industry || !jobType) return;
    setError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType: industry,
          jobLevel: jobType,
          previousQA: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "質問の取得に失敗しました");
      setCurrentQuestion(data.question ?? "");
      setPreviousQA([]);
      setStep("interview");
      setAnswer("");
      setLastScore(null);
      setLastFeedback(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return;
    setError(null);
    setSubmitLoading(true);
    try {
      const questionIndex = previousQA.length + 1;
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: answer.trim(),
          questionIndex,
          jobType: industry,
          jobLevel: jobType,
          previousQA: previousQA,
          question: currentQuestion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");

      const newQA: QAPair[] = [
        ...previousQA,
        {
          question: currentQuestion,
          answer: answer.trim(),
          score: data.score ?? 0,
          feedback: data.feedback ?? "",
        },
      ];
      setPreviousQA(newQA);
      setLastScore(data.score ?? null);
      setLastFeedback(data.feedback ?? null);

      if (data.finished && data.finalFeedback) {
        setFinalFeedback(data.finalFeedback);
        setStep("result");
        const totalScore = Math.round(
          newQA.reduce((s, q) => s + (q.score ?? 0), 0) / newQA.length
        );
        const result: InterviewResult = {
          totalScore,
          finalFeedback: data.finalFeedback,
          items: newQA.map((q) => ({
            question: q.question,
            answer: q.answer,
            score: q.score ?? 0,
            feedback: q.feedback ?? "",
          })),
        };
        try {
          sessionStorage.setItem(SESSION_RESULT_STORAGE_KEY, JSON.stringify(result));
        } catch {
          // ignore
        }
      } else {
        setCurrentQuestion(data.question ?? "");
        setAnswer("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
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
            面接を開始するにはログインしてください。
          </p>
          <Link href="/login">
            <Button>ログインする</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (step === "config") {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-zinc-800 mb-6">面接設定</h1>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <Label>業種</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setIndustry(v)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                      industry === v
                        ? "bg-zinc-800 text-white border-zinc-800"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>職種</Label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setJobType(v)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                      jobType === v
                        ? "bg-zinc-800 text-white border-zinc-800"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleStart}
              disabled={!industry || !jobType || submitLoading}
            >
              {submitLoading ? "準備中..." : "面接開始"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-zinc-800">面接結果</h1>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {finalFeedback}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/interview/result" className="flex-1">
              <Button className="w-full">結果を詳しく見る</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">トップへ戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = previousQA.length + 1;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex-none border-b border-zinc-200 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600">
            {currentIndex} / {TOTAL_QUESTIONS} 問目
          </span>
          <div className="w-32 h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-800 rounded-full transition-all"
              style={{ width: `${(currentIndex / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col gap-6">
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 text-lg">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-500 mb-1">AI面接官</p>
              <p className="text-zinc-800 leading-relaxed">{currentQuestion}</p>
            </div>
          </div>
        </section>

        {lastScore !== null && lastFeedback && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-medium text-emerald-800 mb-1">
              前問のスコア: {lastScore} 点
            </p>
            <p className="text-sm text-emerald-700">{lastFeedback}</p>
          </div>
        )}

        <section className="flex-1 flex flex-col min-h-0">
          <Label htmlFor="answer" className="mb-2">
            あなたの回答
          </Label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="回答を入力してください"
            rows={5}
            className="flex-1 min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 resize-none"
            disabled={submitLoading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <Button
            className="mt-4 w-full sm:w-auto sm:ml-auto"
            onClick={handleSubmitAnswer}
            disabled={submitLoading || !answer.trim()}
          >
            {submitLoading ? "送信中..." : "送信"}
          </Button>
        </section>
      </div>
    </div>
  );
}
