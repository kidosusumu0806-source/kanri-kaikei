// src/lib/db.js
// ─── データアクセス層 ─────────────────────────────────────────
// 全てのSupabase操作をここに集約。
// コンポーネントは直接 supabase を触らず、この関数経由でアクセスする。

import { supabase } from "./supabase.js";

// ─── ユーザー・認証 ──────────────────────────────────────────
export const auth = {
  signUp: ({ email, password, companyName }) =>
    supabase.auth.signUp({
      email, password,
      options: { data: { company_name: companyName } },
    }),

  signIn: ({ email, password }) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

// ─── 組織 ────────────────────────────────────────────────────
export const orgs = {
  // 自分が所属している組織一覧を取得
  getMine: async () => {
    const { data, error } = await supabase
      .from("org_members")
      .select("role, organizations(id, name, plan)")
      .order("created_at");
    if (error) throw error;
    return data.map(r => ({ ...r.organizations, role: r.role }));
  },

  update: async (orgId, updates) => {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // メンバー一覧
  getMembers: async (orgId) => {
    const { data, error } = await supabase
      .from("org_members")
      .select("id, role, created_at, user_id")
      .eq("org_id", orgId);
    if (error) throw error;
    return data;
  },

  // メンバー招待（メールアドレス → ユーザーID解決はSupabase Auth経由）
  inviteMember: async (orgId, email, role = "member") => {
    const { data: { user }, error: invErr } = await supabase.auth.admin.inviteUserByEmail(email);
    if (invErr) throw invErr;
    const { error } = await supabase
      .from("org_members")
      .insert({ org_id: orgId, user_id: user.id, role });
    if (error) throw error;
  },

  removeMember: async (orgId, userId) => {
    const { error } = await supabase
      .from("org_members")
      .delete()
      .eq("org_id", orgId)
      .eq("user_id", userId);
    if (error) throw error;
  },
};

// ─── 拠点 ────────────────────────────────────────────────────
export const locations = {
  list: async (orgId) => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("org_id", orgId)
      .order("sort_order");
    if (error) throw error;
    return data;
  },

  create: async (orgId, name) => {
    const { data, error } = await supabase
      .from("locations")
      .insert({ org_id: orgId, name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── 期間 ────────────────────────────────────────────────────
export const periods = {
  list: async (locationId) => {
    const { data, error } = await supabase
      .from("periods")
      .select("*")
      .eq("location_id", locationId)
      .order("label");
    if (error) throw error;
    return data;
  },

  upsert: async (orgId, locationId, label) => {
    const { data, error } = await supabase
      .from("periods")
      .upsert({ org_id: orgId, location_id: locationId, label }, { onConflict: "location_id,label" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from("periods").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── 期間データ（CSV・費目・採算） ───────────────────────────
export const periodData = {
  get: async (periodId) => {
    const { data, error } = await supabase
      .from("period_data")
      .select("*")
      .eq("period_id", periodId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  upsert: async (periodId, payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("period_data")
      .upsert(
        { period_id: periodId, ...payload, updated_by: user.id },
        { onConflict: "period_id" }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── 仕訳帳 ─────────────────────────────────────────────────
export const journal = {
  list: async (orgId, { limit = 200, offset = 0 } = {}) => {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("org_id", orgId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
  },

  insert: async (orgId, entries) => {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = entries.map(e => ({
      org_id: orgId,
      entry_date: e.date,
      debit: e.debit,
      credit: e.credit,
      amount: e.amount,
      description: e.description,
      ref: e.ref ?? null,
      created_by: user.id,
    }));
    const { data, error } = await supabase
      .from("journal_entries")
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── 財務諸表（PL/BS/CF/月次/税務） ────────────────────────
export const statements = {
  get: async (orgId, type, fiscalYear = new Date().getFullYear()) => {
    const { data, error } = await supabase
      .from("financial_statements")
      .select("*")
      .eq("org_id", orgId)
      .eq("statement_type", type)
      .eq("fiscal_year", fiscalYear)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  upsert: async (orgId, type, stmtData, fiscalYear = new Date().getFullYear()) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("financial_statements")
      .upsert(
        {
          org_id: orgId,
          statement_type: type,
          fiscal_year: fiscalYear,
          data: stmtData,
          updated_by: user.id,
        },
        { onConflict: "org_id,statement_type,fiscal_year" }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── 領収書 ─────────────────────────────────────────────────
export const receipts = {
  // ファイルを Storage にアップロードしてから OCR結果を保存
  upload: async (orgId, file) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${orgId}/${Date.now()}_${file.name}`;

    // Storage upload
    const { error: uploadErr } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: false });
    if (uploadErr) throw uploadErr;

    // Public URL（RLSにより認証済みユーザーのみアクセス可）
    const { data: { publicUrl } } = supabase.storage
      .from("receipts")
      .getPublicUrl(path);

    return { path, publicUrl, userId: user.id };
  },

  saveOCR: async (orgId, receiptData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("receipts")
      .insert({ org_id: orgId, ...receiptData, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  list: async (orgId, limit = 100) => {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
};
