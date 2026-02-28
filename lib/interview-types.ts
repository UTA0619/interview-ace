/** 面接結果の1問分（スコア・フィードバック付き） */
export interface InterviewResultItem {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

/** 面接結果（結果ページで表示するデータ） */
export interface InterviewResult {
  totalScore: number;
  finalFeedback?: string;
  items: InterviewResultItem[];
}

export const SESSION_RESULT_STORAGE_KEY = "interview_session_result";
