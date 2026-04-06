// src/pages/Pricing.jsx
import { useState } from "react";
import { C } from "../tokens.js";
import { PLANS, PRICE_IDS, createCheckoutSession } from "../lib/billing.js";
import { Btn, Card } from "../components/Atoms.jsx";

export default function Pricing({ org, user, onClose }) {
  const [loading, setLoading] = useState(null);
  const [err, setErr] = useState("");

  const currentPlan = org?.plan || "starter";

  const handleUpgrade = async (planKey) => {
    const priceId = PRICE_IDS[planKey];
    if (!priceId) {
      setErr("価格IDが設定されていません。VITE_STRIPE_PRICE_* 環境変数を確認してください。");
      return;
    }
    setLoading(planKey);
    setErr("");
    try {
      const url = await createCheckoutSession({
        priceId,
        orgId: org.id,
        email: user?.email,
        plan: planKey,
      });
      window.location.href = url;
    } catch (e) {
      setErr(e.message);
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: C.teal, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>管理会計ダッシュボード</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>シンプルな料金プラン</div>
            <div style={{ fontSize: 14, color: C.txM }}>
              スタンダード・プロは<span style={{ color: C.teal, fontWeight: 500 }}>14日間無料トライアル</span>付き。カード登録後すぐ全機能が使えます。
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.txD, cursor: "pointer", fontSize: 20, padding: "4px 8px" }}>✕</button>
          )}
        </div>

        {err && (
          <div style={{ background: C.rD, border: `1px solid ${C.rB}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 16 }}>
            {err}
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: "2rem" }}>
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent = key === currentPlan;
            const isRecommended = plan.recommended;

            return (
              <div key={key} style={{
                background: C.bgM,
                border: `1px solid ${isRecommended ? plan.color + "55" : C.b}`,
                borderRadius: 14,
                padding: "1.5rem",
                position: "relative",
                boxShadow: isRecommended ? `0 0 0 1px ${plan.color}33` : "none",
              }}>
                {isRecommended && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: plan.color, color: C.bg, fontSize: 11, fontWeight: 500,
                    padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap",
                  }}>おすすめ</div>
                )}

                {/* Plan name & price */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: plan.color }} />
                    <span style={{ fontSize: 15, fontWeight: 500, color: plan.color }}>{plan.name}</span>
                    {isCurrent && <span style={{ fontSize: 11, background: plan.color + "22", color: plan.color, padding: "2px 8px", borderRadius: 10 }}>現在のプラン</span>}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 500, color: C.tx, marginBottom: 4 }}>{plan.priceLabel}</div>
                  {plan.trial && <div style={{ fontSize: 12, color: C.teal }}>✓ {plan.trial}日間無料トライアル</div>}
                </div>

                {/* Features */}
                <div style={{ borderTop: `1px solid ${C.b}`, paddingTop: "1rem", marginBottom: "1.25rem" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: C.txM }}>
                      <span style={{ color: plan.color, fontSize: 14, flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{ width: "100%", textAlign: "center", padding: "9px", fontSize: 13, color: C.txD, border: `1px solid ${C.b}`, borderRadius: 8 }}>
                    現在利用中
                  </div>
                ) : key === "starter" ? (
                  <div style={{ width: "100%", textAlign: "center", padding: "9px", fontSize: 13, color: C.txD }}>
                    無料で続ける
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={!!loading}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 8, border: "none",
                      background: isRecommended ? plan.color : plan.color + "22",
                      color: isRecommended ? C.bg : plan.color,
                      fontWeight: 500, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading && loading !== key ? 0.5 : 1, transition: "all .15s",
                    }}
                  >
                    {loading === key ? "処理中..." : `${plan.name}を始める`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <Card style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>機能比較</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: C.txD, fontWeight: 500, borderBottom: `1px solid ${C.b}` }}>機能</th>
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <th key={key} style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, color: plan.color, fontWeight: 500, borderBottom: `1px solid ${C.b}` }}>{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "拠点数",           vals: ["1",  "10", "無制限"] },
                  { label: "製品数",           vals: ["3",  "50", "無制限"] },
                  { label: "AI相談",           vals: ["月5回", "無制限", "無制限"] },
                  { label: "Excel出力",        vals: ["✗", "✓", "✓"] },
                  { label: "複数ユーザー招待", vals: ["✗", "✓", "✓"] },
                  { label: "PL・BS・CF作成",  vals: ["✓", "✓", "✓"] },
                  { label: "領収書OCR",        vals: ["✓", "✓", "✓"] },
                  { label: "月次比較レポート", vals: ["✓", "✓", "✓"] },
                  { label: "税務サマリー",     vals: ["✓", "✓", "✓"] },
                  { label: "API連携（将来）",  vals: ["✗", "✗", "✓"] },
                  { label: "サポート",         vals: ["メール", "優先メール", "専任担当"] },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.b}` }}>
                    <td style={{ padding: "9px 12px", color: C.txM }}>{row.label}</td>
                    {row.vals.map((v, j) => {
                      const planKeys = Object.keys(PLANS);
                      const planColor = PLANS[planKeys[j]].color;
                      const isCheck = v === "✓";
                      const isCross = v === "✗";
                      return (
                        <td key={j} style={{ padding: "9px 12px", textAlign: "center", color: isCross ? C.txD : isCheck ? planColor : C.txM }}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>よくある質問</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { q: "無料トライアル後、自動的に課金されますか？", a: "はい、14日後にご登録のカードに自動課金されます。トライアル終了前にキャンセルすれば料金は発生しません。" },
              { q: "いつでもキャンセルできますか？", a: "はい、いつでもカスタマーポータルからキャンセルできます。解約後は当月末まで引き続きご利用いただけます。" },
              { q: "プランのアップグレード・ダウングレードは？", a: "カスタマーポータルからいつでも変更できます。差額は日割り計算で自動調整されます。" },
              { q: "データはどこに保存されますか？", a: "Supabase（東京リージョン）に保存されます。他社のデータは完全に分離されており、弊社がアクセスすることはありません。" },
              { q: "請求書は発行されますか？", a: "Stripeのカスタマーポータルから月次の請求書PDFをダウンロードできます。法人向けに適格請求書（インボイス）対応も予定しています。" },
            ].map(({ q, a }) => (
              <details key={q} style={{ background: C.bgM, border: `1px solid ${C.b}`, borderRadius: 8, padding: "12px 16px" }}>
                <summary style={{ fontSize: 13, fontWeight: 500, cursor: "pointer", color: C.tx, listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                  {q} <span style={{ color: C.txD }}>＋</span>
                </summary>
                <div style={{ fontSize: 13, color: C.txM, marginTop: 10, lineHeight: 1.75 }}>{a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ textAlign: "center", color: C.txD, fontSize: 13 }}>
          ご質問は <span style={{ color: C.teal }}>support@kanri-kaikei.jp</span> までお気軽にご連絡ください。
        </div>
      </div>
    </div>
  );
}
