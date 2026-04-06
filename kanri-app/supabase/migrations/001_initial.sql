-- ============================================================
-- 管理会計ダッシュボード — Supabase スキーマ
-- supabase/migrations/001_initial.sql
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. organizations（テナント）
--    1社 = 1 organization。マルチテナントの単位。
-- ============================================================
create table public.organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  plan        text not null default 'starter'
                check (plan in ('starter','standard','pro')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── org_members（ユーザーと組織の紐付け）──────────────────
create table public.org_members (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member'
                 check (role in ('owner','admin','member')),
  created_at   timestamptz not null default now(),
  unique(org_id, user_id)
);

-- ============================================================
-- 2. locations（拠点・事業部）
-- ============================================================
create table public.locations (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique(org_id, name)
);

-- ============================================================
-- 3. periods（会計期間）
-- ============================================================
create table public.periods (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  location_id  uuid not null references public.locations(id) on delete cascade,
  label        text not null,               -- "2024年4月"
  fiscal_year  int,
  month        int,
  created_at   timestamptz not null default now(),
  unique(location_id, label)
);

-- ============================================================
-- 4. period_data（CSV・費目・計算結果）
--    1 period = 1 row。jsonb で柔軟に保存。
-- ============================================================
create table public.period_data (
  id          uuid primary key default uuid_generate_v4(),
  period_id   uuid not null references public.periods(id) on delete cascade unique,
  sales_csv   text,           -- 売上・変動費CSV
  budget_csv  text,           -- 予算CSV
  costs       jsonb,          -- 費目分類配列 [{費目,金額,_type,固定率}]
  computed    jsonb,          -- キャッシュ済み採算計算結果
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

-- ============================================================
-- 5. journal_entries（仕訳帳）
-- ============================================================
create table public.journal_entries (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  entry_date   date not null,
  debit        text not null,
  credit       text not null,
  amount       numeric(15,0) not null check (amount >= 0),
  description  text,
  ref          text,           -- 領収書ファイル名など
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

-- ============================================================
-- 6. financial_statements（PL・BS・CF・月次・税務）
--    statement_type ごとに1レコード。jsonb で保存。
-- ============================================================
create table public.financial_statements (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  statement_type  text not null
                    check (statement_type in ('pl','bs','cf','monthly','tax')),
  fiscal_year     int,
  data            jsonb not null default '{}',
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id),
  unique(org_id, statement_type, fiscal_year)
);

-- ============================================================
-- 7. receipts（領収書OCR結果）
-- ============================================================
create table public.receipts (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  file_name    text,
  file_url     text,           -- Supabase Storage URL
  receipt_date date,
  vendor       text,
  amount       numeric(15,0),
  content      text,
  category     text,
  tax_amount   numeric(15,0),
  raw_ocr      jsonb,          -- Claude OCR生結果
  journal_id   uuid references public.journal_entries(id),
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

-- ============================================================
-- Helper: updated_at 自動更新トリガー
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger trg_period_data_updated_at
  before update on public.period_data
  for each row execute function public.set_updated_at();

create trigger trg_financial_statements_updated_at
  before update on public.financial_statements
  for each row execute function public.set_updated_at();

-- ============================================================
-- 8. Row Level Security (RLS)
--    org_members に所属しているユーザーのみ操作可能
-- ============================================================

-- Helper function: ユーザーが org に属しているか確認
create or replace function public.user_in_org(org uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.org_members
    where org_id = org and user_id = auth.uid()
  );
$$;

-- Helper function: ユーザーが org の owner/admin か確認
create or replace function public.user_is_admin(org uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.org_members
    where org_id = org and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

-- organizations
alter table public.organizations enable row level security;
create policy "org: members can read"
  on public.organizations for select
  using (public.user_in_org(id));
create policy "org: admins can update"
  on public.organizations for update
  using (public.user_is_admin(id));

-- org_members
alter table public.org_members enable row level security;
create policy "members: members can read own org"
  on public.org_members for select
  using (public.user_in_org(org_id));
create policy "members: admins can insert"
  on public.org_members for insert
  with check (public.user_is_admin(org_id));
create policy "members: admins can delete"
  on public.org_members for delete
  using (public.user_is_admin(org_id));

-- locations
alter table public.locations enable row level security;
create policy "locations: members can read"
  on public.locations for select using (public.user_in_org(org_id));
create policy "locations: members can insert"
  on public.locations for insert with check (public.user_in_org(org_id));
create policy "locations: admins can delete"
  on public.locations for delete using (public.user_is_admin(org_id));

-- periods
alter table public.periods enable row level security;
create policy "periods: members can read"
  on public.periods for select using (public.user_in_org(org_id));
create policy "periods: members can insert"
  on public.periods for insert with check (public.user_in_org(org_id));
create policy "periods: members can delete"
  on public.periods for delete using (public.user_in_org(org_id));

-- period_data
alter table public.period_data enable row level security;
create policy "period_data: members can read"
  on public.period_data for select
  using (exists (
    select 1 from public.periods p
    where p.id = period_id and public.user_in_org(p.org_id)
  ));
create policy "period_data: members can upsert"
  on public.period_data for insert
  with check (exists (
    select 1 from public.periods p
    where p.id = period_id and public.user_in_org(p.org_id)
  ));
create policy "period_data: members can update"
  on public.period_data for update
  using (exists (
    select 1 from public.periods p
    where p.id = period_id and public.user_in_org(p.org_id)
  ));

-- journal_entries
alter table public.journal_entries enable row level security;
create policy "journal: members can read"
  on public.journal_entries for select using (public.user_in_org(org_id));
create policy "journal: members can insert"
  on public.journal_entries for insert with check (public.user_in_org(org_id));
create policy "journal: members can delete own"
  on public.journal_entries for delete
  using (public.user_in_org(org_id) and created_by = auth.uid());

-- financial_statements
alter table public.financial_statements enable row level security;
create policy "fs: members can read"
  on public.financial_statements for select using (public.user_in_org(org_id));
create policy "fs: members can upsert"
  on public.financial_statements for insert
  with check (public.user_in_org(org_id));
create policy "fs: members can update"
  on public.financial_statements for update
  using (public.user_in_org(org_id));

-- receipts
alter table public.receipts enable row level security;
create policy "receipts: members can read"
  on public.receipts for select using (public.user_in_org(org_id));
create policy "receipts: members can insert"
  on public.receipts for insert with check (public.user_in_org(org_id));
create policy "receipts: members can delete own"
  on public.receipts for delete
  using (public.user_in_org(org_id) and created_by = auth.uid());

-- ============================================================
-- 9. 初回サインアップ時: org + member を自動作成
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_org_id uuid;
begin
  -- デフォルト組織を作成
  insert into public.organizations(name, plan)
  values (coalesce(new.raw_user_meta_data->>'company_name', new.email || ' の組織'), 'starter')
  returning id into new_org_id;

  -- ownerとして紐付け
  insert into public.org_members(org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- デフォルト拠点を作成
  insert into public.locations(org_id, name, sort_order)
  values (new_org_id, '本社', 0);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 10. Indexes（パフォーマンス）
-- ============================================================
create index idx_org_members_user_id on public.org_members(user_id);
create index idx_org_members_org_id  on public.org_members(org_id);
create index idx_locations_org_id    on public.locations(org_id);
create index idx_periods_location_id on public.periods(location_id);
create index idx_periods_org_id      on public.periods(org_id);
create index idx_journal_org_id      on public.journal_entries(org_id);
create index idx_journal_date        on public.journal_entries(entry_date);
create index idx_fs_org_type         on public.financial_statements(org_id, statement_type);
create index idx_receipts_org_id     on public.receipts(org_id);
