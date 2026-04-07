// src/AppSupabase.jsx
// ─── Supabase版 App ─────────────────────────────────────────
// App.jsx (localStorage版) をそのまま置き換える。
// 使用方法: main.jsx で import App from "./AppSupabase.jsx" に変更する。

import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { C, CSS } from "./tokens.js";
import { computePeriod } from "./utils.js";
import { DEF_SALES_CSV, DEF_BUDGET_CSV, DEF_COSTS } from "./data/defaults.js";
import { useAuth, useAppState } from "./hooks/useSupabase.js";
import AuthSupabase from "./components/AuthSupabase.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DataImport from "./pages/DataImport.jsx";
import {
  Dashboard, ProductPL, BudgetComparison, Trend,
  CostClassifier, Journal, PLStatement, BSStatement,
  CFStatement, MonthlyReport, TaxSummary, AIAdvisor,
} from "./pages/index.jsx";

const TAB_LABELS = {
  dashboard:"ダッシュボード", import:"データ取込（CSV・領収書）", costs:"費目分類設定",
  journal:"仕訳帳", product:"製品別採算", budget:"予算対比", trend:"トレンド",
  pl:"損益計算書（PL）", bs:"貸借対照表（BS）", cf:"CF計算書",
  monthly:"月次比較レポート", tax:"税務サマリー", ai:"AI財務アドバイザー",
};

export default function AppSupabase() {
  const { user, loading: authLoading, signOut } = useAuth();
  const store = useAppState();

  const [tab, setTab] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);

  // 現在の拠点・期間（IDと表示名）
  const [currentLocId, setCurrentLocId] = useState(null);
  const [currentPeriodId, setCurrentPeriodId] = useState(null);
  const [currentLocName, setCurrentLocName] = useState("");
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState("");

  // 採算計算結果
  const [computed, setComputed] = useState(null);
  const [allComputed, setAllComputed] = useState({});

  // ─── 拠点・期間が確定したらデータを読み込む ──────────────
  useEffect(() => {
    if (!store.locationList.length || store.orgLoading) return;

    const firstLoc = store.locationList[0];
    if (!currentLocId) {
      setCurrentLocId(firstLoc.id);
      setCurrentLocName(firstLoc.name);
    }
  }, [store.locationList, store.orgLoading]);

  useEffect(() => {
    if (!currentLocId) return;
    const periods = store.periodMap[currentLocId] || [];
    if (!periods.length) return;

    // 最新期間を選択（なければ最後の要素）
    const latest = periods[periods.length - 1];
    if (!currentPeriodId) {
      setCurrentPeriodId(latest.id);
      setCurrentPeriodLabel(latest.label);
    }
  }, [currentLocId, store.periodMap]);

  // ─── 期間データ読み込み & 計算 ───────────────────────────
  useEffect(() => {
    if (!currentPeriodId) return;
    store.loadPeriodData(currentPeriodId).then(pd => {
      if (!pd) return;
      const c = computePeriod(
        pd.sales_csv || pd.salesCSV || DEF_SALES_CSV,
        pd.costs || DEF_COSTS,
        pd.budget_csv || pd.budgetCSV || DEF_BUDGET_CSV,
      );
      setComputed(c);
    });
  }, [currentPeriodId, store.loadPeriodData]);

  // 全期間の計算（トレンド用）
  useEffect(() => {
    if (!currentLocId) return;
    const periods = store.periodMap[currentLocId] || [];
    const ac = {};
    Promise.all(periods.map(async p => {
      const pd = await store.loadPeriodData(p.id);
      if (pd) {
        ac[p.label] = computePeriod(
          pd.sales_csv || pd.salesCSV || DEF_SALES_CSV,
          pd.costs || DEF_COSTS,
          pd.budget_csv || pd.budgetCSV || DEF_BUDGET_CSV,
        );
      }
    })).then(() => setAllComputed({ ...ac }));
  }, [currentLocId, store.periodMap]);

  // ─── 期間データ更新（CSVや費目）──────────────────────────
  // デバウンス用タイマー（1秒待ってからDB保存）
  const saveTimer = useRef(null);
  const pendingUpdates = useRef({});

  const updatePeriodField = useCallback((field, value) => {
    // ローカルキャッシュに即時反映（画面も即時更新）
    pendingUpdates.current[field] = value;
    store.savePeriodData(currentPeriodId, { [field]: value });
    // 既存タイマーをリセット（DB保存は1秒デバウンス）
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      pendingUpdates.current = {};
    }, 1000);
  }, [currentPeriodId, store.savePeriodData]);

  // ─── 採算計算実行 ─────────────────────────────────────────
  const handleCompute = useCallback(() => {
    // 常に最新のcurrentPDを参照（pendingUpdatesも含める）
    const pd = store.currentPD || {};
    const pending = pendingUpdates.current || {};
    const merged = { ...pd, ...pending };
    const c = computePeriod(
      merged.sales_csv || merged.salesCSV || DEF_SALES_CSV,
      merged.costs || DEF_COSTS,
      merged.budget_csv || merged.budgetCSV || DEF_BUDGET_CSV,
    );
    if (!c) { alert("CSVデータを取り込んでから計算してください"); return; }
    setComputed(c);

    store.showSaved("計算完了 ✓");
    setTab("dashboard");
  }, [store.currentPD, store.statements, pendingUpdates]);

  // ─── 拠点切替 ────────────────────────────────────────────
  const handleLocChange = useCallback((locId) => {
    const loc = store.locationList.find(l => l.id === locId);
    if (!loc) return;
    setCurrentLocId(locId);
    setCurrentLocName(loc.name);
    setCurrentPeriodId(null); // 期間リセット → useEffect で再選択
  }, [store.locationList]);

  // ─── 期間切替 ────────────────────────────────────────────
  const handlePeriodChange = useCallback((periodId) => {
    const periods = store.periodMap[currentLocId] || [];
    const p = periods.find(x => x.id === periodId);
    if (!p) return;
    setCurrentPeriodId(periodId);
    setCurrentPeriodLabel(p.label);
  }, [currentLocId, store.periodMap]);

  // ─── 拠点追加 ────────────────────────────────────────────
  const handleAddLocation = useCallback(async () => {
    const name = prompt("拠点・事業部名を入力");
    if (!name) return;
    const loc = await store.addLocation(name);
    if (loc) { handleLocChange(loc.id); }
  }, [store.addLocation, handleLocChange]);

  // ─── 期間追加 ────────────────────────────────────────────
  const handleAddPeriod = useCallback(async () => {
    const label = prompt("期間を入力（例：2024年5月）");
    if (!label || !currentLocId) return;
    const p = await store.addPeriod(currentLocId, label);
    if (p) { handlePeriodChange(p.id); }
  }, [currentLocId, store.addPeriod, handlePeriodChange]);

  // ─── Excel出力 ───────────────────────────────────────────
  const handleExcel = useCallback(() => {
    if (!computed) return;
    const wb = XLSX.utils.book_new();
    const s1 = XLSX.utils.aoa_to_sheet([
      ["管理会計レポート", currentLocName, currentPeriodLabel],
      [],
      ["売上高", computed.totalRev],
      ["限界利益", computed.totalCM],
      ["限界利益率", computed.cmRate / 100],
      ["固定費", computed.totalFixed],
      ["営業利益", computed.opProfit],
      ["損益分岐点比率", computed.bepRatio / 100],
    ]);
    XLSX.utils.book_append_sheet(wb, s1, "サマリー");
    const prodHdr = ["製品CD","製品名","売上高","変動費","限界利益","限益率","配賦固定費","貢献利益","判定"];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      prodHdr,
      ...computed.products.map(p => [p.code,p.name,p.rev,p.varCost,p.cm,p.cmRate/100,p.fixedAlloc,p.contrib,p.status]),
    ]), "製品別採算");
    XLSX.writeFile(wb, `管理会計_${currentLocName}_${currentPeriodLabel}.xlsx`);
  }, [computed, currentLocName, currentPeriodLabel]);

  // ─── ローディング中 ──────────────────────────────────────
  if (authLoading || store.orgLoading) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <style>{CSS}</style>
        <div style={{ width:40, height:40, background:C.teal, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚡</div>
        <div style={{ fontSize:13, color:C.txD }}>読み込み中...</div>
      </div>
    );
  }

  // ─── 未認証 ──────────────────────────────────────────────
  if (!user) {
    return <AuthSupabase onLogin={() => {}} />;
  }

  // ─── Sidebar用のlocations/periodsをマッピング ────────────
  // Sidebar は { locName: { periodLabel: {} } } 構造を期待しているので変換
  const sidebarLocations = {};
  store.locationList.forEach(loc => {
    sidebarLocations[loc.id] = {};
    (store.periodMap[loc.id] || []).forEach(p => {
      sidebarLocations[loc.id][p.id] = {};
    });
  });

  const periodData = store.currentPD || {};

  const prevPeriods = store.periodMap[currentLocId] || [];
  const prevIdx = prevPeriods.findIndex(p => p.id === currentPeriodId) - 1;
  const prevPeriodId = prevIdx >= 0 ? prevPeriods[prevIdx]?.id : null;
  const prevComputed = prevPeriodId ? allComputed[prevPeriods[prevIdx]?.label] : null;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{CSS}</style>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="no-print" onClick={() => setSideOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:299 }}/>
      )}

      {/* Sidebar */}
      <div className={`sidebar no-print${sideOpen?" open":""}`}>
        <Sidebar
          tab={tab}
          setTab={t => { setTab(t); setSideOpen(false); }}
          loc={currentLocName}
          setLoc={name => {
            const loc = store.locationList.find(l => l.name === name);
            if (loc) handleLocChange(loc.id);
          }}
          period={currentPeriodLabel}
          setPeriod={label => {
            const periods = store.periodMap[currentLocId] || [];
            const p = periods.find(x => x.label === label);
            if (p) handlePeriodChange(p.id);
          }}
          // Sidebar はname/labelで動作するので変換
          locations={Object.fromEntries(
            store.locationList.map(loc => [
              loc.name,
              Object.fromEntries((store.periodMap[loc.id] || []).map(p => [p.label, {}]))
            ])
          )}
          setLocations={() => {}} // Supabase版では直接呼ばない
          user={user?.email}
          onLogout={signOut}
          computed={computed}
          onExcel={handleExcel}
          savedMsg={store.savedMsg}
          onAddLocation={handleAddLocation}
          onAddPeriod={handleAddPeriod}
        />
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Topbar */}
        <div className="no-print" style={{ padding:".75rem 1.25rem", borderBottom:`1px solid ${C.b}`, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, background:C.bg, zIndex:10 }}>
          <button onClick={() => setSideOpen(o => !o)} style={{ background:"transparent", border:"none", color:C.txM, fontSize:22, cursor:"pointer", padding:"2px 4px" }}>☰</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:500 }}>{TAB_LABELS[tab]}</div>
            <div style={{ fontSize:11, color:C.txD }}>{currentLocName} · {currentPeriodLabel}</div>
          </div>
          {store.saving && <div style={{ fontSize:11, color:C.amber }}>保存中...</div>}
          {store.savedMsg && <div style={{ fontSize:11, color:C.teal }}>{store.savedMsg}</div>}
          {computed && (
            <div style={{ display:"flex", gap:8 }} className="hide-sm">
              <button onClick={handleExcel} style={{ background:"transparent", border:`1px solid ${C.bM}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:C.txM, cursor:"pointer" }}>📊 Excel</button>
              <button onClick={() => window.print()} style={{ background:"transparent", border:`1px solid ${C.bM}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:C.txM, cursor:"pointer" }}>🖨</button>
            </div>
          )}
        </div>

        {/* 計算実行ボタン（常時表示） */}
        <div className="no-print" style={{ background:"#0F1F38", borderBottom:"1px solid rgba(148,196,255,0.08)", padding:"8px 20px", display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10 }}>
          <span style={{ fontSize:12, color:"rgba(232,240,255,0.4)" }}>
            CSV・費目・OCRを取り込んだら：
          </span>
          <button onClick={handleCompute} style={{
            background:"#00D4A8", color:"#0B1628", border:"none", borderRadius:8,
            padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
          }}>
            ▶ 採算計算を実行する
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:"1.25rem", maxWidth:1000, margin:"0 auto", width:"100%" }}>

          {tab==="dashboard" && <Dashboard computed={computed} prevComputed={prevComputed}/>}

          {tab==="import" && (
            <DataImport
              periodData={{
                salesCSV: periodData.sales_csv || periodData.salesCSV || "",
                budgetCSV: periodData.budget_csv || periodData.budgetCSV || "",
                costs: periodData.costs || [],
              }}
              onUpdate={(field, value) => {
                const dbField = field === "salesCSV" ? "sales_csv" : field === "budgetCSV" ? "budget_csv" : field;
                updatePeriodField(dbField, value);
              }}
              onCompute={handleCompute}
              onJournalAdd={store.addJournalEntries}
              onCostsUpdate={(costs) => updatePeriodField("costs", costs)}
            />
          )}

          {tab==="costs" && (
            <CostClassifier
              costs={periodData.costs || DEF_COSTS}
              onChange={costs => updatePeriodField("costs", costs)}
              journals={store.journals}
            />
          )}

          {tab==="journal" && (
            <Journal
              entries={store.journals}
              setEntries={async (updater) => {
                const updated = updater(store.journals);
                const removed = store.journals.filter(e => !updated.find(u => u.id === e.id));
                await Promise.all(removed.map(e => store.deleteJournalEntry(e.id)));
              }}
              onSyncToCosts={(costs) => updatePeriodField("costs", costs)}
              currentCosts={periodData.costs || DEF_COSTS}
            />
          )}

          {tab==="journal" && (
            <Journal
              entries={store.journals}
              setEntries={async (updater) => {
                if (typeof updater === "function") {
                  // 削除操作の場合
                  const updated = updater(store.journals);
                  const removed = store.journals.filter(e => !updated.find(u => u.id === e.id));
                  await Promise.all(removed.map(e => store.deleteJournalEntry(e.id)));
                }
              }}
            />
          )}

          {tab==="product"   && <ProductPL computed={computed}/>}
          {tab==="budget"    && <BudgetComparison computed={computed}/>}
          {tab==="trend"     && <Trend allComputed={allComputed}/>}

          {tab==="pl" && (
            <PLStatement
              stored={store.statements.pl}
              onSave={d => store.saveStatement("pl", d)}
              computed={computed}
              costs={store.currentPD?.costs || DEF_COSTS}
            />
          )}

          {tab==="bs" && (
            <BSStatement
              stored={store.statements.bs}
              onSave={d => store.saveStatement("bs", d)}
              plNet={store.statements.pl
                ? (store.statements.pl.売上高 - store.statements.pl.売上原価
                   - (store.statements.pl.sga||[]).reduce((a,r)=>a+r.v,0)
                   - store.statements.pl.法人税等)
                : 0}
            />
          )}

          {tab==="cf" && (
            <CFStatement
              stored={store.statements.cf}
              onSave={d => store.saveStatement("cf", d)}
            />
          )}

          {tab==="monthly" && (
            <MonthlyReport
              stored={store.statements.monthly}
              onSave={d => store.saveStatement("monthly", d)}
            />
          )}

          {tab==="tax" && (
            <TaxSummary
              stored={store.statements.tax}
              onSave={d => store.saveStatement("tax", d)}
            />
          )}

          {tab==="ai" && (
            <AIAdvisor
              computed={computed}
              
              period={currentPeriodLabel}
              loc={currentLocName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
