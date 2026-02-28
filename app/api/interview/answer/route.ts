import { NextRequest, NextResponse } from "next/server";
import {
  generateInterviewQuestion,
  evaluateAnswer,
  generateFinalFeedback,
  type QAPair,
} from "../../../../lib/openai";

const DIFFICULTY = "medium" as const;
const TOTAL_QUESTIONS = 5;

/** 次の質問を取得（answer がない場合） */
async function handleGetQuestion(
  jobType: string,
  companyType: string,
  previousQA: QAPair[] = []
) {
  const { question } = await generateInterviewQuestion(
    jobType,
    companyType,
    DIFFICULTY,
    previousQA
  );
  return NextResponse.json({ question });
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
    nextQuestion,
    finished: false,
    allQA,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
        { error: "jobType と companyType は必須です" },
        { status: 400 }
      );
    }

    if (answer !== undefined && answer !== null && question) {
      return handleSubmitAnswer(
        question,
        String(answer),
        jobType,
        companyType,
        Array.isArray(previousQA) ? previousQA : []
      );
    }

    return handleGetQuestion(jobType, companyType, Array.isArray(previousQA) ? previousQA : []);
  } catch (e) {
    console.error("[api/interview/answer]", e);
    return NextResponse.json(
      { error: "処理に失敗しました" },
      { status: 500 }
    );
  }
}
