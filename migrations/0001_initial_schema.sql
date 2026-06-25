CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  city TEXT,
  whatsapp TEXT,
  telegram TEXT,
  instagram TEXT,
  logo_url TEXT,
  cover_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  category_id TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price INTEGER,
  old_price INTEGER,
  currency TEXT DEFAULT 'KZT',
  colors TEXT,
  sizes TEXT,
  tags TEXT,
  style_tags TEXT,
  cover_url TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'draft',
  in_stock INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  usage TEXT,
  alt TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS feed_items (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  seller_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  city TEXT,
  selected_size TEXT,
  selected_color TEXT,
  comment TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_feed_active ON feed_items(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
