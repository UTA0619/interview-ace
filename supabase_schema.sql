-- Supabase テーブル作成SQL
-- users, interview_sessions, interview_messages, subscriptions

-- UUID拡張を有効化（未設定の場合）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. users テーブル
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================
-- 2. interview_sessions テーブル
-- ============================================
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_type TEXT,
  company_type TEXT,
  difficulty TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_created_at ON public.interview_sessions(created_at);

-- ============================================
-- 3. interview_messages テーブル
-- ============================================
CREATE TABLE public.interview_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_interview_messages_session_id ON public.interview_messages(session_id);
CREATE INDEX idx_interview_messages_created_at ON public.interview_messages(created_at);

-- ============================================
-- 4. subscriptions テーブル
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ============================================
-- Row Level Security (RLS) の有効化（オプション）
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLSポリシーは認証方式に応じて後から追加してください
-- 例: 認証済みユーザーが自分のデータのみアクセス可能にするなど
