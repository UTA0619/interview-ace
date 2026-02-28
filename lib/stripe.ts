import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

/** Proプラン 月額980円のPrice ID（Stripeダッシュボードで作成したIDを env に設定） */
export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO ?? "";

export const PLANS = {
  free: { name: "Free", monthlyLimit: 3 },
  pro: { name: "Pro", monthlyLimit: null },
} as const;

export type PlanKey = keyof typeof PLANS;
