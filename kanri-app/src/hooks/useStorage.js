// src/hooks/useStorage.js
import { useState, useCallback } from "react";

export function useStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const v = typeof value === "function" ? value(state) : value;
      setState(v);
      localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [key, state]);

  return [state, setValue];
}

export function useAppState() {
  const [locations, setLocations] = useStorage("kk_locations_v4", {
    本社: {
      "2024年4月": { salesCSV: null, budgetCSV: null, costs: null },
    },
  });
  const [currentUser, setCurrentUser] = useStorage("kk_user", null);
  const [journals, setJournals] = useStorage("kk_journals", []);
  const [plData, setPLData] = useStorage("kk_pl", null);
  const [bsData, setBSData] = useStorage("kk_bs", null);
  const [cfData, setCFData] = useStorage("kk_cf", null);
  const [monthlyData, setMonthlyData] = useStorage("kk_monthly", null);
  const [taxData, setTaxData] = useStorage("kk_tax", null);

  return {
    locations, setLocations,
    currentUser, setCurrentUser,
    journals, setJournals,
    plData, setPLData,
    bsData, setBSData,
    cfData, setCFData,
    monthlyData, setMonthlyData,
    taxData, setTaxData,
  };
}
