# Supabase 連携セットアップガイド

## 全体像

```
ブラウザ
  └── React App
        ├── Supabase Auth（ログイン・サインアップ）
        ├── Supabase Database（データ読み書き）
        └── Supabase Storage（領収書画像）

Vercel Serverless
  └── /api/claude.js（Anthropic API呼び出し）
```

---

## STEP 1: Supabaseプロジェクト作成

1. [supabase.com](https://supabase.com) → New Project
2. プロジェクト名・DB パスワードを設定
3. リージョン：**Northeast Asia（Tokyo）** を選択

---

## STEP 2: データベーススキーマ適用

Supabase ダッシュボード → **SQL Editor** を開いて以下を順番に実行：

```
supabase/migrations/001_initial.sql  ← テーブル・RLS・トリガー
supabase/migrations/002_storage.sql  ← Storage バケットポリシー
```

### テーブル構成

| テーブル | 役割 |
|----------|------|
| `organizations` | テナント（会社）。1社 = 1行 |
| `org_members` | ユーザーと組織の紐付け・権限管理 |
| `locations` | 拠点・事業部 |
| `periods` | 会計期間（"2024年4月" など） |
| `period_data` | 期間ごとのCSV・費目・計算結果 |
| `journal_entries` | 仕訳帳 |
| `financial_statements` | PL・BS・CF・月次・税務のJSON |
| `receipts` | 領収書OCR結果 |

### セキュリティ（Row Level Security）

- **全テーブルにRLS有効**
- `org_members` に所属しているユーザーのみ自組織データにアクセス可
- 他社のデータは一切見えない設計

---

## STEP 3: 環境変数設定

### ローカル開発（.env.local）

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
# Supabase Dashboard → Project Settings → API
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Vercel Serverless用（ローカルでは .env.local に書いても動作する）
ANTHROPIC_API_KEY=sk-ant-...
```

### Vercel（本番）

Vercel Dashboard → Project → Settings → Environment Variables に追加：

| 変数名 | 値 | 対象 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Production / Preview |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Production / Preview |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production / Preview |

> **注意**: `VITE_` プレフィックスは Vite がフロントエンドに埋め込む環境変数。  
> `ANTHROPIC_API_KEY` はフロントに露出しないよう `VITE_` をつけない。

---

## STEP 4: Auth 設定（Supabase Dashboard）

1. **Authentication → Settings → Email** を確認
2. **Confirm email** を ON にする（本番推奨）
3. **Site URL** に本番URLを設定：`https://your-app.vercel.app`
4. **Redirect URLs** に追加：`https://your-app.vercel.app/**`

---

## STEP 5: デプロイ

```bash
npm install
npm run build   # ビルド確認

git add .
git commit -m "supabase integration"
git push
```

Vercel が自動デプロイ → 完了！

---

## ユーザー招待（メンバー追加）

### 方法1: Supabase Dashboard から
Authentication → Users → Invite User

### 方法2: コードから（将来実装）
```js
// src/lib/db.js の orgs.inviteMember() を呼ぶ
await orgs.inviteMember(orgId, "colleague@company.com", "member");
```

---

## プラン管理（将来のStripe連携）

`organizations.plan` フィールドで管理：

| plan | 機能 | 想定月額 |
|------|------|---------|
| `starter` | 1拠点・3製品・AI5回/月 | 無料 |
| `standard` | 無制限拠点・製品・AI無制限 | ¥9,800 |
| `pro` | standard + API連携・優先サポート | ¥29,800 |

---

## ローカルでのSupabase開発（上級者向け）

```bash
# Supabase CLI インストール
npm install -g supabase

# ローカルSupabase起動
supabase start

# マイグレーション適用
supabase db push

# TypeScript型生成
npm run db:types
```
