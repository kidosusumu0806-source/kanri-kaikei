// api/stripe-portal.js
// ─── Stripe カスタマーポータル ────────────────────────────────
// ユーザーがプラン変更・解約・請求書確認をできるポータルURLを生成

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orgId } = req.body;
  if (!orgId) return res.status(400).json({ error: "orgId が必要です" });

  try {
    // Supabase から stripe_customer_id を取得
    const { data: org, error } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", orgId)
      .single();

    if (error || !org?.stripe_customer_id) {
      return res.status(404).json({ error: "Stripe顧客情報が見つかりません" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${APP_URL}/dashboard`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Portal session error:", err);
    return res.status(500).json({ error: err.message });
  }
}
