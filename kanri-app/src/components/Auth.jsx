// src/components/Auth.jsx
import { useState } from "react";
import { C, CSS } from "../tokens.js";
import { Card, Btn, Input } from "./Atoms.jsx";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const handle = () => {
    if (!email || !pw) { setErr("メールとパスワードを入力してください"); return; }
    try {
      const key = `kk_user_${email}`;
      if (mode === "register") {
        if (localStorage.getItem(key)) { setErr("このメールは登録済みです"); return; }
        localStorage.setItem(key, JSON.stringify({ email, pw }));
      } else {
        const saved = localStorage.getItem(key);
        if (!saved) { setErr("ユーザーが見つかりません"); return; }
        if (JSON.parse(saved).pw !== pw) { setErr("パスワードが違います"); return; }
      }
      onLogin(email);
    } catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <style>{CSS}</style>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:52, height:52, background:C.teal, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 14px" }}>⚡</div>
          <div style={{ fontSize:22, fontWeight:500 }}>管理会計ダッシュボード</div>
          <div style={{ fontSize:12, color:C.txD, marginTop:4 }}>中小企業向け · PL/BS/CF · AI財務分析</div>
        </div>
        <Card>
          <div style={{ display:"flex", background:C.bgL, borderRadius:8, padding:3, marginBottom:20 }}>
            {[["login","ログイン"],["register","新規登録"]].map(([v,l]) => (
              <button key={v} onClick={() => { setMode(v); setErr(""); }} style={{
                flex:1, padding:"7px", borderRadius:6, border:"none", fontSize:13, cursor:"pointer",
                background: mode===v ? C.bgM : "transparent", color: mode===v ? C.tx : C.txM,
              }}>{l}</button>
            ))}
          </div>
          {[["メールアドレス", email, setEmail, "email"], ["パスワード", pw, setPw, "password"]].map(([l,v,s,t]) => (
            <div key={l} style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:C.txM, marginBottom:5 }}>{l}</div>
              <Input type={t} value={v} onChange={e => s(e.target.value)} onKeyDown={e => e.key==="Enter" && handle()} placeholder={t==="email" ? "you@example.com" : "••••••••"}/>
            </div>
          ))}
          {err && <div style={{ fontSize:12, color:C.red, background:C.rD, border:`1px solid ${C.rB}`, borderRadius:6, padding:"8px 10px", marginBottom:12 }}>{err}</div>}
          <Btn primary onClick={handle} style={{ width:"100%", padding:"11px" }}>
            {mode === "login" ? "ログイン" : "アカウント作成"}
          </Btn>
          <div style={{ fontSize:11, color:C.txD, textAlign:"center", marginTop:14, lineHeight:1.7 }}>
            ※ デモ版：データはブラウザに保存されます<br/>
            本番は ANTHROPIC_API_KEY を Vercel 環境変数に設定してください
          </div>
        </Card>
      </div>
    </div>
  );
}
