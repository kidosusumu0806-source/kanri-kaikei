// api/claude.js — Vercel Serverless Function
// Claude API をサーバー側で呼ぶことでAPIキーをフロントに露出しない

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  // ─── バリデーション ───────────────────────────────────────────
  const { model, max_tokens, messages, system } = req.body || {};

  // 許可するモデルのみ
  const ALLOWED_MODELS = ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001"];
  if (!ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }

  // max_tokensの上限（無制限の課金を防ぐ）
  const safeMaxTokens = Math.min(Number(max_tokens) || 1000, 4000);

  // messagesは必須
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }

  // ─── Claude API呼び出し ───────────────────────────────────────
  try {
    const payload = { model, max_tokens: safeMaxTokens, messages };
    if (system) payload.system = system;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
