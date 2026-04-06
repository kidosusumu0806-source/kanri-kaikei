// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です。" +
    ".env.local を確認してください。"
  );
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
