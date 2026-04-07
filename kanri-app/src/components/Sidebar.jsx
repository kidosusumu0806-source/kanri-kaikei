// src/components/Sidebar.jsx
import { useState } from "react";
import { C } from "../tokens.js";
import { Btn } from "./Atoms.jsx";
import * as XLSX from "xlsx";

const NAV = [
  { id:"dashboard",  icon:"📊", label:"ダッシュボード" },
  { id:"import",     icon:"📁", label:"データ取込（CSV・領収書）" },
  { id:"costs",      icon:"⚙️", label:"費目分類設定" },
  { id:"journal",    icon:"📒", label:"仕訳帳" },
  { id:"product",    icon:"🏭", label:"製品別採算" },
  { id:"budget",     icon:"🎯", label:"予算対比" },
  { id:"trend",      icon:"📈", label:"トレンド" },
  { id:"pl",         icon:"📋", label:"損益計算書（PL）" },
  { id:"bs",         icon:"🏦", label:"貸借対照表（BS）" },
  { id:"cf",         icon:"💰", label:"CF計算書" },
  { id:"monthly",    icon:"📅", label:"月次比較レポート" },
  { id:"tax",        icon:"🧾", label:"税務サマリー" },
  { id:"ai",         icon:"⚡", label:"AI財務アドバイザー" },
];

export default function Sidebar({ tab, setTab, loc, setLoc, period, setPeriod, locations, setLocations, user, onLogout, computed, onExcel, savedMsg }) {
  const [collapsed, setCollapsed] = useState(false);
  const allPeriods = Object.keys(locations[loc] || {});

  const addLocation = () => {
    const n = prompt("拠点・事業部名を入力");
    if (!n || locations[n]) return;
    setLocations(p => ({ ...p, [n]: { "2024年4月": {} } }));
    setLoc(n);
  };

  const addPeriod = () => {
    const m = prompt("期間を入力（例：2024年5月）");
    if (!m || locations[loc]?.[m]) return;
    setLocations(p => ({ ...p, [loc]: { ...p[loc], [m]: {} } }));
    setPeriod(m);
  };

  return (
    <div className="no-print" style={{ width:collapsed?52:220, flexShrink:0, background:C.bgM, borderRight:`1px solid ${C.b}`, display:"flex", flexDirection:"column", padding:collapsed?"1rem .4rem":"1rem .9rem", minHeight:"100vh", position:"sticky", top:0, maxHeight:"100vh", overflowY:"auto", transition:"width .2s ease", overflow:"hidden" }}>
      {/* Logo + collapse button */}
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:"1.4rem", paddingBottom:"1rem", borderBottom:`1px solid ${C.b}`, justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, overflow:"hidden" }}>
          <div style={{ width:30, height:30, background:C.teal, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>⚡</div>
          {!collapsed && <div>
            <div style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap" }}>管理会計</div>
            <div style={{ fontSize:10, color:C.txD, whiteSpace:"nowrap" }}>{user?.split("@")[0]}</div>
          </div>}
        </div>
        <button onClick={() => setCollapsed(p => !p)} style={{ background:"none", border:"none", cursor:"pointer", color:C.txD, fontSize:16, padding:2, flexShrink:0, lineHeight:1 }}>
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Locations */}
      <div style={{ marginBottom:"1.2rem" }}>
        {!collapsed && <div style={{ fontSize:9, color:C.txD, letterSpacing:"0.07em", marginBottom:6, textTransform:"uppercase" }}>拠点・事業部</div>}
        {Object.keys(locations).map(l => (
          <button key={l} onClick={() => setLoc(l)} style={{
            width:"100%", textAlign:"left", padding:"6px 9px", borderRadius:7, fontSize:12, cursor:"pointer", marginBottom:2,
            background: l===loc ? C.bgLL : "transparent", color: l===loc ? C.teal : C.txM,
            border: `1px solid ${l===loc ? C.tB : "transparent"}`,
          }}>{l}</button>
        ))}
        <button onClick={addLocation} style={{ width:"100%", textAlign:"left", padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer", background:"transparent", color:C.txD, border:`1px dashed ${C.b}`, marginTop:3 }}>＋ 拠点追加</button>
      </div>

      {/* Periods */}
      <div style={{ marginBottom:"1.2rem" }}>
        {!collapsed && <div style={{ fontSize:9, color:C.txD, letterSpacing:"0.07em", marginBottom:6, textTransform:"uppercase" }}>対象期間</div>}
        {allPeriods.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            width:"100%", textAlign:"left", padding:"6px 9px", borderRadius:7, fontSize:12, cursor:"pointer", marginBottom:2,
            background: p===period ? C.bgLL : "transparent", color: p===period ? C.tx : C.txM,
            border: `1px solid ${p===period ? C.bM : "transparent"}`,
          }}>{p}</button>
        ))}
        <button onClick={addPeriod} style={{ width:"100%", textAlign:"left", padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer", background:"transparent", color:C.txD, border:`1px dashed ${C.b}`, marginTop:3 }}>＋ 期間追加</button>
      </div>

      {/* Nav */}
      <nav style={{ flex:1 }}>
        {!collapsed && <div style={{ fontSize:9, color:C.txD, letterSpacing:"0.07em", marginBottom:6, textTransform:"uppercase" }}>メニュー</div>}
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} title={collapsed ? n.label : ""} style={{
            width:"100%", textAlign:"left", padding:"7px 9px", borderRadius:7, fontSize:12, cursor:"pointer",
            display:"flex", alignItems:"center", gap:7, marginBottom:2, justifyContent:collapsed?"center":"flex-start",
            background: tab===n.id ? C.bgLL : "transparent",
            color: tab===n.id ? C.tx : C.txM,
            border: `1px solid ${tab===n.id ? C.bM : "transparent"}`,
          }}>
            <span style={{ fontSize:collapsed?18:13 }}>{n.icon}</span>
            {!collapsed && <span style={{ flex:1 }}>{n.label}</span>}
            {!collapsed && n.id==="ai" && <span style={{ fontSize:9, background:C.tD, color:C.teal, padding:"1px 5px", borderRadius:3 }}>AI</span>}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ paddingTop:"1rem", borderTop:`1px solid ${C.b}`, display:"flex", flexDirection:"column", gap:6 }}>
        {savedMsg && <div style={{ fontSize:11, color:C.teal }}>{savedMsg}</div>}
        {computed && (
          <Btn sm onClick={onExcel} style={{ width:"100%" }}>📊 Excel出力</Btn>
        )}
        <Btn sm onClick={() => window.print()} style={{ width:"100%" }}>🖨 印刷</Btn>
        <Btn sm danger onClick={onLogout} style={{ width:"100%" }}>ログアウト</Btn>
      </div>
    </div>
  );
}
