// api/stripe-webhook.js
// ─── Stripe Webhook 処理 ──────────────────────────────────────
// Stripe → このエンドポイントにイベントが届く
// サブスクリプション状態をSupabaseに書き戻す

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Supabase Service Role Key（RLSをバイパスしてDB書き込み）
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vercel は body を自動パースするので rawBody が必要
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// プランID → plan文字列のマッピング
const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_STANDARD]: "standard",
  [process.env.STRIPE_PRICE_PRO]:      "pro",
};

async function updateOrgPlan(orgId, plan, stripeData = {}) {
  const { error } = await supabase
    .from("organizations")
    .update({
      plan,
      stripe_customer_id:    stripeData.customerId    || null,
      stripe_subscription_id:stripeData.subscriptionId|| null,
      plan_expires_at:       stripeData.currentPeriodEnd
        ? new Date(stripeData.currentPeriodEnd * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) console.error("DB update error:", error);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] ${event.type}`);

  try {
    switch (event.type) {
      // ─── サブスクリプション作成・更新 ────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || "starter";

        // トライアル中でも standard 扱い
        const effectivePlan = sub.status === "trialing" ? plan : (
          ["active", "past_due"].includes(sub.status) ? plan : "starter"
        );

        await updateOrgPlan(orgId, effectivePlan, {
          customerId:     sub.customer,
          subscriptionId: sub.id,
          currentPeriodEnd: sub.current_period_end,
        });
        break;
      }

      // ─── サブスクリプション削除（解約） ──────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        await updateOrgPlan(orgId, "starter", {
          customerId: sub.customer,
          subscriptionId: null,
        });
        break;
      }

      // ─── 支払い成功 ──────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || "starter";
        await updateOrgPlan(orgId, plan, {
          customerId:     sub.customer,
          subscriptionId: sub.id,
          currentPeriodEnd: sub.current_period_end,
        });
        break;
      }

      // ─── 支払い失敗 ──────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`[Stripe] Payment failed for customer: ${invoice.customer}`);
        // past_due になるので subscription.updated で処理される
        break;
      }

      // ─── チェックアウト完了 ──────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription") {
          // subscription.created イベントで処理済みのためここでは何もしない
          console.log(`[Stripe] Checkout completed: ${session.id}`);
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    return res.status(500).json({ error: "Internal error" });
  }

  return res.status(200).json({ received: true });
}
