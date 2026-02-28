import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_ID_PRO } from "../../../../lib/stripe";
import { createServerSupabase } from "../../../../lib/supabase/server";
import { getAuthUser } from "../../../../lib/supabase/route-handler";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);
    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    if (!STRIPE_PRICE_ID_PRO) {
      return NextResponse.json(
        { error: "Stripe Price ID が設定されていません" },
        { status: 500 }
      );
    }

    const supabase = createServerSupabase();

    // 既存の Stripe Customer があれば利用
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .maybeSingle();

    let customerId: string | undefined = sub?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/interview?checkout=success`,
      cancel_url: `${APP_URL}/interview?checkout=cancel`,
      subscription_data: {
        metadata: { user_id: user.id },
      },
      metadata: { user_id: user.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "チェックアウトURLの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました" },
      { status: 500 }
    );
  }
}
