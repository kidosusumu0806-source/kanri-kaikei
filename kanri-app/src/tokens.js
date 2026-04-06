// src/tokens.js
export const C = {
  bg:"#0B1628",bgM:"#111F35",bgL:"#172640",bgLL:"#1D2F4A",
  b:"rgba(148,196,255,0.08)",bM:"rgba(148,196,255,0.14)",bH:"rgba(148,196,255,0.24)",
  teal:"#00D4A8",tD:"rgba(0,212,168,0.11)",tB:"rgba(0,212,168,0.28)",
  amber:"#F5A623",aD:"rgba(245,166,35,0.11)",aB:"rgba(245,166,35,0.28)",
  red:"#FF6B6B",rD:"rgba(255,107,107,0.11)",rB:"rgba(255,107,107,0.28)",
  blue:"#5B9EFF",blD:"rgba(91,158,255,0.11)",blB:"rgba(91,158,255,0.28)",
  purple:"#A78BFA",green:"#4ADE80",
  tx:"#E8F0FF",txM:"rgba(232,240,255,0.58)",txD:"rgba(232,240,255,0.30)",
};
export const F = `'Noto Sans JP',sans-serif`;
export const M = `'DM Mono',monospace`;

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Noto+Sans+JP:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{font-family:${F};background:${C.bg};color:${C.tx};font-size:14px;line-height:1.6}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:${C.bM};border-radius:2px}
::-webkit-scrollbar-track{background:transparent}
.mono{font-family:${M}}
.fade{animation:fd .3s ease}
@keyframes fd{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
input,select,textarea,button{font-family:${F}}
textarea{resize:vertical}
.hr:hover{background:${C.bgLL}!important}
@media(max-width:720px){
  .g4{grid-template-columns:1fr 1fr!important}
  .g2{grid-template-columns:1fr!important}
  .g3{grid-template-columns:1fr!important}
  .hide-sm{display:none!important}
}
@media print{
  .no-print{display:none!important}
  body{background:#fff;color:#111;font-size:11px}
  .pc{background:#fff!important;border:1px solid #ddd!important;break-inside:avoid}
  .pb{page-break-before:always}
}`;
