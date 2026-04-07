// src/App.jsx
import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { CSS } from "./tokens.js";
import { C } from "./tokens.js";
import { computePeriod } from "./utils.js";
import { DEF_SALES_CSV, DEF_BUDGET_CSV, DEF_COSTS } from "./data/defaults.js";
import { useAppState } from "./hooks/useStorage.js";
import Auth from "./components/Auth.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DataImport from "./pages/DataImport.jsx";
import {
  Dashboard, ProductPL, BudgetComparison, Trend,
  CostClassifier, Journal, PLStatement, BSStatement,
  CFStatement, MonthlyReport, TaxSummary, AIAdvisor,
} from "./pages/index.jsx";

export default function App() {
  const store = useAppState();
  const [tab, setTab] = useState("dashboard");
  const [loc, setLoc] = useState("本社");
  const [period, setPeriod] = useState("2024年4月");
  const [computed, setComputed] = useState(null);
  const [allComputed, setAllComputed] = useState({});
  const [savedMsg, setSavedMsg] = useState("");
  const [sideOpen, setSideOpen] = useState(false);

  // Ensure current location/period exists in store
  const ensurePeriod = useCallback((l, p) => {
    store.setLocations(prev => ({
      ...prev,
      [l]: {
        ...(prev[l] || {}),
        [p]: (prev[l]?.[p]) || {
          salesCSV: DEF_SALES_CSV,
          budgetCSV: DEF_BUDGET_CSV,
          costs: DEF_COSTS,
        },
      },
    }));
  }, []);

  useEffect(() => { ensurePeriod(loc, period); }, [loc, period]);

  // Re-compute whenever locations/loc/period changes
  useEffect(() => {
    const d = store.locations[loc]?.[period] || {};
    const c = computePeriod(
      d.salesCSV || DEF_SALES_CSV,
      d.costs || DEF_COSTS,
      d.budgetCSV || DEF_BUDGET_CSV,
    );
    setComputed(c);
    const ac = {};
    Object.entries(store.locations[loc] || {}).forEach(([p, pd]) => {
      ac[p] = computePeriod(pd.salesCSV || DEF_SALES_CSV, pd.costs || DEF_COSTS, pd.budgetCSV || DEF_BUDGET_CSV);
    });
    setAllComputed(ac);
  }, [store.locations, loc, period]);

  const updatePeriodData = useCallback((field, value) => {
    store.setLocations(prev => ({
      ...prev,
      [loc]: {
        ...prev[loc],
        [period]: { ...(prev[loc]?.[period] || {}), [field]: value },
      },
    }));
  }, [loc, period]);

  const handleCompute = () => {
    const d = store.locations[loc]?.[period] || {};
    const c = computePeriod(d.salesCSV || DEF_SALES_CSV, d.costs || DEF_COSTS, d.budgetCSV || DEF_BUDGET_CSV);
    setComputed(c);
    showSaved("計算完了 ✓");
    setTab("dashboard");
  };

  const showSaved = (msg = "保存しました ✓") => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const handleExcel = () => {
    if (!computed) return;
    const wb = XLSX.utils.book_new();
    const s1 = XLSX.utils.aoa_to_sheet([
      ["管理会計レポート", loc, period],
      [],
      ["売上高", computed.totalRev],
      ["限界利益", computed.totalCM],
      ["限界利益率", computed.cmRate / 100],
      ["固定費", computed.totalFixed],
      ["営業利益", computed.opProfit],
      ["損益分岐点比率", computed.bepRatio / 100],
    ]);
    XLSX.utils.book_append_sheet(wb, s1, "サマリー");
    const prodHdr = ["品目CD","品目名","売上高","変動費","限界利益","限益率","配賦固定費","貢献利益","判定"];
    const prodRows = computed.products.map(p => [p.code,p.name,p.rev,p.varCost,p.cm,p.cmRate/100,p.fixedAlloc,p.contrib,p.status]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([prodHdr,...prodRows]), "品目別採算");
    XLSX.writeFile(wb, `管理会計_${loc}_${period}.xlsx`);
  };

  const prevPeriods = Object.keys(store.locations[loc] || {});
  const prevPeriod = prevPeriods[prevPeriods.indexOf(period) - 1];
  const prevComputed = prevPeriod ? allComputed[prevPeriod] : null;

  const periodData = store.locations[loc]?.[period] || {};

  const TAB_LABELS = {
    dashboard:"ダッシュボード", import:"データ取込（CSV・領収書）", costs:"費目分類設定",
    journal:"仕訳帳", product:"品目別採算", budget:"予算対比", trend:"トレンド",
    pl:"損益計算書（PL）", bs:"貸借対照表（BS）", cf:"CF計算書",
    monthly:"月次比較レポート", tax:"税務サマリー", ai:"AI財務アドバイザー",
  };

  if (!store.currentUser) {
    return <Auth onLogin={email => store.setCurrentUser(email)} />;
  }

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
          tab={tab} setTab={t => { setTab(t); setSideOpen(false); }}
          loc={loc} setLoc={setLoc}
          period={period} setPeriod={setPeriod}
          locations={store.locations} setLocations={store.setLocations}
          user={store.currentUser}
          onLogout={() => store.setCurrentUser(null)}
          computed={computed}
          onExcel={handleExcel}
          savedMsg={savedMsg}
        />
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Topbar */}
        <div className="no-print" style={{ padding:".75rem 1.25rem", borderBottom:`1px solid ${C.b}`, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, background:C.bg, zIndex:10 }}>
          <button onClick={() => setSideOpen(o => !o)} style={{ background:"transparent", border:"none", color:C.txM, fontSize:22, cursor:"pointer", padding:"2px 4px" }}>☰</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:500 }}>{TAB_LABELS[tab]}</div>
            <div style={{ fontSize:11, color:C.txD }}>{loc} · {period}</div>
          </div>
          {computed && (
            <div style={{ display:"flex", gap:8 }} className="hide-sm">
              <button onClick={handleExcel} style={{ background:"transparent", border:`1px solid ${C.bM}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:C.txM, cursor:"pointer" }}>📊 Excel</button>
              <button onClick={() => window.print()} style={{ background:"transparent", border:`1px solid ${C.bM}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:C.txM, cursor:"pointer" }}>🖨</button>
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{ flex:1, padding:"1.25rem", maxWidth:1000, margin:"0 auto", width:"100%" }}>
          {tab==="dashboard" && <Dashboard computed={computed} prevComputed={prevComputed}/>}

          {tab==="import" && (
            <DataImport
              periodData={periodData}
              onUpdate={updatePeriodData}
              onCompute={handleCompute}
              onJournalAdd={entries => store.setJournals(p => [...entries, ...p])}
            />
          )}

          {tab==="costs" && (
            <CostClassifier
              costs={periodData.costs || DEF_COSTS}
              onChange={costs => {
                updatePeriodData("costs", costs);
                showSaved("費目設定を保存しました ✓");
              }}
            />
          )}

          {tab==="journal" && (
            <Journal entries={store.journals} setEntries={store.setJournals}/>
          )}

          {tab==="product" && <ProductPL computed={computed}/>}
          {tab==="budget"  && <BudgetComparison computed={computed}/>}
          {tab==="trend"   && <Trend allComputed={allComputed}/>}

          {tab==="pl" && (
            <PLStatement
              stored={store.plData}
              onSave={d => { store.setPLData(d); showSaved(); }}
            />
          )}

          {tab==="bs" && (
            <BSStatement
              stored={store.bsData}
              onSave={d => { store.setBSData(d); showSaved(); }}
              plNet={store.plData ? (store.plData.売上高 - store.plData.売上原価 - (store.plData.sga||[]).reduce((a,r)=>a+r.v,0) - store.plData.法人税等) : 0}
            />
          )}

          {tab==="cf" && (
            <CFStatement
              stored={store.cfData}
              onSave={d => { store.setCFData(d); showSaved(); }}
            />
          )}

          {tab==="monthly" && (
            <MonthlyReport
              stored={store.monthlyData}
              onSave={d => { store.setMonthlyData(d); showSaved(); }}
            />
          )}

          {tab==="tax" && (
            <TaxSummary
              stored={store.taxData}
              onSave={d => { store.setTaxData(d); showSaved(); }}
            />
          )}

          {tab==="ai" && (
            <AIAdvisor
              computed={computed}
              journals={store.journals}
              period={period}
              loc={loc}
            />
          )}
        </div>
      </div>
    </div>
  );
}
