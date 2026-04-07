// api/claude.js — Vercel Serverless Function

// 大きいファイル（PDF・画像）を受け取るためのサイズ制限設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    const body = req.body || {};

    // max_tokensの上限（課金暴走防止）
    if (body.max_tokens) {
      body.max_tokens = Math.min(Number(body.max_tokens), 4000);
    }

    // モデルが未指定の場合はデフォルトを設定
    if (!body.model) {
      body.model = "claude-sonnet-4-6";
    }

    // PDF・画像が含まれているか判定
    const bodyStr = JSON.stringify(body);
    const hasPDF = bodyStr.includes('"application/pdf"');

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    // PDF対応のbetaヘッダーを追加
    if (hasPDF) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    console.log("Calling Anthropic with model:", body.model, "hasPDF:", hasPDF);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
    }
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
