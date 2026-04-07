// src/hooks/useSupabase.js
// ─── Supabase データフック ─────────────────────────────────────
// useStorage.js（localStorage版）の Supabase 置き換え。
// 同じインターフェースを維持してあるので App.jsx の変更を最小化。

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { orgs, locations as locDB, periods as perDB, periodData as pdDB, journal as jDB, statements as stDB } from "../lib/db.js";
import { DEF_SALES_CSV, DEF_BUDGET_CSV, DEF_COSTS } from "../data/defaults.js";

// ─── Auth hook ───────────────────────────────────────────────
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async ({ email, password, companyName }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { company_name: companyName } },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { session, loading, user: session?.user ?? null, signUp, signIn, signOut };
}

// ─── Main app state hook (Supabase版) ────────────────────────
export function useAppState() {
  const { user } = useAuth();

  // ── ORG ──────────────────────────────────────────────────────
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);

  // ── LOCATIONS ────────────────────────────────────────────────
  const [locationList, setLocationList] = useState([]);   // [{id,name}]

  // ── PERIODS ──────────────────────────────────────────────────
  // { locationId: [{id, label}] }
  const [periodMap, setPeriodMap] = useState({});

  // ── PERIOD DATA ──────────────────────────────────────────────
  // キャッシュ: { periodId: {salesCSV, budgetCSV, costs} }
  const pdCache = useRef({});
  const [currentPD, setCurrentPD] = useState(null);

  // ── JOURNALS ─────────────────────────────────────────────────
  const [journals, setJournals] = useState([]);

  // ── STATEMENTS ───────────────────────────────────────────────
  const [statements, setStatements] = useState({ pl:null, bs:null, cf:null, monthly:null, tax:null });

  // ── SAVE STATUS ──────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const showSaved = (msg = "保存しました ✓") => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2500);
  };

  // ─── 初期ロード ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setOrgLoading(false); return; }
    (async () => {
      try {
        const myOrgs = await orgs.getMine();
        if (!myOrgs.length) { setOrgLoading(false); return; }
        const o = myOrgs[0];
        setOrg(o);

        const locs = await locDB.list(o.id);
        setLocationList(locs);

        // 各拠点の期間を取得
        const pm = {};
        await Promise.all(locs.map(async loc => {
          pm[loc.id] = await perDB.list(loc.id);
        }));
        setPeriodMap(pm);

        // 仕訳帳
        const je = await jDB.list(o.id);
        setJournals(je.map(e => ({
          id: e.id, date: e.entry_date, debit: e.debit, credit: e.credit,
          amount: e.amount, description: e.description, ref: e.ref,
        })));

        // 財務諸表
        const year = new Date().getFullYear();
        const types = ["pl","bs","cf","monthly","tax"];
        const loaded = {};
        await Promise.all(types.map(async t => {
          const s = await stDB.get(o.id, t, year);
          loaded[t] = s?.data ?? null;
        }));
        setStatements(loaded);

      } catch (e) {
        console.error("初期ロードエラー:", e);
      } finally {
        setOrgLoading(false);
      }
    })();
  }, [user]);

  // ─── 期間データ取得 ──────────────────────────────────────────
  const loadPeriodData = useCallback(async (periodId) => {
    if (!periodId) return;
    if (pdCache.current[periodId]) {
      setCurrentPD(pdCache.current[periodId]);
      return pdCache.current[periodId];
    }
    const d = await pdDB.get(periodId);
    const pd = d ?? {
      salesCSV: DEF_SALES_CSV,
      budgetCSV: DEF_BUDGET_CSV,
      costs: DEF_COSTS,
    };
    pdCache.current[periodId] = pd;
    setCurrentPD(pd);
    return pd;
  }, []);

  // ─── 期間データ保存 ──────────────────────────────────────────
  const savePeriodData = useCallback(async (periodId, updates) => {
    if (!periodId) return;
    setSaving(true);
    try {
      const current = pdCache.current[periodId] ?? {};
      const merged = { ...current, ...updates };
      await pdDB.upsert(periodId, {
        sales_csv: merged.salesCSV ?? merged.sales_csv,
        budget_csv: merged.budgetCSV ?? merged.budget_csv,
        costs: merged.costs,
      });
      pdCache.current[periodId] = merged;
      setCurrentPD(merged);
      showSaved();
    } catch (e) {
      console.error("保存エラー:", e);
      setSavedMsg("保存に失敗しました");
      setTimeout(() => setSavedMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── 拠点追加 ─────────────────────────────────────────────────
  const addLocation = useCallback(async (name) => {
    if (!org) return;
    try {
      const loc = await locDB.create(org.id, name);
      setLocationList(p => [...p, loc]);
      setPeriodMap(p => ({ ...p, [loc.id]: [] }));
      return loc;
    } catch (e) { console.error(e); }
  }, [org]);

  // ─── 期間追加 ─────────────────────────────────────────────────
  const addPeriod = useCallback(async (locationId, label) => {
    if (!org) return;
    try {
      const p = await perDB.upsert(org.id, locationId, label);
      setPeriodMap(prev => ({
        ...prev,
        [locationId]: [...(prev[locationId] || []), p].sort((a,b) => a.label.localeCompare(b.label)),
      }));
      return p;
    } catch (e) { console.error(e); }
  }, [org]);

  // ─── 仕訳追加 ────────────────────────────────────────────────
  const addJournalEntries = useCallback(async (entries) => {
    if (!org) return;
    try {
      const saved = await jDB.insert(org.id, entries);
      const mapped = saved.map(e => ({
        id: e.id, date: e.entry_date, debit: e.debit, credit: e.credit,
        amount: e.amount, description: e.description, ref: e.ref,
      }));
      setJournals(p => [...mapped, ...p]);
    } catch (e) { console.error(e); }
  }, [org]);

  const deleteJournalEntry = useCallback(async (id) => {
    try {
      await jDB.delete(id);
      setJournals(p => p.filter(e => e.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  // ─── 財務諸表保存 ────────────────────────────────────────────
  const saveStatement = useCallback(async (type, data) => {
    if (!org) return;
    setSaving(true);
    try {
      await stDB.upsert(org.id, type, data);
      setStatements(p => ({ ...p, [type]: data }));
      showSaved();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }, [org]);

  return {
    // auth
    user,
    org,
    orgLoading,
    // data
    locationList,
    periodMap,
    currentPD,
    journals,
    statements,
    // actions
    loadPeriodData,
    savePeriodData,
    addLocation,
    addPeriod,
    addJournalEntries,
    deleteJournalEntry,
    saveStatement,
    // ui state
    saving,
    savedMsg,
    showSaved,
  };
}
