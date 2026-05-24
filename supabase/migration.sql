-- WarungNeng Supabase Migration
-- Run this SQL in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS (stok barang, gas, pulsa)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lainnya',
  unit TEXT NOT NULL DEFAULT 'pcs',
  stock NUMERIC NOT NULL DEFAULT 0,
  target_stock NUMERIC NOT NULL DEFAULT 10,
  restock_limit NUMERIC NOT NULL DEFAULT 3,
  buy_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALES (transaksi jual)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALE_ITEMS (detail barang terjual)
-- ============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  buy_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESTOCKS (transaksi restock/belanja)
-- ============================================
CREATE TABLE IF NOT EXISTS restocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_cost NUMERIC NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESTOCK_ITEMS (detail barang direstock)
-- ============================================
CREATE TABLE IF NOT EXISTS restock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restock_id UUID REFERENCES restocks(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  buy_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY_REPORTS (laporan harian)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL UNIQUE,
  omzet NUMERIC NOT NULL DEFAULT 0,
  modal_terjual NUMERIC NOT NULL DEFAULT 0,
  profit_kotor NUMERIC NOT NULL DEFAULT 0,
  restock_budget NUMERIC NOT NULL DEFAULT 0,
  tabungan NUMERIC NOT NULL DEFAULT 0,
  growth NUMERIC NOT NULL DEFAULT 0,
  kas_kecil NUMERIC NOT NULL DEFAULT 0,
  total_restock_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PULSA_TRANSACTIONS (transaksi pulsa/PPOB)
-- ============================================
CREATE TABLE IF NOT EXISTS pulsa_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'sell')),
  amount NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  balance_after NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) - Disabled for now (no auth)
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulsa_transactions ENABLE ROW LEVEL SECURITY;

-- Allow public access (no auth)
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on restocks" ON restocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on restock_items" ON restock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pulsa_transactions" ON pulsa_transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_restocks_created ON restocks(created_at);
CREATE INDEX IF NOT EXISTS idx_restock_items_restock ON restock_items(restock_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_pulsa_transactions_created ON pulsa_transactions(created_at);
