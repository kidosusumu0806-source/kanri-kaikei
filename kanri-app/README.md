# 管理会計ダッシュボード

中小企業向け管理会計・財務諸表・AI分析システム

## 機能一覧

| 機能 | 説明 |
|------|------|
| 📁 データ取込 | CSV個別・一括取込（ドラッグ&ドロップ）、領収書/請求書OCR |
| ⚙️ 費目分類設定 | 固定費/変動費/準変動費をAI自動判定＋手動編集 |
| 📒 仕訳帳 | 複式簿記入力、領収書OCRからの自動登録 |
| 🏭 製品別採算 | 直接原価計算、限界利益・貢献利益・BEP分析 |
| 🎯 予算対比 | 製品別の売上・限界利益率の予実差異 |
| 📈 トレンド | 限界利益率・営業利益・売上・BEP比率の推移グラフ |
| 📋 PL（損益計算書） | 7段階構造、クリック編集、売上高比表示 |
| 🏦 BS（貸借対照表） | 流動/固定、自己資本比率・流動比率自動計算 |
| 💰 CF計算書 | 間接法3区分、フリーCF計算、健全性チェック |
| 📅 月次比較 | 月次損益推移表、AI経営コメント自動生成 |
| 🧾 税務サマリー | 別表四（法人税）・消費税計算、AI税務アドバイス |
| ⚡ AI財務アドバイザー | 全データを文脈として管理会計専門家AIが分析 |
| 📊 Excel出力 | 製品別採算・サマリーをxlsx形式で出力 |
| 🏢 多拠点対応 | 拠点・事業部ごとのデータ管理 |
| 📱 レスポンシブ | スマートフォン・タブレット対応 |

---

## Vercel デプロイ手順

### 1. リポジトリ準備

```bash
# このフォルダをGitリポジトリとしてGitHubにプッシュ
cd kanri-kaikei
git init
git add .
git commit -m "initial commit"
# GitHubで新規リポジトリを作成してプッシュ
git remote add origin https://github.com/YOUR_NAME/kanri-kaikei.git
git push -u origin main
```

### 2. Vercel接続

1. [vercel.com](https://vercel.com) にアクセス → New Project
2. GitHubリポジトリをインポート
3. Framework: **Vite** を選択（自動検出されるはず）
4. **Environment Variables** に以下を追加：

```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxxxxxx
```

5. **Deploy** ボタンをクリック

### 3. カスタムドメイン（任意）

Vercel管理画面 → Settings → Domains でカスタムドメインを設定できます。

---

## ローカル開発

```bash
npm install
cp .env.example .env.local
# .env.local に ANTHROPIC_API_KEY を記入

npm run dev
# http://localhost:3000 でアクセス
```

---

## CSVフォーマット

### 売上・変動費 CSV
```csv
製品CD,製品名,売上高,変動費,直接労務費
A001,製品A,18500000,8300000,1900000
```

### 予算 CSV
```csv
製品CD,予算売上高,予算変動費率
A001,18000000,54
```

### 費用 CSV（費目設定で固定/変動を分類）
```csv
費目,金額
人件費（管理）,7200000
減価償却費,2100000
```

---

## 本番移行（Supabase連携）

現在のデモ版はブラウザのlocalStorageにデータを保存します。  
本番環境でのマルチユーザー対応にはSupabaseを推奨：

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. `src/hooks/useStorage.js` の `localStorage` をSupabaseクライアントに置き換え
3. 環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を追加

---

## 技術スタック

- **Frontend**: React 18 + Vite
- **Charts**: Recharts
- **Excel**: SheetJS (xlsx)
- **AI**: Anthropic Claude API（Vercel Serverless Function経由）
- **Deployment**: Vercel
