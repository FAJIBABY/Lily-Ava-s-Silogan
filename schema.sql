CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,                -- UTC
  status TEXT NOT NULL DEFAULT 'new',      -- new | preparing | ready | completed | cancelled
  status_updated_at TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  order_type TEXT NOT NULL,                -- Pickup | Delivery
  area TEXT,
  address TEXT,
  pay_method TEXT NOT NULL,                -- cash | gcash
  gcash_ref TEXT,
  notes TEXT,
  items_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  scheduled_for TEXT,                      -- Manila local 'YYYY-MM-DD HH:MM' or NULL for ASAP
  scheduled_label TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
