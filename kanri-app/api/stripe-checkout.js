// api/stripe-checkout.js
// ─── Stripe チェックアウトセッション作成 ─────────────────────
// フロントから { priceId, orgId, email } を受け取り
// Stripe Checkout のURLを返す

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { priceId, orgId, email, plan } = req.body;

  if (!priceId || !orgId || !email) {
    return res.status(400).json({ error: "priceId, orgId, email が必要です" });
  }

  try {
    // 既存の Stripe Customer を検索（重複課金防止）
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { org_id: orgId },
      });
    }

    // Checkout Session 作成
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // サブスク開始後 → /dashboard?upgraded=true にリダイレクト
      success_url: `${APP_URL}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/pricing?canceled=true`,
      locale: "ja",
      subscription_data: {
        metadata: { org_id: orgId, plan },
        trial_period_days: 14,  // 14日間無料トライアル
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
