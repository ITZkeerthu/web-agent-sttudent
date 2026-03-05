-- ============================================================
-- SmartSaver — New tables (run once against Supabase SQL Editor)
-- Does NOT modify existing tables.
-- ============================================================

-- 1. User profiles (auth handled in app layer)
CREATE TABLE IF NOT EXISTS profiles (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text        NOT NULL UNIQUE,
    password    text        NOT NULL,
    country     text        DEFAULT 'US',
    role        text        DEFAULT 'Student',
    field       text        DEFAULT 'CS',
    interests   text[]      DEFAULT ARRAY['AI','Cloud'],
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- 2. User-tracked offers (many-to-many)
CREATE TABLE IF NOT EXISTS user_tracked_offers (
    id          bigserial   PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offer_id    bigint      NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    tracked_at  timestamptz DEFAULT now(),
    UNIQUE(user_id, offer_id)
);

-- 3. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id          bigserial   PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender      text        NOT NULL CHECK (sender IN ('user', 'ai')),
    text        text        NOT NULL,
    offer_ids   bigint[]    DEFAULT '{}',
    created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracked_user    ON user_tracked_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_offer   ON user_tracked_offers(offer_id);
CREATE INDEX IF NOT EXISTS idx_chat_user       ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created    ON chat_messages(created_at);

-- RLS policies (enable RLS on new tables)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracked_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow the service_role key to bypass RLS (backend runs with service_role)
-- No additional policies needed since we use service_role key.
