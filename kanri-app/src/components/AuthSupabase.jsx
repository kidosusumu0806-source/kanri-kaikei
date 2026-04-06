// src/components/AuthSupabase.jsx
import { useState } from "react";
import { C, CSS } from "../tokens.js";
import { Card, Btn, Input } from "./Atoms.jsx";
import { useAuth } from "../hooks/useSupabase.js";

export default function AuthSupabase({ onLogin }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [company, setCompany] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    if (!email || !pw) { setErr("メールとパスワードを入力してください"); return; }
    setLoading(true); setErr("");
    try {
      if (mode === "register") {
        await signUp({ email, password: pw, companyName: company });
        setDone(true); // メール確認待ち
      } else {
        const { session } = await signIn({ email, password: pw });
        if (session) onLogin(session.user);
      }
    } catch (e) {
      setErr(e.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
        <style>{CSS}</style>
        <Card style={{ maxWidth:400, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:16 }}>📧</div>
          <div style={{ fontSize:16, fontWeight:500, marginBottom:8 }}>確認メールを送信しました</div>
          <div style={{ fontSize:13, color:C.txM, lineHeight:1.8 }}>
            <strong>{email}</strong> に確認リンクを送りました。<br/>
            メール内のリンクをクリックするとログインできます。
          </div>
          <Btn onClick={() => { setDone(false); setMode("login"); }} style={{ marginTop:20, width:"100%" }}>
            ログイン画面に戻る
          </Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <style>{CSS}</style>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:52, height:52, background:C.teal, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 14px" }}>⚡</div>
          <div style={{ fontSize:22, fontWeight:500 }}>管理会計ダッシュボード</div>
          <div style={{ fontSize:12, color:C.txD, marginTop:4 }}>中小企業向け · PL/BS/CF · AI財務分析</div>
        </div>

        <Card>
          {/* Mode switch */}
          <div style={{ display:"flex", background:C.bgL, borderRadius:8, padding:3, marginBottom:20 }}>
            {[["login","ログイン"], ["register","新規登録"]].map(([v,l]) => (
              <button key={v} onClick={() => { setMode(v); setErr(""); }} style={{
                flex:1, padding:"7px", borderRadius:6, border:"none", fontSize:13, cursor:"pointer",
                background:mode===v?C.bgM:"transparent", color:mode===v?C.tx:C.txM,
              }}>{l}</button>
            ))}
          </div>

          {/* Fields */}
          {mode === "register" && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:C.txM, marginBottom:5 }}>会社名（任意）</div>
              <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="株式会社〇〇"/>
            </div>
          )}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:C.txM, marginBottom:5 }}>メールアドレス</div>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
              onKeyDown={e => e.key==="Enter" && handle()}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:C.txM, marginBottom:5 }}>パスワード{mode==="register"?" （8文字以上）":""}</div>
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key==="Enter" && handle()}/>
          </div>

          {err && (
            <div style={{ fontSize:12, color:C.red, background:C.rD, border:`1px solid ${C.rB}`, borderRadius:6, padding:"8px 12px", marginBottom:14 }}>
              {err}
            </div>
          )}

          <Btn primary onClick={handle} disabled={loading} style={{ width:"100%", padding:"11px" }}>
            {loading ? "処理中..." : mode==="login" ? "ログイン" : "アカウントを作成"}
          </Btn>

          {mode === "login" && (
            <button onClick={async () => {
              if (!email) { setErr("メールアドレスを入力してください"); return; }
              const { error } = await import("../lib/supabase.js").then(m => m.supabase.auth.resetPasswordForEmail(email));
              if (error) setErr(error.message);
              else alert("パスワードリセットメールを送信しました");
            }} style={{ width:"100%", background:"none", border:"none", color:C.txD, fontSize:12, cursor:"pointer", marginTop:12, padding:"4px" }}>
              パスワードを忘れた場合
            </button>
          )}

          <div style={{ fontSize:11, color:C.txD, textAlign:"center", marginTop:14, lineHeight:1.8, borderTop:`1px solid ${C.b}`, paddingTop:14 }}>
            <strong style={{ color:C.amber }}>Supabase 認証</strong> · データはクラウドDBに保存<br/>
            登録後は複数デバイスからアクセス可能です
          </div>
        </Card>
      </div>
    </div>
  );
}
