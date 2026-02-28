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

/** 次の質問を取得（answer がない場合）。必ず { question: string } の JSON で返す。 */
async function handleGetQuestion(
  jobType: string,
  companyType: string,
  previousQA: QAPair[] = []
): Promise<NextResponse> {
  try {
    const result = await generateInterviewQuestion(
      jobType,
      companyType,
      DIFFICULTY,
      previousQA
    );
    const question = result.question?.trim() || FALLBACK_QUESTION;
    return NextResponse.json({ question }, { status: 200 });
  } catch (e) {
    console.error("[api/interview/answer] handleGetQuestion:", e);
    return NextResponse.json(
      { question: FALLBACK_QUESTION, error: "質問の生成に失敗しました" },
      { status: 200 }
    );
  }
}

/** 回答を送信し、評価と次問 or 総評を返す */
async function handleSubmitAnswer(
  question: string,
  answer: string,
  jobType: string,
  companyType: string,
  previousQA: QAPair[]
) {
  const { score, feedback } = await evaluateAnswer(question, answer, jobType);
  const currentQA: QAPair = { question, answer, score, feedback };
  const allQA: QAPair[] = [...previousQA, currentQA];

  if (allQA.length >= TOTAL_QUESTIONS) {
    const { feedback: finalFeedback } = await generateFinalFeedback(allQA);
    return NextResponse.json({
      score,
      feedback,
      finalFeedback,
      finished: true,
      allQA,
    });
  }

  const { question: nextQuestion } = await generateInterviewQuestion(
    jobType,
    companyType,
    DIFFICULTY,
    allQA
  );

  return NextResponse.json({
    score,
    feedback,
    nextQuestion: nextQuestion?.trim() || FALLBACK_QUESTION,
    finished: false,
    allQA,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    const raw = await request.text();
    if (raw && raw.trim()) {
      body = JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です", question: FALLBACK_QUESTION },
      { status: 400 }
    );
  }

  const {
    question,
    answer,
    jobType,
    companyType,
    previousQA = [],
  } = body as {
    question?: string;
    answer?: string;
    jobType?: string;
    companyType?: string;
    previousQA?: QAPair[];
  };

  if (!jobType || !companyType) {
    return NextResponse.json(
      { error: "jobType と companyType は必須です", question: FALLBACK_QUESTION },
      { status: 400 }
    );
  }

  if (answer !== undefined && answer !== null && question) {
    try {
      return await handleSubmitAnswer(
        String(question),
        String(answer),
        String(jobType),
        String(companyType),
        Array.isArray(previousQA) ? previousQA : []
      );
    } catch (e) {
      console.error("[api/interview/answer] handleSubmitAnswer:", e);
      return NextResponse.json(
        { error: "処理に失敗しました", question: FALLBACK_QUESTION },
        { status: 500 }
      );
    }
  }

  return handleGetQuestion(
    String(jobType),
    String(companyType),
    Array.isArray(previousQA) ? previousQA : []
  );
}
