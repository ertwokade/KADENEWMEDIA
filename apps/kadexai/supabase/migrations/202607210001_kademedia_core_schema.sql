-- kademedia kök sitesi (ana site) için MongoDB -> Postgres taşıma şeması.
-- Aynı Supabase projesi paylaşılıyor (KadexAI'nin auth.users / payment_orders / entitlements
-- tablolarıyla aynı proje) — bu yüzden tablo adları çakışmasın diye kademedia'ya özgü
-- olanlar sade tutuldu (users, customers, blogs, vb. bu projede henüz kullanılmıyordu).
--
-- Kimlik doğrulama NOTU: kademedia'nın kendi bcrypt+JWT admin/müşteri oturum sistemi
-- olduğu gibi korunuyor (server/api/_lib/auth.js) — Supabase Auth'a (auth.users) GEÇİLMİYOR,
-- sadece veri deposu MongoDB'den bu tablolara taşınıyor. Bütün erişim service-role ile
-- backend üzerinden yapılır; hiçbir tabloya anon/authenticated doğrudan erişemez.
--
-- Sadece hazırlık: production'a yedek + staging doğrulaması olmadan uygulanmaz.

-- ============================================================================
-- 1) KİMLİK: admin kullanıcıları ve müşteriler
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kade_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_users_username_uidx ON public.kade_users (lower(username));

CREATE TABLE IF NOT EXISTS public.kade_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  source TEXT NOT NULL DEFAULT 'manual',
  session_version INTEGER NOT NULL DEFAULT 0,
  consent_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_customers_email_uidx ON public.kade_customers (lower(email));

-- customers.packages[] normalize edildi (embedded array -> child table)
CREATE TABLE IF NOT EXISTS public.kade_customer_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.kade_customers(id) ON DELETE CASCADE,
  reference TEXT,
  name TEXT NOT NULL,
  consulting_area TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  access JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'admin', 'shopier')),
  shopier_order_id TEXT,
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'TRY',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS kade_customer_packages_customer_idx ON public.kade_customer_packages (customer_id);

-- ============================================================================
-- 2) TİCARİ: Shopier siparişleri
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kade_shopier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopier_order_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'processing' CHECK (
    state IN ('processing', 'completed', 'completed_reconciled', 'rejected', 'ignored', 'needs_review', 'completed_with_record_error')
  ),
  email TEXT,
  product_reference TEXT,
  customer_id UUID REFERENCES public.kade_customers(id) ON DELETE SET NULL,
  package_id TEXT,
  package_name TEXT,
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'TRY',
  reason TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Webhook idempotency: aynı sipariş iki kez işlenemesin.
CREATE UNIQUE INDEX IF NOT EXISTS kade_shopier_orders_order_id_uidx ON public.kade_shopier_orders (shopier_order_id);
CREATE INDEX IF NOT EXISTS kade_shopier_orders_state_idx ON public.kade_shopier_orders (state, received_at);

CREATE TABLE IF NOT EXISTS public.kade_shopier_unknown_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT,
  buyer_name TEXT,
  product_reference TEXT,
  product_price NUMERIC(12,2),
  platform_order_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3) GELEN KUTUSU / CRM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kade_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  service TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'iletisim-formu',
  status TEXT NOT NULL DEFAULT 'yeni' CHECK (status IN ('yeni', 'gorusme-bekliyor', 'teklif-gonderildi', 'kazanildi', 'kaybedildi')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kade_messages_created_idx ON public.kade_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS public.kade_message_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.kade_messages(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'email')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  assigned_by TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'orta' CHECK (priority IN ('dusuk', 'orta', 'yuksek', 'acil')),
  status TEXT NOT NULL DEFAULT 'beklemede',
  related_message_id UUID REFERENCES public.kade_messages(id) ON DELETE SET NULL,
  related_client_name TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  services JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, description, amount, quantity}]
  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'TRY',
  valid_until TIMESTAMPTZ,
  notes TEXT,
  message_id UUID REFERENCES public.kade_messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'taslak',
  sent_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_proposals_number_uidx ON public.kade_proposals (proposal_number);

CREATE TABLE IF NOT EXISTS public.kade_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'TRY',
  start_date TIMESTAMPTZ,
  next_renewal_date TIMESTAMPTZ,
  notes TEXT,
  contact_message_id UUID REFERENCES public.kade_messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aktif',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kade_subscriptions_renewal_idx ON public.kade_subscriptions (next_renewal_date);

-- subscriptions.paymentHistory[] normalize edildi
CREATE TABLE IF NOT EXISTS public.kade_subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.kade_subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  recorded_by TEXT
);
CREATE INDEX IF NOT EXISTS kade_subscription_payments_sub_idx ON public.kade_subscription_payments (subscription_id);

CREATE TABLE IF NOT EXISTS public.kade_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  project_name TEXT,
  token TEXT NOT NULL,
  score SMALLINT CHECK (score BETWEEN 0 AND 10),
  category TEXT CHECK (category IN ('destekci', 'pasif', 'kizgin')),
  comment TEXT,
  sent_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_surveys_token_uidx ON public.kade_surveys (token);

CREATE TABLE IF NOT EXISTS public.kade_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_name TEXT,
  referrer_email TEXT,
  referrer_phone TEXT,
  lead_name TEXT NOT NULL,
  lead_email TEXT,
  lead_phone TEXT,
  lead_company TEXT,
  service TEXT,
  notes TEXT,
  reward NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'yeni' CHECK (status IN ('yeni', 'iletisime-gecildi', 'teklif', 'kazandi', 'odendi', 'kaybedildi')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  emails TEXT[] NOT NULL DEFAULT '{}',
  assigned_users UUID[] NOT NULL DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  repeat TEXT NOT NULL DEFAULT 'none' CHECK (repeat IN ('none', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sent')),
  created_by TEXT,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kade_reminders_due_idx ON public.kade_reminders (status, remind_at);

CREATE TABLE IF NOT EXISTS public.kade_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.kade_users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kade_notifications_user_unread_idx ON public.kade_notifications (user_id, read);

CREATE TABLE IF NOT EXISTS public.kade_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  detail TEXT,
  type TEXT,
  icon TEXT,
  "user" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kade_activity_log_created_idx ON public.kade_activity_log (created_at DESC);

-- ============================================================================
-- 4) OPS: teklifler, faturalar, onboarding, e-posta şablonları, hatalar, push
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kade_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  services TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  monthly_budget TEXT,
  content_count TEXT,
  video_count TEXT,
  ad_management BOOLEAN DEFAULT FALSE,
  timeline TEXT,
  package TEXT,
  source TEXT,
  notes TEXT,
  consent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'yeni',
  assigned_to TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  due_date TIMESTAMPTZ,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'bekliyor',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invoices.payments[] normalize edildi
CREATE TABLE IF NOT EXISTS public.kade_invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.kade_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "user" TEXT
);
CREATE INDEX IF NOT EXISTS kade_invoice_payments_invoice_idx ON public.kade_invoice_payments (invoice_id);

CREATE TABLE IF NOT EXISTS public.kade_onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  social_accounts TEXT,
  target_audience TEXT,
  competitors TEXT,
  brand_voice TEXT,
  monthly_budget TEXT,
  goals TEXT,
  existing_content TEXT,
  design_preferences TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isim TEXT NOT NULL,
  konu TEXT,
  metin TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_client_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT,
  stack TEXT,
  path TEXT,
  source TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kade_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL DEFAULT '{}'::jsonb,
  permission TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_push_subscriptions_endpoint_uidx ON public.kade_push_subscriptions (endpoint);

CREATE TABLE IF NOT EXISTS public.kade_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT,
  collections JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 5) İÇERİK: medya, partnerler, blog, kısa linkler, link profilleri, site içeriği
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kade_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  mime_type TEXT,
  type TEXT CHECK (type IN ('image', 'video', 'document')),
  size_bytes BIGINT,
  alt TEXT,
  tags TEXT[] DEFAULT '{}',
  data TEXT, -- base64 — bkz. aşağıdaki not
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NOT: MongoDB'de olduğu gibi base64 blob doğrudan satırda tutuluyor (davranış
-- birebir korunuyor, taşıma riskini azaltmak için). İleride Supabase Storage'a
-- geçiş ayrı bir iyileştirme olarak ele alınabilir.

CREATE TABLE IF NOT EXISTS public.kade_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  category_en TEXT,
  logo TEXT,
  color TEXT,
  desc_tr TEXT,
  desc_en TEXT,
  long_desc_tr TEXT,
  long_desc_en TEXT,
  services_tr TEXT[] DEFAULT '{}',
  services_en TEXT[] DEFAULT '{}',
  results_tr TEXT[] DEFAULT '{}',
  results_en TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_partners_slug_uidx ON public.kade_partners (slug);

CREATE TABLE IF NOT EXISTS public.kade_blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title_tr TEXT,
  title_en TEXT,
  excerpt_tr TEXT,
  excerpt_en TEXT,
  content_tr TEXT,
  content_en TEXT,
  category TEXT,
  category_en TEXT,
  image TEXT,
  color TEXT,
  read_time TEXT,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  publish_at TIMESTAMPTZ,
  display_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_blogs_slug_uidx ON public.kade_blogs (slug);
-- publicBlogFilter(): published != false AND (publish_at IS NULL OR publish_at <= now())
CREATE INDEX IF NOT EXISTS kade_blogs_public_idx ON public.kade_blogs (published, publish_at);

CREATE TABLE IF NOT EXISTS public.kade_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  target TEXT NOT NULL,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  clicks BIGINT NOT NULL DEFAULT 0,
  last_click_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_short_links_slug_uidx ON public.kade_short_links (slug);

CREATE TABLE IF NOT EXISTS public.kade_link_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  tagline TEXT,
  photo TEXT,
  links JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label, url, icon}]
  active BOOLEAN NOT NULL DEFAULT TRUE,
  accent_color TEXT DEFAULT '#d4943f',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_link_profiles_slug_uidx ON public.kade_link_profiles (slug);

CREATE TABLE IF NOT EXISTS public.kade_newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_newsletter_email_uidx ON public.kade_newsletter (lower(email));

CREATE TABLE IF NOT EXISTS public.kade_site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_site_content_section_uidx ON public.kade_site_content (section);

-- ============================================================================
-- 6) ANALİTİK: ziyaretçi oturumları, sayfa görüntülemeleri, trafik kaynakları, AI kullanım
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kade_visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  path TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_visitor_sessions_sid_uidx ON public.kade_visitor_sessions (session_id);
CREATE INDEX IF NOT EXISTS kade_visitor_sessions_seen_idx ON public.kade_visitor_sessions (last_seen);

CREATE TABLE IF NOT EXISTS public.kade_pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  path TEXT NOT NULL,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_pageviews_date_path_uidx ON public.kade_pageviews (date, path);

CREATE TABLE IF NOT EXISTS public.kade_traffic_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('organic', 'social', 'direct', 'referral')),
  detail TEXT NOT NULL DEFAULT '',
  count BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS kade_traffic_sources_uidx ON public.kade_traffic_sources (date, source, detail);

CREATE TABLE IF NOT EXISTS public.kadexai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('admin', 'public')),
  model TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kadexai_usage_created_idx ON public.kadexai_usage (created_at);

-- ============================================================================
-- 7) RLS: tüm erişim yalnızca service-role (backend) üzerinden — anon/authenticated
--    hiçbir kade_* tablosuna doğrudan erişemez. Client tarafı zaten hiçbir zaman
--    doğrudan Supabase'e bağlanmıyor, Express/Vercel API katmanı üzerinden geçiyor.
-- ============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'kade_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
