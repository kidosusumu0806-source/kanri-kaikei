# Stripe 連携セットアップガイド

## アーキテクチャ

```
ブラウザ（React）
  │
  ├─ /pricing          ← 料金ページ（src/pages/Pricing.jsx）
  ├─ /api/stripe-checkout  ← チェックアウトセッション作成
  ├─ /api/stripe-portal    ← カスタマーポータル
  └─ /api/stripe-webhook   ← Stripe→DB同期（署名検証付き）
        │
        └─ Supabase organizations.plan を更新
```

---

## STEP 1: Stripe アカウント設定

### 1-1. 商品・価格を作成

Stripe Dashboard → Products → Add product

| 商品名 | 価格 | 課金タイプ |
|--------|------|-----------|
| 管理会計ダッシュボード スタンダード | ¥9,800 | 月次サブスクリプション |
| 管理会計ダッシュボード プロ | ¥29,800 | 月次サブスクリプション |

作成後、各商品の **Price ID**（`price_xxx`）をコピーしておく。

### 1-2. カスタマーポータル設定

Stripe Dashboard → Settings → Billing → Customer portal

- **Invoice history**: ON
- **Payment method management**: ON
- **Subscription cancellation**: ON（即時 or 期間末を選択）
- **Plan switching**: ON（アップグレード・ダウングレード許可）

### 1-3. Webhook 設定

Stripe Dashboard → Developers → Webhooks → Add endpoint

**Endpoint URL**:
```
https://your-app.vercel.app/api/stripe-webhook
```

**Listen to events**（以下をすべてチェック）:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

Webhook 追加後、**Signing secret**（`whsec_xxx`）をコピー。

---

## STEP 2: 環境変数を設定

`.env.local` に記入:

```env
# Stripe（テスト環境）
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# 価格ID（上で作成したもの）
VITE_STRIPE_PRICE_STANDARD=price_xxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxxxxxxxxx
STRIPE_PRICE_STANDARD=price_xxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## STEP 3: ローカルでWebhookテスト

Stripe CLI を使ってローカルにWebhookを転送：

```bash
# Stripe CLI インストール（macOS）
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# ローカルに転送
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

別ターミナルでサブスクのテスト：

```bash
# テスト用サブスクリプション作成
stripe subscriptions create \
  --customer cus_test123 \
  --items[0][price]=price_xxxxxxxxxxxx

# Webhookイベントを手動トリガー
stripe trigger customer.subscription.created
```

---

## STEP 4: Vercel 環境変数に追加

Vercel Dashboard → Project → Settings → Environment Variables

| 変数名 | 値 |
|--------|-----|
| `STRIPE_SECRET_KEY` | `sk_live_xxx`（本番）|
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` |
| `VITE_STRIPE_PRICE_STANDARD` | `price_xxx` |
| `VITE_STRIPE_PRICE_PRO` | `price_xxx` |
| `STRIPE_PRICE_STANDARD` | `price_xxx` |
| `STRIPE_PRICE_PRO` | `price_xxx` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

---

## STEP 5: Supabaseマイグレーション適用

```sql
-- Supabase SQL Editor で実行
-- supabase/migrations/003_stripe.sql の内容を貼り付けて実行
```

これにより `organizations` テーブルに以下が追加されます：
- `stripe_customer_id`
- `stripe_subscription_id`
- `plan_expires_at`

---

## フロント側の使い方

### 料金ページを表示

```jsx
import Pricing from "./src/pages/Pricing.jsx";

// AppSupabase.jsx のタブに追加
{tab === "pricing" && <Pricing org={org} user={user} onClose={() => setTab("dashboard")}/>}
```

### 機能をプランで制限

```jsx
import { PlanGate } from "./src/components/PlanGate.jsx";

// Excel出力ボタンをスタンダード以上に制限
<PlanGate feature="excel_export" plan={org.plan} orgId={org.id} userEmail={user.email}>
  <button onClick={exportExcel}>📊 Excel出力</button>
</PlanGate>
```

### プラン上限に達したら警告

```jsx
import { LimitWarning } from "./src/components/PlanGate.jsx";

<LimitWarning
  resource="locations"
  current={locationList.length}
  max={PLANS[org.plan]?.maxLocations}
  plan={org.plan}
  orgId={org.id}
  userEmail={user.email}
/>
```

### カスタマーポータルを開く

```jsx
import { openCustomerPortal } from "./src/lib/billing.js";

<button onClick={() => openCustomerPortal(org.id)}>
  プランを管理
</button>
```

---

## テストカード番号（Stripe テストモード）

| 用途 | カード番号 |
|------|-----------|
| 成功 | `4242 4242 4242 4242` |
| 認証必要 | `4000 0025 0000 3155` |
| 支払い失敗 | `4000 0000 0000 9995` |

有効期限: 任意の将来日付、CVC: 任意3桁

---

## 本番リリースチェックリスト

- [ ] Stripe を**ライブモード**に切り替え（`sk_live_` キーを使用）
- [ ] Webhook の本番URLを設定
- [ ] テストカードで購入→Webhook→DB更新を確認
- [ ] 解約フローを確認
- [ ] カスタマーポータルの外観をカスタマイズ（ロゴ・カラー）
- [ ] 特定商取引法に基づく表示ページを作成
- [ ] プライバシーポリシーに課金情報の取り扱いを記載
