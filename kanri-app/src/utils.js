// src/utils.js
export const N = v => parseFloat(String(v ?? "0").replace(/,/g, "")) || 0;

export const fmt = (n, short = false) => {
  if (n == null) return "–";
  const a = Math.abs(Math.round(n));
  if (short && a >= 1e6) return (n < 0 ? "△" : "") + (a / 1e6).toFixed(1) + "M";
  if (short && a >= 1e4) return (n < 0 ? "△" : "") + Math.round(a / 1e4) + "万";
  return (n < 0 ? "△¥" : "¥") + a.toLocaleString("ja-JP");
};

export const pct = n => (Math.round(n * 10) / 10).toFixed(1) + "%";
export const uid = () => Math.random().toString(36).slice(2, 8);
export const today = () => new Date().toISOString().slice(0, 10);
export const sg = n => (n >= 0 ? "+" : "");

export function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const hs = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(l => {
    const vs = l.split(",").map(v => v.trim());
    const o = {};
    hs.forEach((h, i) => (o[h] = vs[i] ?? ""));
    return o;
  });
}

export function computePeriod(salesCSV, costs = [], budgetCSV = "") {
  const sales = parseCSV(salesCSV);
  const budget = parseCSV(budgetCSV);
  if (!sales.length || !costs.length) return null;

  const fixed = costs.filter(c => c._type === "固定費");
  const variable = costs.filter(c => c._type === "変動費");
  const semi = costs.filter(c => c._type === "準変動費");

  const totalFixed =
    fixed.reduce((a, r) => a + N(r.金額), 0) +
    semi.reduce((a, r) => a + N(r.金額) * (N(r.固定率 ?? 60) / 100), 0);
  const extraVar =
    variable.reduce((a, r) => a + N(r.金額), 0) +
    semi.reduce((a, r) => a + N(r.金額) * (1 - N(r.固定率 ?? 60) / 100), 0);

  const totalRevAll = sales.reduce((a, r) => a + N(r.売上高), 0);

  const products = sales.map(r => {
    const rev = N(r.売上高);
    const vc = N(r.変動費) + N(r.直接労務費) + (totalRevAll > 0 ? extraVar * (rev / totalRevAll) : 0);
    const cm = rev - vc;
    const cmRate = rev > 0 ? (cm / rev) * 100 : 0;
    const br = budget.find(b => b.製品CD === r.製品CD) || {};
    const bRev = N(br.予算売上高);
    const bVR = N(br.予算変動費率) / 100;
    const bCM = bRev * (1 - bVR);
    return {
      code: r.製品CD, name: r.製品名, rev, varCost: vc, cm, cmRate,
      budRev: bRev, budCMRate: bRev > 0 ? (bCM / bRev) * 100 : 0,
      revDiff: rev - bRev,
      status: cmRate >= 40 ? "優良" : cmRate >= 25 ? "要注意" : "要改善",
    };
  });

  const totalRev = products.reduce((a, p) => a + p.rev, 0);
  const totalVC = products.reduce((a, p) => a + p.varCost, 0);
  const totalCM = products.reduce((a, p) => a + p.cm, 0);
  const opProfit = totalCM - totalFixed;
  const cmRate = totalRev > 0 ? (totalCM / totalRev) * 100 : 0;
  const bep = cmRate > 0 ? totalFixed / (cmRate / 100) : 0;
  const bepRatio = totalRev > 0 ? (bep / totalRev) * 100 : 0;

  products.forEach(p => {
    p.fixedAlloc = totalRev > 0 ? totalFixed * (p.rev / totalRev) : 0;
    p.contrib = p.cm - p.fixedAlloc;
  });

  const fixedItems = [
    ...fixed,
    ...semi.map(s => ({
      ...s,
      費目: s.費目 + "（固定部分）",
      金額: N(s.金額) * (N(s.固定率 ?? 60) / 100),
    })),
  ];

  return { products, totalRev, totalVC, totalCM, totalFixed, opProfit, cmRate, bep, bepRatio, fixedItems, costs };
}

// Claude API call (through Vercel proxy)
export async function callClaude({ system, messages, max_tokens = 1000 }) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens, system, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data.content?.map(c => c.text || "").join("") || "";
}
