import { NextRequest, NextResponse } from "next/server";
import {
  generateInterviewQuestion,
  evaluateAnswer,
  generateFinalFeedback,
  type QAPair,
} from "../../../../lib/openai";

const DIFFICULTY = "medium" as const;
const TOTAL_QUESTIONS = 5;

const FALLBACK_QUESTION =
  "本日はよろしくお願いします。まず、自己紹介をお願いできますか。";

/** 回答送信用リクエストボディ */
type AnswerRequestBody = {
  answer: string;
  questionIndex: number;
  jobType: string;
  jobLevel: string;
  previousQA: Array<{ question: string; answer: string; score?: number; feedback?: string }>;
  /** 現在回答している質問文（previousQA に含めない場合は必須） */
  question?: string;
};

/** 回答送信のレスポンス: 次の質問・フィードバック・スコア（5問目時は finalFeedback, finished も） */
type AnswerResponse = {
  question: string;
  feedback: string;
  score: number;
  finalFeedback?: string;
  finished?: boolean;
};

function parseBody(raw: string): AnswerRequestBody | null {
  try {
    if (!raw?.trim()) return null;
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (typeof body.answer !== "string") return null;
    if (typeof body.questionIndex !== "number") return null;
    if (typeof body.jobType !== "string") return null;
    if (typeof body.jobLevel !== "string") return null;
    const previousQA = Array.isArray(body.previousQA) ? body.previousQA : [];
    return {
      answer: body.answer,
      questionIndex: body.questionIndex,
      jobType: body.jobType,
      jobLevel: body.jobLevel,
      previousQA,
      question: typeof body.question === "string" ? body.question : undefined,
    };
  } catch {
    return null;
  }
}

/** 回答を評価し、次の質問を生成して { question, feedback, score } で返す */
async function handleSubmitAnswer(body: AnswerRequestBody): Promise<NextResponse<AnswerResponse | { error: string }>> {
  const { answer, questionIndex, jobType, jobLevel, previousQA } = body;

  const currentQuestion =
    body.question?.trim() ||
    previousQA[questionIndex - 1]?.question?.trim() ||
    previousQA[previousQA.length - 1]?.question?.trim();

  if (!currentQuestion) {
    return NextResponse.json(
      { error: "評価するための質問がありません。リクエストに question を含めるか、previousQA に現在の質問を入れてください。" },
      { status: 400 }
    );
  }

  const normalizedQA: QAPair[] = previousQA.map((qa) => ({
    question: String(qa.question),
    answer: String(qa.answer),
    score: qa.score,
    feedback: qa.feedback,
  }));

  let score: number;
  let feedback: string;

  try {
    const result = await evaluateAnswer(currentQuestion, answer.trim(), jobLevel);
    score = result.score;
    feedback = result.feedback;
  } catch (e) {
    console.error("[api/interview/answer] evaluateAnswer:", e);
    return NextResponse.json(
      { error: "回答の評価に失敗しました。しばらくしてから再試行してください。" },
      { status: 500 }
    );
  }

  const completedQA: QAPair[] = [
    ...normalizedQA,
    { question: currentQuestion, answer: answer.trim(), score, feedback },
  ];

  let nextQuestion: string;
  try {
    const result = await generateInterviewQuestion(
      jobLevel,
      jobType,
      DIFFICULTY,
      completedQA
    );
    nextQuestion = result.question?.trim() || FALLBACK_QUESTION;
  } catch (e) {
    console.error("[api/interview/answer] generateInterviewQuestion:", e);
    nextQuestion = FALLBACK_QUESTION;
  }

  const payload: AnswerResponse = { question: nextQuestion, feedback, score };
  if (completedQA.length >= TOTAL_QUESTIONS) {
    try {
      const { feedback: finalFb } = await generateFinalFeedback(completedQA);
      payload.finalFeedback = finalFb;
      payload.finished = true;
    } catch (e) {
      console.error("[api/interview/answer] generateFinalFeedback:", e);
    }
  }
  return NextResponse.json(payload);
}

/** 最初の質問を取得（answer なし・質問のみ欲しい場合） */
async function handleGetQuestion(
  jobType: string,
  jobLevel: string,
  previousQA: QAPair[] = []
): Promise<NextResponse<{ question: string } | { error: string; question: string }>> {
  try {
    const result = await generateInterviewQuestion(
      jobLevel,
      jobType,
      DIFFICULTY,
      previousQA
    );
    const question = result.question?.trim() || FALLBACK_QUESTION;
    return NextResponse.json({ question }, { status: 200 });
  } catch (e) {
    console.error("[api/interview/answer] handleGetQuestion:", e);
    return NextResponse.json(
      { error: "質問の生成に失敗しました", question: FALLBACK_QUESTION },
      { status: 200 }
    );
  }
}

/** 質問取得用の簡易パース（answer なしのとき） */
function parseGetQuestionBody(raw: string): { jobType: string; jobLevel: string; previousQA: QAPair[] } | null {
  try {
    if (!raw?.trim()) return null;
    const body = JSON.parse(raw) as Record<string, unknown>;
    const jobType = body.jobType ?? body.companyType;
    const jobLevel = body.jobLevel ?? body.jobType ?? body.companyType;
    if (typeof jobType !== "string" || typeof jobLevel !== "string") return null;
    const prev = body.previousQA;
    const previousQA = Array.isArray(prev)
      ? (prev as QAPair[]).map((qa) => ({
          question: String(qa.question),
          answer: String(qa.answer),
          score: qa.score,
          feedback: qa.feedback,
        }))
      : [];
    return { jobType, jobLevel, previousQA };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let raw: string;
  try {
    raw = await request.text();
  } catch (e) {
    console.error("[api/interview/answer] request.text:", e);
    return NextResponse.json(
      { error: "リクエストの読み取りに失敗しました" },
      { status: 500 }
    );
  }

  const answerBody = parseBody(raw);

  if (answerBody && String(answerBody.answer ?? "").trim() !== "") {
    if (!answerBody.jobType?.trim() || !answerBody.jobLevel?.trim()) {
      return NextResponse.json(
        { error: "jobType と jobLevel は必須です。" },
        { status: 400 }
      );
    }
    return handleSubmitAnswer(answerBody);
  }

  const getQuestionBody = parseGetQuestionBody(raw);
  if (getQuestionBody) {
    return handleGetQuestion(
      getQuestionBody.jobType,
      getQuestionBody.jobLevel,
      getQuestionBody.previousQA
    );
  }

  return NextResponse.json(
    { error: "リクエストボディが不正です。回答送信時は answer, questionIndex, jobType, jobLevel, previousQA を送信してください。" },
    { status: 400 }
  );
}
