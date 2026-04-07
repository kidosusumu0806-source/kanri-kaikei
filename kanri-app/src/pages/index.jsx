// src/pages/index.jsx  — all page components (Dashboard, ProductPL, Budget, Trend, CostClassifier, Journal, PL, BS, CF, Monthly, Tax, AI)
import { useState, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { C, M } from "../tokens.js";
import { N, fmt, pct, sg, uid, today, parseCSV, callClaude } from "../utils.js";
import { DEF_BS, DEF_CF, DEF_TAX, DEF_MONTHLY, ACCOUNTS } from "../data/defaults.js";
import { Card, ST, Btn, KPI, Badge, MBar, Alert, Waterfall, TipBox, EditNum, Input } from "../components/Atoms.jsx";
import AIChat from "../components/AIChat.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function Dashboard({ computed, prevComputed }) {
  const downloadPDF = () => window.print();

  if (!computed) return (
    <div className="fade" style={{ textAlign:"center", padding:"5rem 2rem", color:C.txD }}>
      <div style={{ fontSize:56, marginBottom:16, opacity:0.4 }}>📊</div>
      <div style={{ fontSize:18, fontWeight:500, color:C.txM, marginBottom:8 }}>データがまだありません</div>
      <div style={{ fontSize:13 }}>「データ取込」からCSVを貼り付けて「採算計算を実行する」を押してください</div>
    </div>
  );

  const { totalRev, totalVC, totalCM, totalFixed, opProfit, cmRate, bepRatio, products, fixedItems } = computed;
  const colors = [C.blue, C.teal, C.amber, C.red, C.purple];
  const bep = totalFixed / (cmRate / 100);

  // SVGウォーターフォール
  const wfItems = [
    { label:"売上高", v:totalRev, color:C.blue, type:"base" },
    { label:"変動費", v:totalVC, color:C.red, type:"neg" },
    { label:"限界利益", v:totalCM, color:C.teal, type:"base" },
    { label:"固定費", v:totalFixed, color:C.amber, type:"neg" },
    { label:"営業利益", v:Math.abs(opProfit), color:opProfit>=0?C.teal:C.red, type:"result" },
  ];
  const maxV = Math.max(...wfItems.map(i=>i.v));
  const barH = 120;

  // ドーナツチャート（BEP比率）
  const r = 40, circ = 2*Math.PI*r;
  const bepDash = (bepRatio/100)*circ;

  return (
    <div className="fade">
      {/* PDF download button */}
      <div className="no-print" style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
        <button onClick={downloadPDF} style={{ background:"transparent", border:`1px solid ${C.bM}`, color:C.txM, borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          🖨 PDFダウンロード
        </button>
      </div>

      {/* KPI Cards - enhanced */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
        {/* 売上高 */}
        <div style={{ background:`linear-gradient(135deg, ${C.bgL}, ${C.bgM})`, border:`1px solid ${C.bM}`, borderRadius:12, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:C.blue+"15" }}/>
          <div style={{ fontSize:10, color:C.txD, letterSpacing:"0.07em", marginBottom:6 }}>売上高</div>
          <div className="mono" style={{ fontSize:20, fontWeight:500, color:C.tx }}>{fmt(totalRev,true)}</div>
          {prevComputed && <div style={{ fontSize:10, color:totalRev>=prevComputed.totalRev?C.teal:C.red, marginTop:4 }}>
            {totalRev>=prevComputed.totalRev?"↑":"↓"} {fmt(Math.abs(totalRev-prevComputed.totalRev),true)}
          </div>}
        </div>

        {/* 限界利益率 */}
        <div style={{ background:`linear-gradient(135deg, ${C.bgL}, ${C.bgM})`, border:`1px solid ${cmRate>=35?C.tB:C.aB}`, borderRadius:12, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:(cmRate>=35?C.teal:C.amber)+"15" }}/>
          <div style={{ fontSize:10, color:C.txD, letterSpacing:"0.07em", marginBottom:6 }}>限界利益率</div>
          <div className="mono" style={{ fontSize:20, fontWeight:500, color:cmRate>=35?C.teal:C.amber }}>{pct(cmRate)}</div>
          <div style={{ marginTop:6, background:C.bgLL, borderRadius:3, height:3, overflow:"hidden" }}>
            <div style={{ width:`${Math.min(cmRate,100)}%`, height:"100%", background:cmRate>=35?C.teal:C.amber, borderRadius:3, transition:"width .6s" }}/>
          </div>
          <div style={{ fontSize:10, color:C.txD, marginTop:3 }}>{fmt(totalCM,true)}</div>
        </div>

        {/* 営業利益 */}
        <div style={{ background:`linear-gradient(135deg, ${C.bgL}, ${C.bgM})`, border:`1px solid ${opProfit>=0?C.tB:C.rB}`, borderRadius:12, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:(opProfit>=0?C.teal:C.red)+"15" }}/>
          <div style={{ fontSize:10, color:C.txD, letterSpacing:"0.07em", marginBottom:6 }}>営業利益</div>
          <div className="mono" style={{ fontSize:20, fontWeight:500, color:opProfit>=0?C.teal:C.red }}>{fmt(opProfit,true)}</div>
          <div style={{ marginTop:6, fontSize:11, color:opProfit>=0?C.teal:C.red, fontWeight:500 }}>
            {opProfit>=0?"● 黒字":"● 赤字"}
          </div>
        </div>

        {/* BEP - ドーナツ */}
        <div style={{ background:`linear-gradient(135deg, ${C.bgL}, ${C.bgM})`, border:`1px solid ${bepRatio<80?C.tB:C.aB}`, borderRadius:12, padding:"16px 14px", display:"flex", gap:10, alignItems:"center" }}>
          <svg width={52} height={52} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke={C.bgLL} strokeWidth="14"/>
            <circle cx="50" cy="50" r={r} fill="none" stroke={bepRatio<80?C.teal:C.amber} strokeWidth="14"
              strokeDasharray={`${bepDash} ${circ-bepDash}`} strokeDashoffset={circ/4} strokeLinecap="round" style={{transition:"stroke-dasharray .8s"}}/>
            <text x="50" y="55" textAnchor="middle" fill={bepRatio<80?C.teal:C.amber} fontSize="18" fontFamily="monospace" fontWeight="500">{Math.round(bepRatio)}</text>
          </svg>
          <div>
            <div style={{ fontSize:10, color:C.txD, letterSpacing:"0.07em", marginBottom:3 }}>BEP比率</div>
            <div className="mono" style={{ fontSize:13, color:bepRatio<80?C.teal:C.amber }}>{pct(bepRatio)}</div>
            <div style={{ fontSize:10, color:C.txD, marginTop:2 }}>安全余裕率 {pct(100-bepRatio)}</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:10, marginBottom:10 }}>
        {/* Waterfall - SVG */}
        <Card>
          <ST>利益ウォーターフォール</ST>
          <svg width="100%" viewBox="0 0 420 160" preserveAspectRatio="xMidYMid meet" style={{ marginTop:4 }}>
            {wfItems.map((item, i) => {
              const bw = 60, gap = 24, x = i*(bw+gap)+10;
              const h = Math.max(4, (item.v/maxV)*barH);
              const y = barH - h + 20;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={bw} height={h} rx="4" fill={item.color} fillOpacity="0.85"/>
                  <text x={x+bw/2} y={y-5} textAnchor="middle" fill={item.color} fontSize="10" fontFamily="monospace">
                    {item.type==="neg"?"△":""}{fmt(item.v,true)}
                  </text>
                  <text x={x+bw/2} y={152} textAnchor="middle" fill="rgba(232,240,255,0.4)" fontSize="10">{item.label}</text>
                </g>
              );
            })}
            <line x1="0" y1="140" x2="420" y2="140" stroke="rgba(148,196,255,0.08)" strokeWidth="1"/>
          </svg>
        </Card>

        {/* Fixed costs breakdown */}
        <Card>
          <ST>固定費内訳</ST>
          <div style={{ marginTop:4 }}>
            {fixedItems.slice(0,6).map((f,i) => {
              const v = N(f.金額), p = totalFixed>0?(v/totalFixed)*100:0;
              return (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:11, color:C.txM }}>{f.費目}</span>
                    <span className="mono" style={{ fontSize:11, color:colors[i%colors.length] }}>{fmt(v,true)}</span>
                  </div>
                  <div style={{ background:C.bgLL, borderRadius:3, height:4, overflow:"hidden" }}>
                    <div style={{ width:`${Math.min(p,100)}%`, height:"100%", background:colors[i%colors.length], borderRadius:3, transition:"width .6s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Product summary mini table */}
      {products.length > 0 && (
        <Card style={{ marginBottom:10 }}>
          <ST>品目別サマリー</ST>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:400 }}>
              <thead><tr>
                {["品目名","売上高","限界利益率","貢献利益","判定"].map(h=>(
                  <th key={h} style={{ padding:"7px 10px", textAlign:h==="品目名"?"left":"right", fontSize:10, color:C.txD, borderBottom:`1px solid ${C.b}`, fontWeight:500 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {products.map((p,i)=>(
                  <tr key={i} style={{ borderBottom:`1px solid ${C.b}` }}>
                    <td style={{ padding:"7px 10px", fontWeight:500 }}>{p.name}</td>
                    <td className="mono" style={{ padding:"7px 10px", textAlign:"right", color:C.txM }}>{fmt(p.rev,true)}</td>
                    <td style={{ padding:"7px 10px", textAlign:"right" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                        <div style={{ width:50, background:C.bgLL, borderRadius:2, height:4, overflow:"hidden" }}>
                          <div style={{ width:`${Math.min(p.cmRate,100)}%`, height:"100%", background:p.cmRate>=40?C.teal:p.cmRate>=25?C.amber:C.red }}/>
                        </div>
                        <span className="mono" style={{ color:p.cmRate>=40?C.teal:p.cmRate>=25?C.amber:C.red }}>{pct(p.cmRate)}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ padding:"7px 10px", textAlign:"right", color:p.contrib>=0?C.teal:C.red }}>{fmt(p.contrib,true)}</td>
                    <td style={{ padding:"7px 10px", textAlign:"right" }}>
                      <span style={{ background:p.status==="優良"?C.tD:p.status==="要注意"?C.aD:C.rD, color:p.status==="優良"?C.teal:p.status==="要注意"?C.amber:C.red, fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:500 }}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Alerts */}
      {products.filter(p => p.status!=="優良").length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {products.filter(p => p.status!=="優良").map((p,i) => (
            <Alert key={i} color={p.status==="要注意"?C.amber:C.red}
              text={`${p.name}：限界利益率 ${pct(p.cmRate)}（${p.status}）— 貢献利益 ${fmt(p.contrib)}`}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT PL
// ═══════════════════════════════════════════════════════════════════════════
export function ProductPL({ computed }) {
  if (!computed) return <div style={{ padding:"3rem", textAlign:"center", color:C.txD }}>データがありません</div>;
  const { products, totalRev, totalVC, totalCM, totalFixed, opProfit, cmRate } = computed;
  return (
    <div className="fade">
      <Card style={{ overflowX:"auto" }}>
        <ST>品目別採算表（直接原価計算）</ST>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:680 }}>
          <thead>
            <tr>{["品目","売上高","変動費","限界利益","限益率","配賦固定費","貢献利益","判定"].map(h => (
              <th key={h} style={{ padding:"8px 10px", textAlign:h==="品目"?"left":"right", fontSize:10, color:C.txD, fontWeight:500, borderBottom:`1px solid ${C.b}`, whiteSpace:"nowrap" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {products.map((p,i) => {
              const sc = p.status==="優良"?C.teal:p.status==="要注意"?C.amber:C.red;
              return (
                <tr key={i} className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
                  <td style={{ padding:"11px 10px", fontWeight:500 }}>{p.name}</td>
                  <td className="mono" style={{ padding:"11px 10px", textAlign:"right" }}>{fmt(p.rev)}</td>
                  <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:C.txM }}>{fmt(p.varCost)}</td>
                  <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:C.teal }}>{fmt(p.cm)}</td>
                  <td style={{ padding:"11px 10px", textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:7 }}>
                      <MBar p={p.cmRate} color={p.cmRate>=40?C.teal:p.cmRate>=25?C.amber:C.red}/>
                      <span className="mono" style={{ fontSize:12, minWidth:44, textAlign:"right" }}>{pct(p.cmRate)}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:C.txM }}>{fmt(p.fixedAlloc)}</td>
                  <td className="mono" style={{ padding:"11px 10px", textAlign:"right", fontWeight:500, color:p.contrib>=0?C.teal:C.red }}>{sg(p.contrib)}{fmt(p.contrib)}</td>
                  <td style={{ padding:"11px 10px", textAlign:"right" }}><Badge color={sc}>{p.status}</Badge></td>
                </tr>
              );
            })}
            <tr>
              <td style={{ padding:"9px 10px", color:C.txD, fontSize:11 }}>合計</td>
              <td className="mono" style={{ padding:"9px 10px", textAlign:"right", borderTop:`1px solid ${C.bM}` }}>{fmt(totalRev)}</td>
              <td className="mono" style={{ padding:"9px 10px", textAlign:"right", borderTop:`1px solid ${C.bM}`, color:C.txM }}>{fmt(totalVC)}</td>
              <td className="mono" style={{ padding:"9px 10px", textAlign:"right", borderTop:`1px solid ${C.bM}`, color:C.teal }}>{fmt(totalCM)}</td>
              <td className="mono" style={{ padding:"9px 10px", textAlign:"right", borderTop:`1px solid ${C.bM}` }}>{pct(cmRate)}</td>
              <td className="mono" style={{ padding:"9px 10px", textAlign:"right", borderTop:`1px solid ${C.bM}`, color:C.txM }}>{fmt(totalFixed)}</td>
              <td className="mono" style={{ padding:"9px 10px", textAlign:"right", borderTop:`1px solid ${C.bM}`, fontWeight:500, color:opProfit>=0?C.teal:C.red }}>{sg(opProfit)}{fmt(opProfit)}</td>
              <td style={{ borderTop:`1px solid ${C.bM}` }}/>
            </tr>
          </tbody>
        </table>
      </Card>
      <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:7 }}>
        {products.filter(p => p.status!=="優良").map((p,i) => (
          <Alert key={i} color={p.status==="要注意"?C.amber:C.red}
            text={`${p.name}：限界利益率 ${pct(p.cmRate)} — ${p.cmRate<20?"変動費削減または価格改定が急務":"限益率改善余地あり"}。貢献利益 ${fmt(p.contrib)}`}/>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUDGET COMPARISON
// ═══════════════════════════════════════════════════════════════════════════
export function BudgetComparison({ computed }) {
  if (!computed) return <div style={{ padding:"3rem", textAlign:"center", color:C.txD }}>データがありません</div>;
  const { products } = computed;
  return (
    <div className="fade">
      <Card style={{ marginBottom:12 }}>
        <ST>予算対比（品目別）</ST>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:580 }}>
            <thead>
              <tr>{["品目","予算売上","実績売上","売上差異","予算限益率","実績限益率","限益率差異"].map(h => (
                <th key={h} style={{ padding:"8px 10px", textAlign:h==="品目"?"left":"right", fontSize:10, color:C.txD, fontWeight:500, borderBottom:`1px solid ${C.b}`, whiteSpace:"nowrap" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {products.map((p,i) => {
                const cmD = p.cmRate - p.budCMRate;
                return (
                  <tr key={i} className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
                    <td style={{ padding:"11px 10px", fontWeight:500 }}>{p.name}</td>
                    <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:C.txM }}>{fmt(p.budRev)}</td>
                    <td className="mono" style={{ padding:"11px 10px", textAlign:"right" }}>{fmt(p.rev)}</td>
                    <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:p.revDiff>=0?C.teal:C.red, fontWeight:500 }}>{sg(p.revDiff)}{fmt(p.revDiff)}</td>
                    <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:C.txM }}>{pct(p.budCMRate)}</td>
                    <td className="mono" style={{ padding:"11px 10px", textAlign:"right" }}>{pct(p.cmRate)}</td>
                    <td className="mono" style={{ padding:"11px 10px", textAlign:"right", color:cmD>=0?C.teal:C.red, fontWeight:500 }}>{sg(cmD)}{(Math.round(cmD*10)/10).toFixed(1)}pt</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <ST>売上高 予算 vs 実績</ST>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={products.map(p => ({ name:p.name, 予算:p.budRev, 実績:p.rev }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
            <XAxis dataKey="name" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v,true)}/>
            <Tooltip content={<TipBox/>}/>
            <Bar dataKey="予算" fill={C.txD+"55"} radius={[3,3,0,0]}/>
            <Bar dataKey="実績" fill={C.blue+"88"} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TREND
// ═══════════════════════════════════════════════════════════════════════════
export function Trend({ allComputed }) {
  const data = Object.entries(allComputed).map(([p,c]) => ({
    period: p.replace("2024年",""),
    限界利益率: c ? Math.round(c.cmRate*10)/10 : null,
    営業利益: c ? Math.round(c.opProfit) : null,
    売上高: c ? Math.round(c.totalRev) : null,
    BEP比率: c ? Math.round(c.bepRatio*10)/10 : null,
  }));
  return (
    <div className="fade">
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <Card>
          <ST>限界利益率 推移（%）</ST>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
              <XAxis dataKey="period" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} domain={["auto","auto"]} tickFormatter={v=>v+"%"}/>
              <Tooltip content={<TipBox/>}/>
              <ReferenceLine y={35} stroke={C.amber} strokeDasharray="4 3" label={{ value:"目標35%", fill:C.amber, fontSize:9 }}/>
              <Line type="monotone" dataKey="限界利益率" stroke={C.teal} strokeWidth={2} dot={{ fill:C.teal, r:4 }} connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <ST>営業利益 推移</ST>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
              <XAxis dataKey="period" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v,true)}/>
              <Tooltip content={<TipBox/>}/>
              <ReferenceLine y={0} stroke={C.bM}/>
              <Bar dataKey="営業利益" fill={C.teal+"88"} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <ST>売上高 推移</ST>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
              <XAxis dataKey="period" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v,true)}/>
              <Tooltip content={<TipBox/>}/>
              <Bar dataKey="売上高" fill={C.blue+"77"} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <ST>損益分岐点比率 推移</ST>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
              <XAxis dataKey="period" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} domain={[60,100]} tickFormatter={v=>v+"%"}/>
              <Tooltip content={<TipBox/>}/>
              <ReferenceLine y={80} stroke={C.red} strokeDasharray="4 3" label={{ value:"警戒80%", fill:C.red, fontSize:9 }}/>
              <Line type="monotone" dataKey="BEP比率" stroke={C.amber} strokeWidth={2} dot={{ fill:C.amber, r:4 }} connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COST CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════
const TYPE_META = {
  固定費:  { color:C.blue,  bg:C.blD, border:C.blB, icon:"🔒" },
  変動費:  { color:C.red,   bg:C.rD,  border:C.rB,  icon:"📈" },
  準変動費:{ color:C.amber, bg:C.aD,  border:C.aB,  icon:"〜" },
};

export function CostClassifier({ costs, onChange, journals, currentPeriod, periods, onPeriodChange }) {
  const [csvOpen, setCsvOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");

  // ローカルstateで即時反映（非同期のonChangeを待たない）
  const [localCosts, setLocalCosts] = useState(costs);
  // costsプロップが期間切替などで外から変わったときだけ同期
  const costsKey = costs.length + "_" + (costs[0]?.費目||"");
  const prevKeyRef = useState(costsKey);
  if (prevKeyRef[0] !== costsKey) {
    prevKeyRef[0] = costsKey;
    setTimeout(() => setLocalCosts(costs), 0);
  }

  const upd = (i, field, val) => {
    const next = localCosts.map((c, j) => j === i ? { ...c, [field]: val } : c);
    setLocalCosts(next);
    onChange(next);
  };
  const del = (i) => {
    const next = localCosts.filter((_, j) => j !== i);
    setLocalCosts(next);
    onChange(next);
  };

  // OCRフィルター（仕訳帳月別）
  const journalMonths = ["all", ...Array.from(new Set((journals||[]).map(e => e.date?.slice(0,7)).filter(Boolean))).sort().reverse()];
  const visibleWithIdx = localCosts
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => {
      if (!c._fromOCR) return true;
      if (monthFilter === "all") return true;
      return c._date?.startsWith(monthFilter);
    });
  const [rawCSV, setRawCSV] = useState(`費目,金額\n人件費（管理）,7200000\n減価償却費,2100000\n地代家賃,1800000\n水道光熱費,950000\n消耗品費,420000\n旅費交通費,280000\nその他,380000`);
  const [aiLoading, setAiLoading] = useState(false);
  const [log, setLog] = useState("");

  const guessType = name => {
    if (["消耗品","材料","外注","運送","販促","広告","仕入"].some(k => name.includes(k))) return { _type:"変動費", 固定率:0 };
    if (["光熱","通信","修繕","旅費","交通"].some(k => name.includes(k))) return { _type:"準変動費", 固定率:60 };
    return { _type:"固定費", 固定率:100 };
  };

  const importCSV = () => {
    const rows = parseCSV(rawCSV);
    const merged = rows.map(r => {
      const ex = costs.find(c => c.費目 === r.費目);
      const g = guessType(r.費目);
      return { 費目:r.費目, 金額:r.金額, _type:ex?._type||g._type, 固定率:ex?.固定率??g.固定率 };
    });
    onChange(merged);
    setLog(`${merged.length}件を取込みました。AI判定ボタンで分類を改善できます。`);
  };

  const runAI = async () => {
    setAiLoading(true);
    setLog("AIが費目を分析中...");
    try {
      const txt = await callClaude({
        system:`管理会計専門家として費目を分類してください。JSON配列のみ返答（説明不要）：[{"費目":"...","_type":"固定費"|"変動費"|"準変動費","固定率":0-100}]`,
        messages:[{ role:"user", content:`以下の費目を分類:\n${costs.map(c=>c.費目).join("\n")}` }],
      });
      const arr = JSON.parse(txt.replace(/```json|```/g,"").trim());
      const next = localCosts.map(c => { const m=arr.find(a=>a.費目===c.費目); return m?{...c,...m}:c; }); setLocalCosts(next); onChange(next);
      setLog(`AI判定完了。${arr.length}件を分類しました。`);
    } catch { setLog("AI判定失敗。手動で設定してください。"); }
    setAiLoading(false);
  };

  const totalByType = type => localCosts.filter(c=>c._type===type).reduce((a,c)=>a+N(c.金額),0);

  return (
    <div className="fade">
      {/* Summary */}
      <div className="g4" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        {Object.entries(TYPE_META).map(([type,meta]) => (
          <div key={type} style={{ background:meta.bg, border:`1px solid ${meta.border}`, borderRadius:10, padding:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
              <span>{meta.icon}</span><span style={{ fontSize:11, color:meta.color, fontWeight:500 }}>{type}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:C.txD }}>{costs.filter(c=>c._type===type).length}件</span>
            </div>
            <div className="mono" style={{ fontSize:18, fontWeight:500, color:meta.color }}>{fmt(totalByType(type))}</div>
          </div>
        ))}
      </div>

      {/* CSV Import - 折りたたみ式 */}
      <Card style={{ marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setCsvOpen(p=>!p)}>
          <span style={{ fontSize:13, fontWeight:500 }}>費用CSV一括取込</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:C.txD }}>弥生・freeeからの一括インポート</span>
            <span style={{ color:C.txD, fontSize:14 }}>{csvOpen?"▲":"▼"}</span>
          </div>
        </div>
        {csvOpen && (
          <div style={{ marginTop:12 }}>
            <textarea value={rawCSV} onChange={e=>setRawCSV(e.target.value)}
              style={{ width:"100%", height:90, background:C.bgL, border:`1px solid ${C.b}`, borderRadius:7, padding:"8px 10px", fontSize:11, color:C.txM, outline:"none", fontFamily:"monospace", lineHeight:1.6, marginBottom:8 }}/>
            <div style={{ display:"flex", gap:8 }}>
              <Btn sm onClick={importCSV}>取込・自動判定</Btn>
              <Btn sm onClick={runAI} disabled={aiLoading}>⚡ {aiLoading?"分析中...":"AI再判定"}</Btn>
            </div>
            {log && <div style={{ fontSize:11, color:C.teal, marginTop:6 }}>{log}</div>}
          </div>
        )}
      </Card>

      {/* Row editor */}
      <Card>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
          <div style={{ fontSize:13, fontWeight:500 }}>費目一覧</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            {periods && periods.length > 1 && (
              <select value={currentPeriod} onChange={e=>onPeriodChange&&onPeriodChange(e.target.value)}
                style={{ background:C.bgL, border:`1px solid ${C.bM}`, borderRadius:6, padding:"4px 8px", fontSize:12, color:C.tx, outline:"none" }}>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {journals && journals.length > 0 && journalMonths.length > 1 && (
              <select value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}
                style={{ background:C.bgL, border:`1px solid ${C.bM}`, borderRadius:6, padding:"4px 8px", fontSize:12, color:C.tx, outline:"none" }}>
                {journalMonths.map(m => <option key={m} value={m}>{m==="all"?"全期間OCR":m}</option>)}
              </select>
            )}
            <Btn sm onClick={()=>(() => { const next = [...localCosts, { 費目:"新規費目", 金額:0, _type:"固定費", 固定率:100 }]; setLocalCosts(next); onChange(next); })()}>＋ 追加</Btn>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {visibleWithIdx.map(({ c, i }) => {
            const t = TYPE_META[c._type] || TYPE_META["固定費"];
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.bgL, borderRadius:8, border:`1px solid ${C.b}` }}>
                <div style={{ width:3, height:32, borderRadius:2, background:t.color, flexShrink:0 }}/>
                <input value={c.費目} onChange={e=>upd(i,"費目",e.target.value)}
                  style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:13, color:C.tx, minWidth:0 }}/>
                <input value={c.金額} onChange={e=>upd(i,"金額",e.target.value)}
                  style={{ width:110, background:C.bgLL, border:`1px solid ${C.b}`, borderRadius:6, padding:"4px 8px", fontSize:12, color:C.tx, outline:"none", textAlign:"right", fontFamily:M }}/>
                <div style={{ display:"flex", gap:3 }}>
                  {Object.entries(TYPE_META).map(([type,meta]) => (
                    <button key={type} onClick={()=>upd(i,"_type",type)} style={{
                      padding:"3px 9px", borderRadius:20, fontSize:11, cursor:"pointer", border:"none",
                      background:c._type===type?meta.color+"33":C.bgLL,
                      color:c._type===type?meta.color:C.txD,
                      outline:c._type===type?`1px solid ${meta.color}55`:"none",
                    }}>{meta.icon} {type}</button>
                  ))}
                </div>
                {c._type==="準変動費" && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:10, color:C.txD }}>固定率</span>
                    <input type="range" min={0} max={100} step={5} value={c.固定率??60}
                      onChange={e=>upd(i,"固定率",parseInt(e.target.value))}
                      style={{ width:70, accentColor:C.amber, cursor:"pointer" }}/>
                    <span className="mono" style={{ fontSize:11, color:C.amber, minWidth:36 }}>{c.固定率??60}%</span>
                  </div>
                )}
                <button onClick={()=>del(i)} style={{ background:"none", border:"none", color:C.txD, cursor:"pointer", fontSize:16, padding:"2px 8px", lineHeight:1 }}>✕</button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════════════════════════════════
export function Journal({ entries, setEntries, onSyncToCosts, currentCosts }) {
  const [form, setForm] = useState({ date:today(), debit:"", credit:"", amount:"", description:"" });
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  // 月一覧を仕訳帳から生成
  const months = ["all", ...Array.from(new Set(entries.map(e => e.date?.slice(0,7)).filter(Boolean))).sort().reverse()];

  const add = () => {
    if (!form.debit || !form.credit || !form.amount) return;
    setEntries(p => [{ id:uid(), ...form, amount:N(form.amount) }, ...p]);
    setForm(f => ({ ...f, debit:"", credit:"", amount:"", description:"" }));
  };

  // 仕訳帳の合計をコスト管理に反映
  const syncToCosts = () => {
    const targetEntries = monthFilter === "all" ? entries : entries.filter(e => e.date?.startsWith(monthFilter));
    // 借方科目ごとに合算
    const grouped = {};
    targetEntries.forEach(e => {
      if (!e.debit || !e.amount) return;
      grouped[e.debit] = (grouped[e.debit] || 0) + N(e.amount);
    });
    const newItems = Object.entries(grouped).map(([費目, 金額]) => ({
      費目, 金額: String(Math.round(金額)), _type: "固定費", 固定率: 100,
    }));
    if (!newItems.length) { alert("集計できる仕訳がありません"); return; }
    const label = monthFilter === "all" ? "全期間" : monthFilter;
    if (!window.confirm(`${label}の仕訳を勘定科目ごとに集計してコスト管理に追加します。\n\n${newItems.map(r => `${r.費目}: ¥${Number(r.金額).toLocaleString()}`).join("\n")}\n\n既存の費目に追加されます。よろしいですか？`)) return;
    onSyncToCosts && onSyncToCosts([...(currentCosts||[]), ...newItems]);
    alert("コスト管理に反映しました。「採算計算を実行する」ボタンで採算に反映されます。");
  };

  const startEdit = (e) => {
    setEditId(e.id);
    setEditRow({ ...e, amount: String(e.amount) });
  };

  const saveEdit = () => {
    setEntries(p => p.map(e => e.id === editId ? { ...editRow, amount: N(editRow.amount) } : e));
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  const AccountSel = ({ value, onChange }) => (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%", background:C.bgL, border:`1px solid ${C.tB}`, borderRadius:5, padding:"4px 6px", fontSize:12, color:C.tx, outline:"none" }}>
      <option value="">科目選択...</option>
      {ACCOUNTS.map(a=><option key={a}>{a}</option>)}
    </select>
  );

  const FormSel = ({ field }) => (
    <select value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
      style={{ width:"100%", background:C.bgL, border:`1px solid ${C.bM}`, borderRadius:7, padding:"7px 10px", fontSize:13, color:C.tx, outline:"none" }}>
      <option value="">科目選択...</option>
      {ACCOUNTS.map(a=><option key={a}>{a}</option>)}
    </select>
  );

  const filtered = entries.filter(e => {
    if (monthFilter !== "all" && !e.date?.startsWith(monthFilter)) return false;
    if (search && ![e.date, e.debit, e.credit, e.description].some(v => v?.includes(search))) return false;
    return true;
  });

  // 月別集計
  const monthTotal = filtered.reduce((a, e) => a + N(e.amount), 0);

  return (
    <div className="fade">
      <Card style={{ marginBottom:12 }}>
        <ST>仕訳入力</ST>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
          <div><div style={{ fontSize:11, color:C.txD, marginBottom:4 }}>日付</div><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          <div><div style={{ fontSize:11, color:C.txD, marginBottom:4 }}>借方</div><FormSel field="debit"/></div>
          <div><div style={{ fontSize:11, color:C.txD, marginBottom:4 }}>貸方</div><FormSel field="credit"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:10 }}>
          <div><div style={{ fontSize:11, color:C.txD, marginBottom:4 }}>金額</div><Input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"/></div>
          <div><div style={{ fontSize:11, color:C.txD, marginBottom:4 }}>摘要</div><Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="取引内容"/></div>
          <div style={{ display:"flex", alignItems:"flex-end" }}><Btn primary onClick={add} style={{ width:"100%" }}>＋ 追加</Btn></div>
        </div>
      </Card>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
          <div style={{ fontSize:13, fontWeight:500 }}>仕訳帳 <span style={{ fontSize:11, color:C.txD, fontWeight:400 }}>（行をクリックで編集）</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <select value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}
              style={{ background:C.bgL, border:`1px solid ${C.bM}`, borderRadius:6, padding:"4px 8px", fontSize:12, color:C.tx, outline:"none" }}>
              {months.map(m => <option key={m} value={m}>{m==="all"?"全期間":m}</option>)}
            </select>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="検索..." style={{ background:C.bgL, border:`1px solid ${C.bM}`, borderRadius:6, padding:"4px 8px", fontSize:12, color:C.tx, outline:"none", width:110 }}/>
            <span className="mono" style={{ fontSize:11, color:C.txD }}>{filtered.length}件 / 合計 {fmt(monthTotal)}</span>
            {onSyncToCosts && (
              <button onClick={syncToCosts} style={{ background:C.teal, color:"#0B1628", border:"none", borderRadius:6, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                コスト管理に集計を反映
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:580 }}>
            <thead><tr>{["日付","借方","貸方","金額","摘要",""].map(h=>(
              <th key={h} style={{ padding:"7px 10px", textAlign:h==="金額"?"right":"left", fontSize:10, color:C.txD, borderBottom:`1px solid ${C.b}`, fontWeight:500 }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {filtered.slice(0,200).map(e => editId === e.id ? (
                <tr key={e.id} style={{ background:C.bgLL, borderBottom:`1px solid ${C.tB}` }}>
                  <td style={{ padding:"6px 8px" }}>
                    <input type="date" value={editRow.date} onChange={ev=>setEditRow(r=>({...r,date:ev.target.value}))}
                      style={{ background:C.bgL, border:`1px solid ${C.tB}`, borderRadius:5, padding:"4px 6px", fontSize:12, color:C.tx, outline:"none", width:"100%" }}/>
                  </td>
                  <td style={{ padding:"6px 8px" }}>
                    <AccountSel value={editRow.debit} onChange={v=>setEditRow(r=>({...r,debit:v}))}/>
                  </td>
                  <td style={{ padding:"6px 8px" }}>
                    <AccountSel value={editRow.credit} onChange={v=>setEditRow(r=>({...r,credit:v}))}/>
                  </td>
                  <td style={{ padding:"6px 8px" }}>
                    <input value={editRow.amount} onChange={ev=>setEditRow(r=>({...r,amount:ev.target.value}))}
                      style={{ background:C.bgL, border:`1px solid ${C.tB}`, borderRadius:5, padding:"4px 6px", fontSize:12, color:C.tx, outline:"none", width:"100%", textAlign:"right", fontFamily:"monospace" }}/>
                  </td>
                  <td style={{ padding:"6px 8px" }}>
                    <input value={editRow.description} onChange={ev=>setEditRow(r=>({...r,description:ev.target.value}))}
                      style={{ background:C.bgL, border:`1px solid ${C.tB}`, borderRadius:5, padding:"4px 6px", fontSize:12, color:C.tx, outline:"none", width:"100%" }}/>
                  </td>
                  <td style={{ padding:"6px 8px", whiteSpace:"nowrap" }}>
                    <button onClick={saveEdit} style={{ background:C.teal, border:"none", color:"#0B1628", borderRadius:5, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer", marginRight:4 }}>保存</button>
                    <button onClick={cancelEdit} style={{ background:"none", border:`1px solid ${C.bM}`, color:C.txM, borderRadius:5, padding:"4px 8px", fontSize:11, cursor:"pointer" }}>取消</button>
                  </td>
                </tr>
              ) : (
                <tr key={e.id} onClick={()=>startEdit(e)} className="hr" style={{ borderBottom:`1px solid ${C.b}`, cursor:"pointer" }}>
                  <td style={{ padding:"8px 10px", color:C.txM }}>{e.date}</td>
                  <td style={{ padding:"8px 10px" }}>{e.debit}</td>
                  <td style={{ padding:"8px 10px", color:C.txM }}>{e.credit}</td>
                  <td className="mono" style={{ padding:"8px 10px", textAlign:"right" }}>{fmt(e.amount)}</td>
                  <td style={{ padding:"8px 10px", color:C.txM, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.description}</td>
                  <td><button onClick={ev=>{ev.stopPropagation();setEntries(p=>p.filter(x=>x.id!==e.id))}} style={{ background:"none", border:"none", color:C.txD, cursor:"pointer", fontSize:12 }}>✕</button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} style={{ padding:"2rem", textAlign:"center", color:C.txD, fontSize:12 }}>{search?"検索結果がありません":"仕訳がありません"}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PL STATEMENT
// ═══════════════════════════════════════════════════════════════════════════
const PL_INIT = { 売上高:48200000, 売上原価:29700000, sga:[{ label:"人件費",v:7200000 },{ label:"地代家賃",v:1800000 },{ label:"減価償却費",v:2100000 },{ label:"水道光熱費",v:950000 },{ label:"その他販管費",v:1200000 }], 営業外収益:120000, 支払利息:280000, 特別利益:0, 特別損失:0, 法人税等:1450000 };

export function PLStatement({ stored, onSave, computed, costs }) {
  const [pl, setPL] = useState(stored || PL_INIT);
  const [showPct, setShowPct] = useState(true);
  const gross = pl.売上高 - pl.売上原価;
  const totalSGA = pl.sga.reduce((a,r) => a+r.v, 0);
  const opP = gross - totalSGA;
  const ordP = opP + pl.営業外収益 - pl.支払利息;
  const pretax = ordP + pl.特別利益 - pl.特別損失;
  const net = pretax - pl.法人税等;
  const s = pl.売上高;

  const Row = ({ label, val, indent=0, bold=false, color }) => (
    <tr className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
      <td style={{ padding:"8px 12px", paddingLeft:12+indent*18, fontSize:bold?13:12, fontWeight:bold?500:400, color:color||C.tx }}>{label}</td>
      <td className="mono" style={{ padding:"8px 12px", textAlign:"right", fontSize:12, fontWeight:bold?500:400, color:val<0?C.red:color||C.tx }}>{fmt(val)}</td>
      {showPct && <td className="mono" style={{ padding:"8px 12px", textAlign:"right", fontSize:11, color:C.txD }}>{s?pct(val/Math.abs(s)*100):""}</td>}
    </tr>
  );

  return (
    <div className="fade">
      {computed && (
        <div style={{ background:"rgba(0,212,168,0.08)", border:"1px solid rgba(0,212,168,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <div style={{ fontSize:12, color:"#00D4A8", fontWeight:500, marginBottom:3 }}>⚡ 採算計算結果あり</div>
            <div style={{ fontSize:11, color:"rgba(232,240,255,0.5)" }}>
              売上高 {fmt(computed.totalRev)} ／ 売上原価（変動費）{fmt(computed.totalVC)} ／ 固定費 {fmt(computed.totalFixed)}
            </div>
          </div>
          <button onClick={() => {
            const sgaFromCosts = (costs||[])
              .filter(r => r._type === "固定費" || r._type === "準変動費")
              .map(r => ({
                label: r.費目 || "その他",
                v: r._type === "準変動費"
                  ? Math.round(Number(r.金額||0) * (Number(r.固定率||60)/100))
                  : Number(r.金額||0)
              }))
              .filter(r => r.v > 0);
            if (!window.confirm("採算計算の結果をPLに取り込みますか？\n・売上高\n・売上原価（変動費合計）\n・販管費（固定費リスト）\n\n営業外損益・法人税等は変更されません。")) return;
            setPL(p => ({
              ...p,
              売上高: Math.round(computed.totalRev),
              売上原価: Math.round(computed.totalVC),
              sga: sgaFromCosts.length > 0 ? sgaFromCosts : p.sga,
            }));
          }} style={{ background:"#00D4A8", color:"#0B1628", border:"none", borderRadius:7, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            採算結果を取り込む
          </button>
        </div>
      )}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.txM, cursor:"pointer" }}>
          <input type="checkbox" checked={showPct} onChange={e=>setShowPct(e.target.checked)} style={{ accentColor:C.teal }}/>売上高比（%）表示
        </label>
        <Btn sm onClick={()=>{ setPL(p=>({...p,sga:[...p.sga,{ label:"新規費目",v:0 }]})); }}>＋ 販管費追加</Btn>
        <Btn sm onClick={()=>onSave(pl)} style={{ marginLeft:"auto" }}>💾 保存</Btn>
        <Btn sm onClick={()=>window.print()}>🖨 印刷</Btn>
      </div>
      <div className="g4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        {[{ label:"売上総利益", v:gross }, { label:"営業利益", v:opP }, { label:"経常利益", v:ordP }, { label:"当期純利益", v:net }].map(k => (
          <KPI key={k.label} label={k.label} value={fmt(k.v)} color={k.v>=0?C.teal:C.red} sub={s?pct(k.v/s*100):""}/>
        ))}
      </div>
      <Card>
        <ST right={<span style={{ fontSize:11, color:C.txD }}>金額クリックで編集</span>}>損益計算書</ST>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <tbody>
            <tr className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
              <td style={{ padding:"8px 12px", fontSize:13, fontWeight:500 }}>Ⅰ 売上高</td>
              <td className="mono" style={{ padding:"8px 12px", textAlign:"right", fontSize:12 }}><EditNum value={pl.売上高} onChange={v=>setPL(p=>({...p,売上高:v}))}/></td>
              {showPct && <td/>}
            </tr>
            <Row label="Ⅱ 売上原価" val={pl.売上原価} indent={1}/>
            <Row label="売上総利益" val={gross} bold color={gross>=0?C.teal:C.red}/>
            <tr><td colSpan={showPct?3:2} style={{ padding:"5px 12px", fontSize:10, color:C.txD }}>Ⅲ 販売費及び一般管理費</td></tr>
            {pl.sga.map((r,i) => (
              <tr key={i} className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
                <td style={{ padding:"7px 12px", paddingLeft:28, fontSize:12 }}>
                  <input value={r.label} onChange={e=>setPL(p=>({...p,sga:p.sga.map((x,j)=>j===i?{...x,label:e.target.value}:x)}))}
                    style={{ background:"transparent", border:"none", outline:"none", fontSize:12, color:C.txM, width:"100%" }}/>
                </td>
                <td className="mono" style={{ padding:"7px 12px", textAlign:"right", fontSize:12 }}>
                  <EditNum value={r.v} onChange={v=>setPL(p=>({...p,sga:p.sga.map((x,j)=>j===i?{...x,v}:x)}))}/>
                </td>
                {showPct && <td className="mono" style={{ padding:"7px 12px", textAlign:"right", fontSize:11, color:C.txD }}>{s?pct(r.v/s*100):""}</td>}
                <td style={{ width:20 }}><button onClick={()=>setPL(p=>({...p,sga:p.sga.filter((_,j)=>j!==i)}))} style={{ background:"none", border:"none", color:C.txD, cursor:"pointer", fontSize:11 }}>✕</button></td>
              </tr>
            ))}
            <Row label="販管費合計" val={totalSGA} bold indent={1}/>
            <Row label="営業利益" val={opP} bold color={opP>=0?C.teal:C.red}/>
            <Row label="営業外収益" val={pl.営業外収益} indent={1}/>
            <Row label="支払利息" val={pl.支払利息} indent={1}/>
            <Row label="経常利益" val={ordP} bold color={ordP>=0?C.teal:C.red}/>
            <Row label="特別利益" val={pl.特別利益} indent={1}/>
            <Row label="特別損失" val={pl.特別損失} indent={1}/>
            <Row label="税引前当期純利益" val={pretax} bold color={pretax>=0?C.teal:C.red}/>
            <Row label="法人税等" val={pl.法人税等} indent={1}/>
            <Row label="当期純利益" val={net} bold color={net>=0?C.teal:C.red}/>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BS STATEMENT
// ═══════════════════════════════════════════════════════════════════════════
export function BSStatement({ stored, onSave, plNet = 0 }) {
  const [bs, setBS] = useState(stored || DEF_BS);
  const updBS = (sec,sub,key,val) => setBS(p=>({...p,[sec]:{...p[sec],[sub]:{...p[sec][sub],[key]:N(val)}}}));
  const delItem = (sec,sub,key) => { const n={...bs};delete n[sec][sub][key];setBS({...n}); };
  const addItem = (sec,sub,label) => setBS(p=>({...p,[sec]:{...p[sec],[sub]:{...p[sec][sub],[label||"新規科目"]:0}}}));
  const sumObj = o => Object.values(o).reduce((a,v)=>a+N(v),0);
  const curA=sumObj(bs.assets.current), fixA=sumObj(bs.assets.fixed), totalA=curA+fixA;
  const curL=sumObj(bs.liabilities.current), ltL=sumObj(bs.liabilities.longterm), totalL=curL+ltL;
  const totalEq=sumObj(bs.equity)+(plNet||0), totalLE=totalL+totalEq;
  const balanced = Math.abs(totalA-totalLE)<10;

  const ERow = ({ sec,sub,label,value }) => {
    const [ev,setEv]=useState(false);
    return (
      <tr className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
        <td style={{ padding:"7px 10px", paddingLeft:26, fontSize:12 }}>{label}</td>
        <td className="mono" style={{ padding:"7px 10px", textAlign:"right", fontSize:12 }}>
          {ev ? <input autoFocus value={value} onBlur={()=>setEv(false)} onChange={e=>updBS(sec,sub,label,e.target.value)} onKeyDown={e=>e.key==="Enter"&&setEv(false)} style={{ background:"transparent", border:"none", borderBottom:`1px solid ${C.teal}`, outline:"none", width:90, textAlign:"right", fontSize:12, color:C.teal, fontFamily:M }}/> : <span onClick={()=>setEv(true)} style={{ cursor:"text" }}>{fmt(N(value))}</span>}
        </td>
        <td style={{ width:20 }}><button onClick={()=>delItem(sec,sub,label)} style={{ background:"none", border:"none", color:C.txD, cursor:"pointer", fontSize:11 }}>✕</button></td>
      </tr>
    );
  };
  const SH = ({ children, color=C.txD }) => (
    <tr><td colSpan={3} style={{ padding:"8px 10px", fontSize:11, fontWeight:500, color, background:C.bgL }}>{children}</td></tr>
  );
  const TR = ({ label, val, bold, isTotal }) => (
    <tr style={{ borderBottom:`1px solid ${C.b}`, background:isTotal?C.bgL:"transparent" }}>
      <td style={{ padding:"7px 10px", fontSize:bold?13:12, fontWeight:bold?500:400 }}>{label}</td>
      <td className="mono" style={{ padding:"7px 10px", textAlign:"right", fontSize:12, fontWeight:bold?500:400 }}>{val!=null?fmt(val):""}</td>
      <td/>
    </tr>
  );

  return (
    <div className="fade">
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ fontSize:12, padding:"5px 12px", borderRadius:6, background:balanced?C.tD:C.rD, color:balanced?C.teal:C.red, border:`1px solid ${balanced?C.tB:C.rB}` }}>
          {balanced ? "✓ 貸借一致" : `⚠ 不一致 ${fmt(Math.abs(totalA-totalLE))}`}
        </div>
        <div className="g4" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, flex:1 }}>
          <KPI label="総資産" value={fmt(totalA,true)} color={C.blue}/>
          <KPI label="自己資本比率" value={totalA?pct(totalEq/totalA*100):"–"} color={C.teal}/>
          <KPI label="流動比率" value={curL?pct(curA/curL*100):"–"} color={curA/curL>=1.5?C.teal:C.amber}/>
        </div>
        <Btn sm onClick={()=>onSave(bs)}>💾 保存</Btn>
        <Btn sm onClick={()=>window.print()}>🖨 印刷</Btn>
      </div>
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <ST right={<span className="mono" style={{ fontSize:11, color:C.teal }}>{fmt(totalA)}</span>}>資産の部</ST>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <tbody>
              <SH color={C.blue}>Ⅰ 流動資産</SH>
              {Object.entries(bs.assets.current).map(([k,v])=><ERow key={k} sec="assets" sub="current" label={k} value={v}/>)}
              <TR label="流動資産合計" val={curA} bold isTotal/>
              <SH color={C.blue}>Ⅱ 固定資産</SH>
              {Object.entries(bs.assets.fixed).map(([k,v])=><ERow key={k} sec="assets" sub="fixed" label={k} value={v}/>)}
              <TR label="固定資産合計" val={fixA} bold isTotal/>
              <TR label="資産合計" val={totalA} bold/>
            </tbody>
          </table>
          <div style={{ marginTop:8, display:"flex", gap:6 }}>
            <Btn sm onClick={()=>addItem("assets","current","新規流動資産")}>＋ 流動資産</Btn>
            <Btn sm onClick={()=>addItem("assets","fixed","新規固定資産")}>＋ 固定資産</Btn>
          </div>
        </Card>
        <Card>
          <ST right={<span className="mono" style={{ fontSize:11, color:C.teal }}>{fmt(totalLE)}</span>}>負債・純資産の部</ST>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <tbody>
              <SH color={C.amber}>Ⅰ 流動負債</SH>
              {Object.entries(bs.liabilities.current).map(([k,v])=><ERow key={k} sec="liabilities" sub="current" label={k} value={v}/>)}
              <TR label="流動負債合計" val={curL} bold isTotal/>
              <SH color={C.amber}>Ⅱ 固定負債</SH>
              {Object.entries(bs.liabilities.longterm).map(([k,v])=><ERow key={k} sec="liabilities" sub="longterm" label={k} value={v}/>)}
              <TR label="固定負債合計" val={ltL} bold isTotal/>
              <TR label="負債合計" val={totalL} bold/>
              <SH color={C.teal}>Ⅲ 純資産</SH>
              {Object.entries(bs.equity).map(([k,v])=><ERow key={k} sec="equity" sub="" label={k} value={v}/>)}
              {plNet!==0&&<TR label="当期純利益（PL連動）" val={plNet}/>}
              <TR label="純資産合計" val={totalEq} bold isTotal/>
              <TR label="負債・純資産合計" val={totalLE} bold/>
            </tbody>
          </table>
          <div style={{ marginTop:8, display:"flex", gap:6 }}>
            <Btn sm onClick={()=>addItem("liabilities","current","新規流動負債")}>＋ 流動負債</Btn>
            <Btn sm onClick={()=>addItem("liabilities","longterm","新規固定負債")}>＋ 固定負債</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CF STATEMENT
// ═══════════════════════════════════════════════════════════════════════════
export function CFStatement({ stored, onSave }) {
  const [cf, setCF] = useState(stored || DEF_CF);
  const upd = (sec,key,val) => setCF(p=>({...p,[sec]:{...p[sec],[key]:{...p[sec][key],value:val}}}));
  const addRow = sec => setCF(p=>({...p,[sec]:{...p[sec],["item_"+uid()]:{label:"新規項目",value:0}}}));
  const delRow = (sec,key) => setCF(p=>{const n={...p,[sec]:{...p[sec]}};delete n[sec][key];return n;});
  const sum = sec => Object.values(cf[sec]).reduce((a,v)=>a+N(v.value),0);
  const opCF=sum("operating"), invCF=sum("investing"), finCF=sum("financing");
  const netCF=opCF+invCF+finCF, closing=cf.opening_cash+netCF;
  const SECS = [
    { key:"operating", label:"Ⅰ 営業活動によるCF", color:C.teal },
    { key:"investing", label:"Ⅱ 投資活動によるCF", color:C.amber },
    { key:"financing", label:"Ⅲ 財務活動によるCF", color:C.blue },
  ];
  const sums = { operating:opCF, investing:invCF, financing:finCF };
  return (
    <div className="fade">
      <div className="g4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        <KPI label="営業CF" value={fmt(opCF,true)} color={opCF>=0?C.teal:C.red} sub="本業の稼ぐ力"/>
        <KPI label="投資CF" value={fmt(invCF,true)} color={invCF<=0?C.amber:C.teal} sub="設備投資状況"/>
        <KPI label="フリーCF" value={fmt(opCF+invCF,true)} color={(opCF+invCF)>=0?C.teal:C.red} sub="営業＋投資CF"/>
        <KPI label="期末現金残高" value={fmt(closing,true)} sub={`期首 ${fmt(cf.opening_cash,true)}`}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <Btn sm onClick={()=>onSave(cf)}>💾 保存</Btn>
        <Btn sm onClick={()=>window.print()}>🖨 印刷</Btn>
        <span style={{ fontSize:11, color:C.txD, alignSelf:"center" }}>金額クリックで直接編集</span>
      </div>
      <Card>
        <ST>キャッシュフロー計算書（間接法）</ST>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <tbody>
            <tr style={{ borderBottom:`1px solid ${C.bM}`, background:C.bgL }}>
              <td style={{ padding:"9px 12px", fontSize:12, fontWeight:500 }}>期首現金及び現金同等物残高</td>
              <td className="mono" style={{ padding:"9px 12px", textAlign:"right", fontSize:12 }}><EditNum value={cf.opening_cash} onChange={v=>setCF(p=>({...p,opening_cash:v}))}/></td>
            </tr>
            {SECS.map(sec => (
              <>
                <tr key={sec.key+"h"}><td colSpan={2} style={{ padding:"8px 12px 4px", fontSize:11, fontWeight:500, color:sec.color }}>{sec.label}</td></tr>
                {Object.entries(cf[sec.key]).map(([k,row]) => (
                  <tr key={k} className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
                    <td style={{ padding:"7px 12px", paddingLeft:26, fontSize:12, color:C.txM }}>
                      <input value={row.label} onChange={e=>setCF(p=>({...p,[sec.key]:{...p[sec.key],[k]:{...row,label:e.target.value}}}))}
                        style={{ background:"transparent", border:"none", outline:"none", fontSize:12, color:C.txM, width:"100%" }}/>
                    </td>
                    <td className="mono" style={{ padding:"7px 12px", textAlign:"right", fontSize:12, color:N(row.value)<0?C.red:C.tx }}>
                      <EditNum value={row.value} onChange={v=>upd(sec.key,k,v)}/>
                    </td>
                    <td style={{ width:20 }}>
                      <button onClick={()=>delRow(sec.key,k)} style={{ background:"none", border:"none", color:C.txD, cursor:"pointer", fontSize:11 }}>✕</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderBottom:`1px solid ${C.bM}`, background:C.bgL }}>
                  <td style={{ padding:"8px 12px", fontSize:12, fontWeight:500 }}>{sec.label.replace("Ⅰ ","").replace("Ⅱ ","").replace("Ⅲ ","")} 合計</td>
                  <td className="mono" style={{ padding:"8px 12px", textAlign:"right", fontSize:13, fontWeight:500, color:sums[sec.key]>=0?sec.color:C.red }}>{fmt(sums[sec.key])}</td>
                  <td><button onClick={()=>addRow(sec.key)} style={{ background:"none", border:"none", color:C.txD, cursor:"pointer", fontSize:11, padding:"2px 6px" }}>＋</button></td>
                </tr>
              </>
            ))}
            <tr style={{ borderBottom:`1px solid ${C.bM}`, background:C.bgL }}>
              <td style={{ padding:"10px 12px", fontSize:12, fontWeight:500 }}>現金及び現金同等物の増減額</td>
              <td className="mono" style={{ padding:"10px 12px", textAlign:"right", fontSize:13, fontWeight:500, color:netCF>=0?C.teal:C.red }}>{fmt(netCF)}</td>
              <td/>
            </tr>
            <tr style={{ background:C.bgLL }}>
              <td style={{ padding:"12px 12px", fontSize:13, fontWeight:500 }}>期末現金及び現金同等物残高</td>
              <td className="mono" style={{ padding:"12px 12px", textAlign:"right", fontSize:16, fontWeight:500, color:C.teal }}>{fmt(closing)}</td>
              <td/>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTHLY REPORT
// ═══════════════════════════════════════════════════════════════════════════
export function MonthlyReport({ stored, onSave }) {
  const [data, setData] = useState(stored || DEF_MONTHLY);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const withCalc = data.map(d => ({ ...d, grossProfit:d.sales-d.cogs, opProfit:d.sales-d.cogs-d.sga, grossRate:d.sales?(d.sales-d.cogs)/d.sales*100:0, opRate:d.sales?(d.sales-d.cogs-d.sga)/d.sales*100:0 }));
  const upd = (month,field,val) => setData(p=>p.map(d=>{if(d.month!==month)return d;const nd={...d,[field]:N(val)};nd.opProfit=nd.sales-nd.cogs-nd.sga;return nd;}));

  const genSummary = async () => {
    setAiLoading(true);
    const ctx = withCalc.map(d=>`${d.month}: 売上${fmt(d.sales)} 総利益率${pct(d.grossRate)} 営業利益率${pct(d.opRate)}`).join("\n");
    try {
      const reply = await callClaude({ system:"あなたは管理会計専門家です。月次推移データを分析し、①トレンド ②注目点 ③改善提言 の3段落で経営コメントを簡潔に書いてください。", messages:[{ role:"user", content:ctx }] });
      setAiSummary(reply);
    } catch { setAiSummary("通信エラーが発生しました。"); }
    setAiLoading(false);
  };

  return (
    <div className="fade">
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <Btn sm onClick={()=>setData(p=>[...p,{ month:`${p.length+1}月`, sales:p[p.length-1]?.sales||0, cogs:p[p.length-1]?.cogs||0, sga:p[p.length-1]?.sga||0 }])}>＋ 月追加</Btn>
        <Btn sm onClick={genSummary} disabled={aiLoading} style={{ background:C.tD, color:C.teal, border:`1px solid ${C.tB}` }}>⚡ {aiLoading?"生成中...":"AI経営コメント生成"}</Btn>
        <Btn sm onClick={()=>onSave(data)} style={{ marginLeft:"auto" }}>💾 保存</Btn>
        <Btn sm onClick={()=>window.print()}>🖨 印刷</Btn>
      </div>
      {aiSummary && <Card style={{ marginBottom:14, background:C.tD, border:`1px solid ${C.tB}` }}><ST>⚡ AI経営コメント</ST><div style={{ fontSize:13, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{aiSummary}</div></Card>}
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <Card>
          <ST>売上高・営業利益 推移</ST>
          <ResponsiveContainer width="100%" height={170}>
            <ComposedChart data={withCalc.map(d=>({ name:d.month, 売上高:d.sales, 営業利益:d.opProfit }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
              <XAxis dataKey="name" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v,true)}/>
              <Tooltip content={<TipBox/>}/>
              <Bar dataKey="売上高" fill={C.blue+"55"} radius={[3,3,0,0]}/>
              <Bar dataKey="営業利益" fill={C.teal+"99"} radius={[3,3,0,0]}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <ST>利益率 推移</ST>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={withCalc.map(d=>({ name:d.month, 売上総利益率:Math.round(d.grossRate*10)/10, 営業利益率:Math.round(d.opRate*10)/10 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b}/>
              <XAxis dataKey="name" tick={{ fontSize:11, fill:C.txD }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:C.txD }} axisLine={false} tickLine={false} domain={["auto","auto"]} tickFormatter={v=>v+"%"}/>
              <Tooltip content={<TipBox/>}/>
              <Line type="monotone" dataKey="売上総利益率" stroke={C.teal} strokeWidth={2} dot={{ fill:C.teal, r:3 }}/>
              <Line type="monotone" dataKey="営業利益率" stroke={C.amber} strokeWidth={2} dot={{ fill:C.amber, r:3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <ST right={<span style={{ fontSize:11, color:C.txD }}>金額クリックで編集</span>}>月次損益推移表</ST>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                <th style={{ padding:"8px 12px", textAlign:"left", fontSize:10, color:C.txD, borderBottom:`1px solid ${C.bM}`, fontWeight:500 }}>科目</th>
                {withCalc.map(d=><th key={d.month} style={{ padding:"8px 12px", textAlign:"right", fontSize:10, color:C.txD, borderBottom:`1px solid ${C.bM}`, fontWeight:500 }}>{d.month}</th>)}
              </tr>
            </thead>
            <tbody>
              {[{ key:"sales", label:"売上高", bold:true },{ key:"cogs", label:"売上原価" },{ key:"grossProfit", label:"売上総利益", bold:true, calc:true, color:C.teal },{ key:"grossRate", label:"└ 総利益率", isPct:true, calc:true },{ key:"sga", label:"販管費" },{ key:"opProfit", label:"営業利益", bold:true, calc:true },{ key:"opRate", label:"└ 営業利益率", isPct:true, calc:true }].map(row => (
                <tr key={row.key} className="hr" style={{ borderBottom:`1px solid ${C.b}`, background:row.bold?C.bgL:"transparent" }}>
                  <td style={{ padding:"8px 12px", fontSize:row.isPct?11:12, fontWeight:row.bold?500:400, color:row.color||C.tx }}>{row.label}</td>
                  {withCalc.map(d=>(
                    <td key={d.month} className="mono" style={{ padding:"8px 12px", textAlign:"right", fontSize:row.isPct?11:12, fontWeight:row.bold?500:400, color:d[row.key]<0?C.red:row.color||C.tx }}>
                      {row.calc||row.isPct ? (row.isPct?pct(d[row.key]):fmt(d[row.key])) : <EditNum value={d[row.key]} onChange={v=>upd(d.month,row.key,v)}/>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAX SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export function TaxSummary({ stored, onSave }) {
  const [tax, setTax] = useState(stored || DEF_TAX);
  const [aiNote, setAiNote] = useState("");
  const [aiLoad, setAiLoad] = useState(false);
  const updSection = (sec,key,val) => setTax(p=>({...p,[sec]:{...p[sec],[key]:{...p[sec][key],value:N(val)}}}));
  const sumObj = obj => Object.values(obj).reduce((a,v)=>a+N(v.value),0);
  const addBack=sumObj(tax.add_back), deds=sumObj(tax.deductions);
  const taxableIncome=tax.pretax_income+addBack-deds;
  const corpTax=Math.max(0,taxableIncome*(tax.corp_tax_rate/100));
  const localTax=corpTax*(tax.local_tax_rate/100);
  const bizTax=Math.max(0,taxableIncome*(tax.biz_tax_rate/100));
  const totalTax=corpTax+localTax+bizTax;
  const effRate=tax.pretax_income>0?totalTax/tax.pretax_income*100:0;
  const consumTax=tax.taxable_sales*(tax.tax_rate_sales/100);
  const inputTax=tax.taxable_purchase*(tax.tax_rate_purchase/100);
  const taxPayable=Math.max(0,consumTax-inputTax-tax.prev_credit);
  const taxRefund=Math.max(0,inputTax+tax.prev_credit-consumTax);

  const genNote = async () => {
    setAiLoad(true);
    try {
      const reply = await callClaude({ system:"法人税・消費税専門家として①計算サマリー ②節税ポイント ③税務リスクと対策 を簡潔に説明してください。最後に「具体的な税務判断は税理士にご相談ください」と添えてください。", messages:[{ role:"user", content:`法人税：課税所得${fmt(taxableIncome)} 合計税額${fmt(totalTax)} 実効税率${pct(effRate)}\n消費税：納付額${fmt(taxPayable)}` }] });
      setAiNote(reply);
    } catch { setAiNote("通信エラー"); }
    setAiLoad(false);
  };

  const SRow = ({ label, val, indent=0, bold=false, color, editable, onEdit }) => (
    <tr className="hr" style={{ borderBottom:`1px solid ${C.b}` }}>
      <td style={{ padding:"8px 12px", paddingLeft:12+indent*16, fontSize:bold?13:12, fontWeight:bold?500:400, color:color||C.tx }}>{label}</td>
      <td className="mono" style={{ padding:"8px 12px", textAlign:"right", fontSize:12, fontWeight:bold?500:400, color:val<0?C.red:color||C.tx }}>
        {editable ? <EditNum value={val} onChange={onEdit}/> : fmt(val)}
      </td>
    </tr>
  );

  return (
    <div className="fade">
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <Btn sm onClick={genNote} disabled={aiLoad} style={{ background:C.tD, color:C.teal, border:`1px solid ${C.tB}` }}>⚡ {aiLoad?"分析中...":"AI税務アドバイス"}</Btn>
        <Btn sm onClick={()=>onSave(tax)}>💾 保存</Btn>
        <Btn sm onClick={()=>window.print()} style={{ marginLeft:"auto" }}>🖨 印刷</Btn>
      </div>
      {aiNote && <Card style={{ marginBottom:14, background:C.tD, border:`1px solid ${C.tB}` }}><ST>⚡ AI税務アドバイス</ST><div style={{ fontSize:12, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{aiNote}</div></Card>}
      <div className="g4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        <KPI label="課税所得" value={fmt(taxableIncome,true)}/>
        <KPI label="法人税等合計" value={fmt(totalTax,true)} color={C.red}/>
        <KPI label="実効税率" value={pct(effRate)} color={effRate<30?C.teal:C.amber}/>
        <KPI label="消費税納付額" value={fmt(taxPayable,true)} color={taxPayable>0?C.amber:C.teal} sub={taxRefund>0?`還付 ${fmt(taxRefund,true)}`:undefined}/>
      </div>
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <ST>法人税・住民税・事業税（別表四 簡易）</ST>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <tbody>
              <SRow label="税引前当期純利益" val={tax.pretax_income} bold editable onEdit={v=>setTax(p=>({...p,pretax_income:v}))}/>
              <tr><td colSpan={2} style={{ padding:"5px 12px", fontSize:10, color:C.txD }}>加算（損金不算入）</td></tr>
              {Object.entries(tax.add_back).map(([k,r])=><SRow key={k} label={r.label} val={r.value} indent={1} editable onEdit={v=>updSection("add_back",k,v)}/>)}
              <SRow label="加算合計" val={addBack} bold color={C.amber}/>
              <tr><td colSpan={2} style={{ padding:"5px 12px", fontSize:10, color:C.txD }}>減算（益金不算入）</td></tr>
              {Object.entries(tax.deductions).map(([k,r])=><SRow key={k} label={r.label} val={r.value} indent={1} editable onEdit={v=>updSection("deductions",k,v)}/>)}
              <SRow label="減算合計" val={deds} bold color={C.teal}/>
              <SRow label="課税所得" val={taxableIncome} bold/>
              <SRow label={`法人税 (${tax.corp_tax_rate}%)`} val={corpTax} indent={1}/>
              <SRow label={`法人住民税 (${tax.local_tax_rate}%)`} val={localTax} indent={1}/>
              <SRow label={`事業税 (${tax.biz_tax_rate}%)`} val={bizTax} indent={1}/>
              <SRow label="法人税等合計" val={totalTax} bold color={C.red}/>
              <SRow label="実効税率" val={effRate} bold color={effRate<30?C.teal:C.amber}/>
            </tbody>
          </table>
        </Card>
        <Card>
          <ST>消費税計算</ST>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <tbody>
              <SRow label="課税売上高（税込）" val={tax.taxable_sales} editable onEdit={v=>setTax(p=>({...p,taxable_sales:v}))}/>
              <SRow label="消費税額（売上）" val={consumTax} indent={1} color={C.txM}/>
              <SRow label="課税仕入高（税込）" val={tax.taxable_purchase} editable onEdit={v=>setTax(p=>({...p,taxable_purchase:v}))}/>
              <SRow label="仕入税額控除" val={inputTax} indent={1} color={C.teal}/>
              <SRow label="前期繰越還付額" val={tax.prev_credit} indent={1} editable onEdit={v=>setTax(p=>({...p,prev_credit:v}))}/>
              {taxPayable>0 ? <SRow label="納付すべき消費税" val={taxPayable} bold color={C.red}/> : <SRow label="還付される消費税" val={taxRefund} bold color={C.teal}/>}
            </tbody>
          </table>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, color:C.txD, marginBottom:8 }}>主な申告・納付期限</div>
            {[["法人税・消費税 確定申告","決算月の翌々月末",C.red],["法人税 中間申告","事業年度開始6ヶ月後 翌2ヶ月",C.amber],["消費税 中間申告","中間課税期間終了後2ヶ月",C.amber]].map(([n,d,c])=>(
              <div key={n} style={{ display:"flex", gap:8, alignItems:"center", padding:"6px 10px", background:C.bgL, borderRadius:6, border:`1px solid ${C.b}`, marginBottom:5 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:c, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:11 }}>{n}</div>
                <div style={{ fontSize:10, color:C.txD }}>{d}</div>
              </div>
            ))}
            <div style={{ fontSize:10, color:C.txD, marginTop:8 }}>※ 具体的な税務判断は税理士にご相談ください</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI ADVISOR
// ═══════════════════════════════════════════════════════════════════════════
export function AIAdvisor({ computed, journals, period, loc }) {
  const ctx = computed ? `
期間: ${period} 拠点: ${loc}
売上高: ${fmt(computed.totalRev)} 限界利益率: ${pct(computed.cmRate)} 営業利益: ${fmt(computed.opProfit)} BEP比率: ${pct(computed.bepRatio)}
品目別:
${computed.products.map(p=>`  ${p.name}: 売上${fmt(p.rev)} 限益率${pct(p.cmRate)} 貢献利益${fmt(p.contrib)} [${p.status}]`).join("\n")}
仕訳件数: ${journals?.length||0}件
  `.trim() : "データ未取込";

  return (
    <div className="fade">
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:32, height:32, background:C.tD, border:`1px solid ${C.tB}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <div>
            <div style={{ fontSize:14, fontWeight:500 }}>財務 AI アドバイザー</div>
            <div style={{ fontSize:11, color:C.txD }}>SAP CO-PA/CO-PC歴10年・MBA取得ベースの専門分析 · {loc} · {period}</div>
          </div>
        </div>
        <AIChat
          systemPrompt={`あなたはSAP CO-PA/CO-PC経験10年・MBA取得の管理会計・財務分析専門家です。以下のデータを基に、中小企業経営者向けに実践的・簡潔なアドバイスを日本語でしてください。数字を具体的に引用してください。\n\n${ctx}`}
          suggestions={["赤字品目への対処法は？","限界利益率を改善するには？","固定費削減の優先順位は？","損益分岐点を下げる方法は？","財務健全性を総合評価して","キャッシュフロー改善策は？"]}
        />
      </Card>
    </div>
  );
}
