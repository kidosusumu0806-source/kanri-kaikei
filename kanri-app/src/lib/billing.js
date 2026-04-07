// src/lib/billing.js
// ─── プラン制限・課金ユーティリティ ──────────────────────────

// ─── プラン定義（フロント側で参照する静的定義） ──────────────
export const PLANS = {
  starter: {
    name:            "スターター",
    price:           0,
    priceLabel:      "無料",
    color:           "#5B9EFF",
    maxLocations:    1,
    maxProducts:     3,
    maxAICalls:      5,
    excelExport:     false,
    multiUser:       false,
    features: [
      "1拠点",
      "品目3つまで",
      "AI相談 月5回",
      "PL・BS・CF閲覧",
    ],
  },
  standard: {
    name:            "スタンダード",
    price:           9800,
    priceLabel:      "¥9,800 / 月",
    color:           "#00D4A8",
    maxLocations:    10,
    maxProducts:     50,
    maxAICalls:      Infinity,
    excelExport:     true,
    multiUser:       true,
    trial:           14,
    features: [
      "10拠点",
      "品目50まで",
      "AI相談 無制限",
      "Excel出力",
      "複数ユーザー招待",
      "優先メールサポート",
    ],
    recommended:     true,
  },
  pro: {
    name:            "プロ",
    price:           29800,
    priceLabel:      "¥29,800 / 月",
    color:           "#A78BFA",
    maxLocations:    Infinity,
    maxProducts:     Infinity,
    maxAICalls:      Infinity,
    excelExport:     true,
    multiUser:       true,
    trial:           14,
    features: [
      "拠点・品目 無制限",
      "AI相談 無制限",
      "Excel出力",
      "複数ユーザー招待",
      "API連携（将来）",
      "専任サポート",
    ],
  },
};

// ─── チェックアウトセッション作成 ────────────────────────────
export async function createCheckoutSession({ priceId, orgId, email, plan }) {
  const res = await fetch("/api/stripe-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, orgId, email, plan }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout session creation failed");
  return data.url;
}

// ─── カスタマーポータルURL取得 ────────────────────────────────
export async function openCustomerPortal(orgId) {
  const res = await fetch("/api/stripe-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Portal session creation failed");
  window.location.href = data.url;
}

// ─── プラン制限チェック ───────────────────────────────────────
export function canUseFeature(orgPlan, feature) {
  const plan = PLANS[orgPlan] || PLANS.starter;
  switch (feature) {
    case "excel_export":  return plan.excelExport;
    case "multi_user":    return plan.multiUser;
    case "ai":            return plan.maxAICalls > 0;
    default:              return true;
  }
}

export function isOverLimit(orgPlan, resource, currentCount) {
  const plan = PLANS[orgPlan] || PLANS.starter;
  switch (resource) {
    case "locations": return currentCount >= plan.maxLocations;
    case "products":  return currentCount >= plan.maxProducts;
    default:          return false;
  }
}

// ─── 価格ID環境変数（Vercel環境変数から参照） ────────────────
export const PRICE_IDS = {
  standard: import.meta.env.VITE_STRIPE_PRICE_STANDARD || "",
  pro:      import.meta.env.VITE_STRIPE_PRICE_PRO      || "",
};
