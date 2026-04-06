// src/components/Atoms.jsx
import { useState } from "react";
import { C, M } from "../tokens.js";
import { fmt } from "../utils.js";

export const Card = ({ children, style, id }) => (
  <div id={id} className="pc" style={{ background:C.bgM, border:`1px solid ${C.b}`, borderRadius:12, padding:"1.1rem 1.25rem", ...style }}>
    {children}
  </div>
);

export const ST = ({ children, right }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:13 }}>
    <div style={{ fontSize:10, fontWeight:500, color:C.txD, letterSpacing:"0.07em", textTransform:"uppercase" }}>{children}</div>
    {right && <div style={{ display:"flex", gap:6, alignItems:"center" }}>{right}</div>}
  </div>
);

export const Btn = ({ children, onClick, primary, sm, danger, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: sm ? "5px 11px" : "9px 20px", borderRadius:8, fontSize: sm ? 11 : 13,
    cursor: disabled ? "not-allowed" : "pointer",
    border: `1px solid ${primary ? "transparent" : danger ? C.rB : C.bM}`,
    background: primary ? C.teal : danger ? C.rD : "transparent",
    color: primary ? C.bg : danger ? C.red : C.txM,
    fontWeight: primary ? 500 : 400, opacity: disabled ? 0.45 : 1, transition:"all .15s", ...style,
  }}>{children}</button>
);

export const KPI = ({ label, value, sub, color, trend }) => (
  <div style={{ background:C.bgL, border:`1px solid ${C.b}`, borderRadius:10, padding:"1rem" }}>
    <div style={{ fontSize:11, color:C.txD, marginBottom:5 }}>{label}</div>
    <div className="mono" style={{ fontSize:19, fontWeight:500, color:color||C.tx }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.txM, marginTop:3 }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ fontSize:11, color:trend>=0?C.teal:C.red, marginTop:2 }}>
        {trend >= 0 ? "▲" : "▼"} {fmt(Math.abs(trend), true)} 前月比
      </div>
    )}
  </div>
);

export const Badge = ({ children, color = C.teal }) => (
  <span style={{ background:color+"22", color, fontSize:11, padding:"2px 8px", borderRadius:4, fontWeight:500, whiteSpace:"nowrap" }}>{children}</span>
);

export const MBar = ({ p, color }) => (
  <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, flex:1, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100,Math.max(0,p))}%`, background:color, borderRadius:2, transition:"width .5s" }}/>
  </div>
);

export const TipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.bgLL, border:`1px solid ${C.bM}`, borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      <div style={{ color:C.txM, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||p.fill, fontFamily:M }}>
          {p.name}: {typeof p.value==="number" ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export const Input = ({ value, onChange, type="text", placeholder, style }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ background:C.bgL, border:`1px solid ${C.bM}`, borderRadius:7, padding:"7px 10px", fontSize:13, color:C.tx, outline:"none", width:"100%", ...style }}/>
);

export function EditNum({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  if (editing) {
    return (
      <input autoFocus value={v} onChange={e => setV(e.target.value)}
        onBlur={() => { setEditing(false); onChange(parseFloat(v.replace(/,/g,""))||0); }}
        onKeyDown={e => e.key==="Enter" && (setEditing(false), onChange(parseFloat(v.replace(/,/g,""))||0))}
        style={{ background:"transparent", border:"none", borderBottom:`1px solid ${C.teal}`, outline:"none", width:90, textAlign:"right", fontSize:12, color:C.teal, fontFamily:M }}/>
    );
  }
  return <span onClick={() => { setV(String(value)); setEditing(true); }} style={{ cursor:"text" }} title="クリックで編集">{fmt(value)}</span>;
}

export const Alert = ({ text, color = C.amber }) => (
  <div style={{ background:color+"15", border:`1px solid ${color}44`, borderRadius:8, padding:"9px 13px", fontSize:12, color }}>
    ⚠ {text}
  </div>
);

export const Waterfall = ({ items }) => {
  const max = Math.max(...items.map(d => Math.abs(d.v)), 1);
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:130 }}>
      {items.map((d,i) => {
        const h = Math.max(6, (Math.abs(d.v)/max)*110);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <div className="mono" style={{ fontSize:10, color:d.neg?C.red:C.teal, textAlign:"center", lineHeight:1.3 }}>{d.neg?"△":"+"}{fmt(Math.abs(d.v),true)}</div>
            <div style={{ width:"100%", height:h, background:d.color, borderRadius:"3px 3px 0 0", transition:"height .6s" }}/>
            <div style={{ fontSize:10, color:C.txD, textAlign:"center", lineHeight:1.3 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};
