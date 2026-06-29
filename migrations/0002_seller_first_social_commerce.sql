-- Swipd / Tura seller-first social commerce upgrade.
-- Apply this after 0001_initial_schema.sql.

ALTER TABLE sellers ADD COLUMN owner_user_id TEXT DEFAULT 'owner';
ALTER TABLE sellers ADD COLUMN owner_email TEXT DEFAULT '';
ALTER TABLE sellers ADD COLUMN approval_status TEXT DEFAULT 'approved';

ALTER TABLE products ADD COLUMN gallery_urls TEXT;
ALTER TABLE products ADD COLUMN occasion_tags TEXT;
ALTER TABLE products ADD COLUMN age_range_tags TEXT;
ALTER TABLE products ADD COLUMN gender TEXT DEFAULT 'women';
ALTER TABLE products ADD COLUMN season_tags TEXT;
ALTER TABLE products ADD COLUMN fit_tags TEXT;
ALTER TABLE products ADD COLUMN price_segment TEXT DEFAULT 'middle';

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'buyer',
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  style_preferences TEXT,
  occasion_preferences TEXT,
  age_range_preferences TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspiration_posts (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  content_type TEXT DEFAULT 'outfit',
  media_type TEXT NOT NULL,
  media_urls TEXT NOT NULL,
  cover_url TEXT,
  style_tags TEXT,
  occasion_tags TEXT,
  age_range_tags TEXT,
  gender TEXT DEFAULT 'women',
  season_tags TEXT,
  is_pinned INTEGER DEFAULT 0,
  pinned_order INTEGER DEFAULT 0,
  publish_to_discovery INTEGER DEFAULT 0,
  moderation_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'draft',
  sort_order INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS inspiration_post_products (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  x REAL,
  y REAL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES inspiration_posts(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (buyer_user_id, seller_id)
);

CREATE TABLE IF NOT EXISTS saved_products (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (buyer_user_id, product_id)
);

CREATE TABLE IF NOT EXISTS saved_posts (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (buyer_user_id, post_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  seller_id TEXT,
  product_id TEXT,
  post_id TEXT,
  event_name TEXT NOT NULL,
  source TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inspiration_posts_seller ON inspiration_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_discovery ON inspiration_posts(publish_to_discovery, moderation_status, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_inspiration_post_products_post ON inspiration_post_products(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_buyer ON follows(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_buyer ON saved_products(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_buyer ON saved_posts(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_seller ON analytics_events(seller_id, event_name);
