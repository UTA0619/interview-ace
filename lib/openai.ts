import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PERSONA =
  "あなたは厳格だが公平な日系大企業の人事部長です。採用面接で、候補者の本質を見抜きつつ、建設的な指摘と励ましのバランスを保ってください。";

// --- 型定義 ---

export type JobType = string;
export type CompanyType = string;
export type Difficulty = "easy" | "medium" | "hard";

export interface QAPair {
  question: string;
  answer: string;
  score?: number;
  feedback?: string;
}

export interface InterviewQuestionResult {
  question: string;
}

export interface EvaluateAnswerResult {
  score: number;
  feedback: string;
}

export interface FinalFeedbackResult {
  feedback: string;
}

// --- 面接質問の生成 ---

/**
 * 面接質問を1つ生成する。
 * @param jobType 職種（例: エンジニア、営業）
 * @param companyType 企業タイプ（例: メーカー、IT）
 * @param difficulty 難易度
 * @param previousQA これまでの質問と回答の配列（重複・深掘り防止用）
 */
export async function generateInterviewQuestion(
  jobType: JobType,
  companyType: CompanyType,
  difficulty: Difficulty,
  previousQA: QAPair[] = []
): Promise<InterviewQuestionResult> {
  const context =
    previousQA.length > 0
      ? `\n【これまでの質疑】\n${previousQA
          .map(
            (qa, i) =>
              `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
          )
          .join("\n\n")}\n上記とは被らない、次の段階に進む質問をしてください。`
      : "";

  const difficultyGuide = {
    easy: "基本的な志望動機・自己PRレベル",
    medium: "経験・スキル・チームワークに関する実践的な質問",
    hard: "課題解決・価値観・逆質問まで含む深掘り・難問",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${PERSONA}\n職種: ${jobType}、企業タイプ: ${companyType} を想定した面接を行います。質問は日本語で1つだけ、明確に出力してください。`,
      },
      {
        role: "user",
        content: `難易度: ${difficulty}（${difficultyGuide[difficulty]}）。${context}\n\n次の面接質問を1つ生成してください。質問文のみを返してください。`,
      },
    ],
    temperature: 0.7,
  });

  const question =
    response.choices[0]?.message?.content?.trim() ||
    "本日はお時間いただきありがとうございました。";

  return { question };
}

// --- 回答の評価（スコア・フィードバック）---

/**
 * 回答を評価し、スコア(0-100)とフィードバックを返す。
 * @param question 質問文
 * @param answer 回答文
 * @param jobType 職種（評価の文脈用）
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  jobType: JobType
): Promise<EvaluateAnswerResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${PERSONA}\n職種「${jobType}」の面接において、回答を0〜100のスコアで評価し、簡潔なフィードバックを日本語で返してください。厳しすぎず、改善点と良かった点の両方に触れてください。`,
      },
      {
        role: "user",
        content: `【質問】\n${question}\n\n【回答】\n${answer}\n\n以下のJSON形式のみで答えてください。\n{"score": 0以上100以下の整数, "feedback": "フィードバック文"}`,
      },
    ],
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content?.trim() || "{}";
  const parsed = parseEvaluateResponse(raw);

  return {
    score: Math.min(100, Math.max(0, parsed.score)),
    feedback: parsed.feedback || "評価できませんでした。",
  };
}

function parseEvaluateResponse(raw: string): { score: number; feedback: string } {
  try {
    const cleaned = raw.replace(/```json?\s*/gi, "").replace(/```\s*/g, "").trim();
    const obj = JSON.parse(cleaned);
    return {
      score: typeof obj.score === "number" ? obj.score : Number(obj.score) || 0,
      feedback: String(obj.feedback ?? ""),
    };
  } catch {
    const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/);
    const feedbackMatch = raw.match(/"feedback"\s*:\s*"([^"]*)"/);
    return {
      score: scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 0,
      feedback: feedbackMatch ? feedbackMatch[1] : raw.slice(0, 500),
    };
  }
}

// --- セッション全体の総評 ---

/**
 * セッション全体のQ&Aから総評を生成する。
 * @param allQA 質問・回答・スコア・フィードバックの配列
 */
export async function generateFinalFeedback(
  allQA: QAPair[]
): Promise<FinalFeedbackResult> {
  if (allQA.length === 0) {
    return { feedback: "回答がありませんでした。" };
  }

  const sessionSummary = allQA
    .map(
      (qa, i) =>
        `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}` +
        (qa.score != null ? ` [スコア: ${qa.score}]` : "") +
        (qa.feedback ? `\nフィードバック: ${qa.feedback}` : "")
    )
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${PERSONA}\n面接セッション全体の総評を、日本語で簡潔に（300字程度）書いてください。強み・改善点・総合所見のバランスを取ってください。`,
      },
      {
        role: "user",
        content: `【本日の面接のやり取り】\n${sessionSummary}\n\n上記を踏まえ、候補者への総評を1つの文章で出力してください。`,
      },
    ],
    temperature: 0.4,
  });

  const feedback =
    response.choices[0]?.message?.content?.trim() ||
    "総評を生成できませんでした。";

  return { feedback };
}
