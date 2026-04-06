-- supabase/migrations/003_stripe.sql
-- ─── Stripe 連携フィールドを organizations に追加 ─────────────

alter table public.organizations
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists plan_expires_at        timestamptz;

-- プランごとの制限値を参照するビュー
create or replace view public.plan_limits as
select
  'starter'  as plan, 1  as max_locations, 3  as max_products, 5   as max_ai_calls_per_month, false as excel_export,  false as multi_user  union all
select
  'standard' as plan, 10 as max_locations, 50 as max_products, 999 as max_ai_calls_per_month, true  as excel_export,  true  as multi_user  union all
select
  'pro'      as plan, 99 as max_locations, 999 as max_products,9999 as max_ai_calls_per_month, true  as excel_export,  true  as multi_user;

-- 現在の組織のプランと制限を取得するヘルパー関数
create or replace function public.get_org_plan_limits(org uuid)
returns table(
  plan                   text,
  max_locations          int,
  max_products           int,
  max_ai_calls_per_month int,
  excel_export           boolean,
  multi_user             boolean,
  is_active              boolean
) language sql security definer stable as $$
  select
    o.plan,
    pl.max_locations,
    pl.max_products,
    pl.max_ai_calls_per_month,
    pl.excel_export,
    pl.multi_user,
    (o.plan = 'starter' or o.plan_expires_at > now()) as is_active
  from public.organizations o
  join public.plan_limits pl on pl.plan = o.plan
  where o.id = org;
$$;
