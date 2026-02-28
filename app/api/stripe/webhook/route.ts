import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "../../../../lib/stripe";
import { createServerSupabase } from "../../../../lib/supabase/server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.client_reference_id || session.metadata?.user_id) as string | null;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!userId || !customerId) {
          console.warn("[stripe/webhook] checkout.session.completed: missing userId or customerId");
          break;
        }

        // subscriptions にレコードがあれば更新、なければ挿入
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("subscriptions")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: "active",
              plan: "pro",
            })
            .eq("user_id", userId);
        } else {
          await supabase.from("subscriptions").insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: "active",
            plan: "pro",
          });
        }

        await supabase
          .from("users")
          .update({ plan: "pro" })
          .eq("id", userId);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;
        const status = subscription.status;
        const isActive = status === "active" || status === "trialing";
        const plan = isActive ? "pro" : "free";

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subId)
          .single();

        if (sub?.user_id) {
          await supabase
            .from("subscriptions")
            .update({ status, plan })
            .eq("stripe_subscription_id", subId);
          await supabase
            .from("users")
            .update({ plan })
            .eq("id", sub.user_id);
        }
        break;
      }

      default:
        // 未処理のイベントは無視
        break;
    }
  } catch (e) {
    console.error("[stripe/webhook] Handler error:", e);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
