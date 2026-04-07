// src/pages/DataImport.jsx
import { useState, useRef, useCallback } from "react";
import { C } from "../tokens.js";
import { N, fmt, uid, today, callClaude } from "../utils.js";
import { DEF_SALES_CSV, DEF_BUDGET_CSV, DEF_COSTS } from "../data/defaults.js";
import { Card, ST, Btn, Badge } from "../components/Atoms.jsx";

// ─── CSV Upload Zone ──────────────────────────────────────────────────────────
function CSVZone({ label, hint, value, onChange, sampleValue }) {
  const ref = useRef();
  const onFile = f => {
    const r = new FileReader();
    r.onload = e => {
      let text = e.target.result;
      // Shift-JISで文字化けしているか判定（弥生・freeeなど）
      if (text.includes("\uFFFD") || /[\x80-\xFF]/.test(text)) {
        const r2 = new FileReader();
        r2.onload = e2 => onChange(e2.target.result);
        r2.readAsText(f, "Shift_JIS");
        return;
      }
      onChange(text);
    };
    r.readAsText(f, "UTF-8");
  };
  return (
    <Card>
      <ST>{label}</ST>
      <div style={{ fontSize:11, color:C.txD, fontFamily:"monospace", marginBottom:8, lineHeight:1.5 }}>{hint}</div>
      <label style={{ display:"block", border:`1px dashed ${C.bM}`, borderRadius:8, padding:"1.2rem", textAlign:"center", cursor:"pointer", background:C.bgL, marginBottom:10 }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
        <input ref={ref} type="file" accept=".csv,.txt" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}/>
        <div style={{ fontSize:22, marginBottom:6 }}>{value ? "✓" : "📂"}</div>
        <div style={{ fontSize:12, color: value ? C.teal : C.txM }}>
          {value ? "CSVを取込済み（クリックで再選択）" : "CSVをドロップ or クリックして選択"}
        </div>
      </label>
      <div style={{ fontSize:10, color:C.txD, marginBottom:5 }}>または直接貼り付け・編集：</div>
      <textarea value={value || ""} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", height:120, background:C.bgLL, border:`1px solid ${C.b}`, borderRadius:7, padding:"8px 10px", fontSize:11, color:C.txM, outline:"none", fontFamily:"monospace", lineHeight:1.6 }}/>
      <div style={{ marginTop:8 }}>
        <Btn sm onClick={() => onChange(sampleValue)}>サンプルデータを読み込む</Btn>
      </div>
    </Card>
  );
}

// ─── Bulk CSV import (zip / multiple files) ───────────────────────────────────
function BulkImport({ onImport }) {
  const ref = useRef();
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const processFiles = async (files) => {
    setLoading(true);
    const read = f => new Promise(res => { const r = new FileReader(); r.onload = e => res({ name: f.name, text: e.target.result }); r.readAsText(f, "UTF-8"); });
    const texts = await Promise.all([...files].filter(f => f.name.endsWith(".csv") || f.name.endsWith(".txt")).map(read));
    const mapped = texts.map(({ name, text }) => {
      const lower = name.toLowerCase();
      const type = lower.includes("売上") || lower.includes("sales") ? "sales"
                 : lower.includes("予算") || lower.includes("budget") ? "budget"
                 : lower.includes("費用") || lower.includes("cost") || lower.includes("固定") ? "costs"
                 : "unknown";
      return { name, text, type };
    });
    setResult(mapped);
    setLoading(false);
  };

  return (
    <Card>
      <ST>一括CSVインポート（複数ファイル同時）</ST>
      <div style={{ fontSize:12, color:C.txD, marginBottom:12, lineHeight:1.7 }}>
        売上・予算・費用のCSVファイルを一度にドロップするとファイル名から自動判定します。<br/>
        <span style={{ fontFamily:"monospace", color:C.amber }}>売上.csv / budget.csv / 費用.csv</span> など
      </div>
      <label style={{ display:"block", border:`2px dashed ${C.bM}`, borderRadius:10, padding:"1.5rem", textAlign:"center", cursor:"pointer", background:C.bgL }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); processFiles(e.dataTransfer.files); }}>
        <input ref={ref} type="file" multiple accept=".csv,.txt" style={{ display:"none" }} onChange={e => processFiles(e.target.files)}/>
        <div style={{ fontSize:28, marginBottom:8 }}>{loading ? "⚡" : "📦"}</div>
        <div style={{ fontSize:13, color:C.txM }}>{loading ? "処理中..." : "複数のCSVファイルをここにドロップ"}</div>
      </label>
      {result.length > 0 && (
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:12, color:C.txD, marginBottom:8 }}>判定結果（クリックで種別を変更して取込）</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {result.map((r, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:C.bgL, borderRadius:8, border:`1px solid ${C.b}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500 }}>{r.name}</div>
                  <div style={{ fontSize:11, color:C.txD }}>{r.text.trim().split("\n")[0].slice(0, 50)}...</div>
                </div>
                <select value={r.type} onChange={e => setResult(p => p.map((x,j) => j===i ? {...x,type:e.target.value} : x))}
                  style={{ background:C.bgLL, border:`1px solid ${C.bM}`, borderRadius:6, padding:"4px 8px", fontSize:12, color:C.tx, outline:"none" }}>
                  <option value="sales">売上データ</option>
                  <option value="budget">予算データ</option>
                  <option value="costs">費用データ</option>
                  <option value="unknown">不明（スキップ）</option>
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10 }}>
            <Btn primary onClick={() => {
              const mapped = {};
              result.filter(r => r.type !== "unknown").forEach(r => { mapped[r.type] = r.text; });
              onImport(mapped);
              setResult([]);
            }}>✓ 取込を確定する</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Receipt OCR ─────────────────────────────────────────────────────────────
function ReceiptUploader({ onExtracted }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");
  const ref = useRef();

  const toB64 = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(f); });

  const processFiles = useCallback(async (flist) => {
    setLoading(true);
    const results = [];
    for (const f of flist) {
      setLog(`処理中: ${f.name}...`);
      try {
        const b64 = await toB64(f);
        const isPDF = f.type === "application/pdf";
        const content = isPDF
          ? [{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
             { type:"text", text:`この領収書・請求書から情報を抽出してください。JSON形式のみで返答：{"日付":"YYYY-MM-DD","取引先":"店舗名","金額":数値,"内容":"品目","費目候補":"勘定科目","消費税":数値}` }]
          : [{ type:"image", source:{ type:"base64", media_type:f.type||"image/jpeg", data:b64 } },
             { type:"text", text:`この領収書・レシートから情報を抽出してください。JSON形式のみで返答：{"日付":"YYYY-MM-DD","取引先":"店舗名","金額":数値,"内容":"品目","費目候補":"勘定科目","消費税":数値}` }];
        const res = await fetch("/api/claude", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:400, messages:[{ role:"user", content }] }),
        });
        const data = await res.json();
        const txt = data.content?.map(c => c.text||"").join("").replace(/```json|```/g,"").trim();
        const parsed = JSON.parse(txt);
        results.push({ id:uid(), file:f.name, status:"完了", date:parsed.日付||today(), vendor:parsed.取引先||"不明", amount:parsed.金額||0, content:parsed.内容||"", category:parsed.費目候補||"その他", tax:parsed.消費税||0 });
      } catch (e) {
        console.error("OCR error:", f.name, e);
        results.push({ id:uid(), file:f.name, status:"エラー", date:today(), vendor:"不明", amount:0, content:String(e?.message||"解析エラー"), category:"その他", tax:0 });
      }
    }
    setFiles(p => [...p, ...results]);
    onExtracted(results.filter(r => r.status === "完了"));
    setLog(`${results.length}件の処理が完了しました。`);
    setLoading(false);
  }, [onExtracted]);

  return (
    <Card>
      <ST right={files.length > 0 && <Btn sm onClick={() => setFiles([])}>クリア</Btn>}>
        領収書・請求書 OCR取込
      </ST>
      <div style={{ fontSize:12, color:C.txD, marginBottom:12 }}>
        JPG / PNG / PDF をドロップするとAIが日付・金額・費目を自動読み取りし、仕訳帳に追加します。
      </div>
      <div onClick={() => ref.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const fs = [...e.dataTransfer.files].filter(f => f.type.startsWith("image/")||f.type==="application/pdf"); if (fs.length) processFiles(fs); }}
        style={{ border:`2px dashed ${loading?C.teal:C.bM}`, borderRadius:12, padding:"2rem", textAlign:"center", cursor:"pointer", background:loading?C.tD:C.bgL, transition:"all .2s" }}>
        <input ref={ref} type="file" multiple accept="image/*,application/pdf" style={{ display:"none" }} onChange={e => processFiles([...e.target.files])}/>
        <div style={{ fontSize:28, marginBottom:8 }}>{loading ? "⚡" : "📄"}</div>
        <div style={{ fontSize:13, color:loading?C.teal:C.txM }}>{loading ? "OCR処理中..." : "領収書・請求書をドロップ（複数可）"}</div>
        {log && <div style={{ fontSize:12, color:C.teal, marginTop:8 }}>{log}</div>}
      </div>
      {files.length > 0 && (
        <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:7 }}>
          {files.map(f => (
            <div key={f.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:C.bgL, borderRadius:8, border:`1px solid ${C.b}` }}>
              <div style={{ fontSize:18 }}>{f.status==="完了"?"🧾":"❌"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500 }}>{f.vendor}</div>
                <div style={{ fontSize:11, color:C.txD }}>{f.date} · {f.content || f.file}</div>
              </div>
              <div className="mono" style={{ fontSize:13, color:f.status==="完了"?C.teal:C.red, flexShrink:0 }}>
                {f.status==="完了" ? fmt(f.amount) : "エラー"}
              </div>
              <Badge color={f.status==="完了"?C.blue:C.red}>{f.category}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Main DataImport page ─────────────────────────────────────────────────────
export default function DataImport({ periodData, onUpdate, onCompute, onJournalAdd, onCostsUpdate }) {
  const [activeSection, setActiveSection] = useState("csv");

  const handleBulkImport = (mapped) => {
    if (mapped.sales) onUpdate("salesCSV", mapped.sales);
    if (mapped.budget) onUpdate("budgetCSV", mapped.budget);
    if (mapped.costs) {
      // 費用CSVをパースして費目リストに変換
      const rows = mapped.costs.trim().split("\n").slice(1).filter(Boolean).map(l => {
        const [費目, 金額] = l.split(",").map(s => s.trim());
        return { 費目: 費目 || "", 金額: 金額 || "0", _type: "固定費", 固定率: 100 };
      }).filter(r => r.費目);
      if (rows.length) onUpdate("costs", rows);
    }
    alert(`取込完了。${Object.keys(mapped).join("・")}を更新しました。「計算実行」ボタンで採算を更新してください。`);
  };

  const handleReceiptExtracted = (results) => {
    // 仕訳帳に追加
    const newEntries = results.map(r => ({
      id: uid(), date: r.date,
      debit: r.category || "その他費用", credit:"現金",
      amount: r.amount, description:`${r.vendor} ${r.content}`, ref: r.file,
    }));
    onJournalAdd(newEntries);

    // 費目リスト（costs）にも追加してPL・採算に反映
    if (onCostsUpdate && results.length > 0) {
      const currentCosts = periodData?.costs || [];
      const newCostItems = results
        .filter(r => r.amount > 0)
        .map(r => ({
          費目: `${r.category || "その他"}（${r.vendor}）`,
          金額: String(r.amount),
          _type: "固定費",
          固定率: 100,
          _fromOCR: true,
          _date: r.date,
        }));
      onCostsUpdate([...currentCosts, ...newCostItems]);
    }
  };

  return (
    <div className="fade">
      {/* Section tabs */}
      <div className="no-print" style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["csv","📊 CSV取込"],["bulk","📦 一括取込"],["receipt","📄 領収書OCR"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{
            padding:"7px 16px", borderRadius:8, fontSize:13, cursor:"pointer",
            border:`1px solid ${activeSection===id ? C.tB : C.bM}`,
            background: activeSection===id ? C.tD : "transparent",
            color: activeSection===id ? C.teal : C.txM,
          }}>{label}</button>
        ))}
      </div>

      {/* CSV section */}
      {activeSection==="csv" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }} className="g2">
            <CSVZone
              label="売上・変動費 CSV"
              hint={"必須列: 製品CD, 製品名, 売上高, 変動費, 直接労務費"}
              value={periodData?.salesCSV || ""}
              onChange={v => onUpdate("salesCSV", v)}
              sampleValue={DEF_SALES_CSV}
            />
            <CSVZone
              label="予算 CSV"
              hint={"必須列: 製品CD, 予算売上高, 予算変動費率"}
              value={periodData?.budgetCSV || ""}
              onChange={v => onUpdate("budgetCSV", v)}
              sampleValue={DEF_BUDGET_CSV}
            />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={() => { onUpdate("salesCSV", DEF_SALES_CSV); onUpdate("budgetCSV", DEF_BUDGET_CSV); }}>
              サンプルデータ全読込
            </Btn>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:C.txD }}>
            ※ 費用・領収書を取り込んだら、上部の「採算計算を実行する」ボタンを押してください
          </div>
        </div>
      )}

      {activeSection==="bulk" && <BulkImport onImport={handleBulkImport}/>}
      {activeSection==="receipt" && <ReceiptUploader onExtracted={handleReceiptExtracted}/>}
    </div>
  );
}
