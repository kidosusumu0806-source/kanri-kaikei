// src/data/defaults.js
export const DEF_SALES_CSV = `品目CD,品目名,売上高,変動費,直接労務費
A001,サービスA,18500000,8300000,1900000
A002,サービスB,16200000,9800000,1000000
A003,サービスC,8800000,6900000,700000
A004,サービスD,4700000,1600000,150000`;

export const DEF_BUDGET_CSV = `品目CD,予算売上高,予算変動費率
A001,18000000,54
A002,16000000,67
A003,9000000,85
A004,4500000,37`;

export const DEF_COSTS = [
  { 費目: "人件費（管理）", 金額: 7200000, _type: "固定費", 固定率: 100 },
  { 費目: "減価償却費",     金額: 2100000, _type: "固定費", 固定率: 100 },
  { 費目: "地代家賃",       金額: 1800000, _type: "固定費", 固定率: 100 },
  { 費目: "水道光熱費",     金額: 950000,  _type: "準変動費", 固定率: 60 },
  { 費目: "消耗品費",       金額: 420000,  _type: "変動費", 固定率: 0 },
  { 費目: "旅費交通費",     金額: 280000,  _type: "準変動費", 固定率: 30 },
  { 費目: "その他管理費",   金額: 380000,  _type: "固定費", 固定率: 100 },
];

export const DEF_MONTHLY = [
  { month:"1月", sales:42100000, cogs:26500000, sga:12500000 },
  { month:"2月", sales:43500000, cogs:27000000, sga:12600000 },
  { month:"3月", sales:45800000, cogs:28200000, sga:12800000 },
  { month:"4月", sales:48200000, cogs:29700000, sga:13050000 },
];

export const DEF_BS = {
  assets: {
    current: { 現金及び預金:12500000, 売掛金:8300000, 棚卸資産:4200000, その他流動資産:1100000 },
    fixed:   { 建物:15000000, 機械装置:8000000, 土地:12000000, その他固定資産:2500000 },
  },
  liabilities: {
    current:  { 買掛金:5200000, 短期借入金:3000000, 未払費用:1800000, その他流動負債:900000 },
    longterm: { 長期借入金:12000000, 退職給付引当金:2500000, その他固定負債:500000 },
  },
  equity: { 資本金:10000000, 資本剰余金:5000000, 利益剰余金:21700000 },
};

export const DEF_CF = {
  operating: {
    pretax:    { label:"税引前当期純利益", value:5000000 },
    dep:       { label:"減価償却費（加算）", value:2100000 },
    provision: { label:"引当金増減", value:150000 },
    receivable:{ label:"売上債権の増減", value:-800000 },
    inventory: { label:"棚卸資産の増減", value:300000 },
    payable:   { label:"仕入債務の増減", value:500000 },
    tax_paid:  { label:"法人税等の支払い", value:-1450000 },
    other_op:  { label:"その他", value:-200000 },
  },
  investing: {
    capex:      { label:"有形固定資産の取得", value:-3500000 },
    asset_sale: { label:"有形固定資産の売却", value:200000 },
    invest_buy: { label:"投資有価証券の取得", value:-500000 },
    other_inv:  { label:"その他", value:-100000 },
  },
  financing: {
    borrow:   { label:"借入金の増加", value:2000000 },
    repay:    { label:"借入金の返済", value:-1800000 },
    dividend: { label:"配当金の支払い", value:0 },
    other_fin:{ label:"その他", value:0 },
  },
  opening_cash: 8500000,
};

export const DEF_TAX = {
  pretax_income: 5000000,
  add_back: {
    entertainment: { label:"交際費の損金不算入額", value:80000 },
    depreciation:  { label:"減価償却超過額", value:0 },
    penalty:       { label:"罰課金・加算税", value:0 },
  },
  deductions: {
    dividend:   { label:"受取配当等の益金不算入", value:0 },
    carry_loss: { label:"繰越欠損金の控除", value:0 },
  },
  taxable_sales:   48200000,
  taxable_purchase:38750000,
  tax_rate_sales:  10,
  tax_rate_purchase:10,
  prev_credit:     0,
  corp_tax_rate:   23.2,
  local_tax_rate:  7.0,
  biz_tax_rate:    3.5,
};

export const ACCOUNTS = [
  "現金","預金","売掛金","棚卸資産","建物","機械装置","土地",
  "買掛金","借入金","資本金","売上高","売上原価",
  "給料手当","地代家賃","減価償却費","水道光熱費","消耗品費",
  "旅費交通費","広告宣伝費","支払利息","法人税等","その他費用","その他収益",
];
