// src/components/PlanGate.jsx
// ─── プラン制限ゲート ─────────────────────────────────────────
// <PlanGate feature="excel_export" plan={org.plan}>
//   <ExcelButton />   ← このボタンはstandardのみ表示
// </PlanGate>

import { useState } from "react";
import { C } from "../tokens.js";
import { canUseFeature, PLANS, PRICE_IDS, createCheckoutSession } from "../lib/billing.js";

// ─── Plan badge（サイドバーなどで現在プランを表示） ──────────
export function PlanBadge({ plan }) {
  const p = PLANS[plan] || PLANS.starter;
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 500,
      background: p.color + "22", color: p.color,
    }}>{p.name}</span>
  );
}

// ─── Upgrade banner（プラン制限に引っかかった時に表示） ───────
export function UpgradeBanner({ feature, orgId, userEmail, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const FEATURE_LABELS = {
    excel_export:  "Excel出力",
    multi_user:    "複数ユーザー招待",
    ai:            "AI相談（無制限）",
    locations:     "複数拠点管理",
    products:      "製品数の追加",
  };

  const handleUpgrade = async () => {
    const priceId = PRICE_IDS.standard;
    if (!priceId) { setErr("環境変数 VITE_STRIPE_PRICE_STANDARD が未設定です"); return; }
    setLoading(true);
    try {
      const url = await createCheckoutSession({ priceId, orgId, email: userEmail, plan: "standard" });
      window.location.href = url;
    } catch (e) { setErr(e.message); setLoading(false); }
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.teal}18, ${C.blue}18)`,
      border: `1px solid ${C.teal}44`,
      borderRadius: 10, padding: "1rem 1.25rem",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>⚡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: C.tx }}>
          {FEATURE_LABELS[feature] || feature} はスタンダードプランで利用できます
        </div>
        <div style={{ fontSize: 12, color: C.txM }}>
          14日間無料トライアル付き · ¥9,800/月 · いつでもキャンセル可
        </div>
        {err && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{err}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: C.teal, color: C.bg, fontWeight: 500, fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}
        >{loading ? "処理中..." : "アップグレード"}</button>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.txD, cursor: "pointer", fontSize: 16, padding: "4px 6px" }}>✕</button>
        )}
      </div>
    </div>
  );
}

// ─── PlanGate: 機能をプランで制限する ────────────────────────
export function PlanGate({ feature, plan, orgId, userEmail, children, fallback }) {
  const [showBanner, setShowBanner] = useState(false);

  if (canUseFeature(plan, feature)) {
    return children;
  }

  if (fallback) return fallback;

  return (
    <div>
      {showBanner
        ? <UpgradeBanner feature={feature} orgId={orgId} userEmail={userEmail} onClose={() => setShowBanner(false)}/>
        : <button
            onClick={() => setShowBanner(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${C.teal}44`, background: C.tD,
              color: C.teal, fontSize: 12, cursor: "pointer",
            }}
          >⚡ {feature === "excel_export" ? "Excel出力" : "この機能を使う"}（アップグレードが必要）</button>
      }
    </div>
  );
}

// ─── LimitWarning: 上限に近づいたら警告 ──────────────────────
export function LimitWarning({ resource, current, max, plan, orgId, userEmail }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || max === Infinity || current < max * 0.8) return null;

  const isOver = current >= max;
  const LABELS = { locations: "拠点", products: "製品" };

  return (
    <div style={{
      background: isOver ? C.rD : C.aD,
      border: `1px solid ${isOver ? C.rB : C.aB}`,
      borderRadius: 8, padding: "9px 14px",
      display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 12,
      color: isOver ? C.red : C.amber,
    }}>
      <span>{isOver ? "⚠" : "！"}</span>
      <span style={{ flex: 1 }}>
        {LABELS[resource] || resource}数が{isOver ? "上限" : "上限の80%"}に達しました（{current}/{max}）。
        {isOver && "プランをアップグレードしてください。"}
      </span>
      {!isOver && <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}>✕</button>}
    </div>
  );
}

// ─── SubscriptionStatus: 現在のサブスク状態表示 ───────────────
export function SubscriptionStatus({ org, user, onManage, onUpgrade }) {
  if (!org) return null;
  const plan = PLANS[org.plan] || PLANS.starter;
  const isPaid = org.plan !== "starter";
  const expiresAt = org.plan_expires_at ? new Date(org.plan_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();

  return (
    <div style={{ background: C.bgL, border: `1px solid ${C.b}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: C.txD, marginBottom: 4 }}>現在のプラン</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: plan.color }}>{plan.name}</span>
            {isExpired && <span style={{ fontSize: 11, background: C.rD, color: C.red, padding: "2px 8px", borderRadius: 10 }}>期限切れ</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isPaid
            ? <button onClick={onManage} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.bM}`, background: "transparent", color: C.txM, cursor: "pointer" }}>プランを管理</button>
            : <button onClick={onUpgrade} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: "none", background: C.teal, color: C.bg, fontWeight: 500, cursor: "pointer" }}>アップグレード ⚡</button>
          }
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "拠点", max: plan.maxLocations },
          { label: "製品", max: plan.maxProducts },
          { label: "AI相談/月", max: plan.maxAICalls === Infinity ? "∞" : plan.maxAICalls },
        ].map(item => (
          <div key={item.label} style={{ fontSize: 12 }}>
            <span style={{ color: C.txD }}>{item.label}: </span>
            <span style={{ color: C.txM, fontFamily: "'DM Mono', monospace" }}>{item.max === Infinity ? "∞" : item.max}</span>
          </div>
        ))}
        {expiresAt && !isExpired && (
          <div style={{ fontSize: 12 }}>
            <span style={{ color: C.txD }}>次回更新: </span>
            <span style={{ color: C.txM }}>{expiresAt.toLocaleDateString("ja-JP")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
