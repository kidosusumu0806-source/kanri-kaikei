// src/components/AIChat.jsx
import { useState, useRef, useCallback } from "react";
import { C, M } from "../tokens.js";
import { callClaude } from "../utils.js";
import { Btn, Input } from "./Atoms.jsx";

export default function AIChat({ systemPrompt, suggestions = [], placeholder = "質問を入力（Enterで送信）..." }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:"データを読み込みました。何でもご相談ください。" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const nm = [...msgs, { role:"user", content:text }];
    setMsgs(nm); setInput(""); setLoading(true);
    try {
      const reply = await callClaude({ system: systemPrompt, messages: nm.map(m => ({ role:m.role, content:m.content })) });
      setMsgs(p => [...p, { role:"assistant", content:reply }]);
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"通信エラーが発生しました。Vercelの環境変数 ANTHROPIC_API_KEY を確認してください。" }]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    }
  }, [msgs, loading, systemPrompt]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:460 }}>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, paddingRight:4 }}>
        {msgs.map((m,i) => (
          <div key={i} className="fade" style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", alignItems:"flex-start", gap:8 }}>
            {m.role==="assistant" && (
              <div style={{ width:26, height:26, borderRadius:6, background:C.tD, border:`1px solid ${C.tB}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>⚡</div>
            )}
            <div style={{
              maxWidth:"80%", padding:"10px 14px", fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap",
              borderRadius: m.role==="user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
              background: m.role==="user" ? C.tD : C.bgL,
              border: `1px solid ${m.role==="user" ? C.tB : C.b}`,
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:4, padding:"10px 36px" }}>
            {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.teal, animation:`d 1.2s ${i*.2}s infinite` }}/>)}
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{ marginTop:12 }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} style={{ fontSize:11, padding:"3px 9px", borderRadius:20, border:`1px solid ${C.bM}`, background:"transparent", color:C.txM, cursor:"pointer" }}>{s}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send(input)} placeholder={placeholder}/>
          <Btn primary onClick={() => send(input)} disabled={loading || !input.trim()}>送信</Btn>
        </div>
      </div>
      <style>{`@keyframes d{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
