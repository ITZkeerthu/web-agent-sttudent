-- Complete Schema for Student Benefits Scraper
-- Copy everything below and paste into Supabase Dashboard → SQL Editor → New Query

-- ===============================================================
-- 1. PROCESSED_URLS - Deduplication layer with O(1) hash lookups
-- ===============================================================
create table if not exists public.processed_urls (
    id bigserial primary key,
    url_hash varchar(64) unique not null,
    canonical_url text not null,
    domain varchar(255) not null,
    processed_at timestamptz default now(),
    score integer default 0,
    spam_score integer default 0,
    is_offer boolean default false
);

-- Unique index for O(1) hash lookups
create unique index if not exists idx_processed_urls_hash 
on public.processed_urls(url_hash);

-- Index for time-based archival (90 days)
create index if not exists idx_processed_urls_time 
on public.processed_urls(processed_at);

-- Index for domain grouping
create index if not exists idx_processed_urls_domain 
on public.processed_urls(domain);

-- ===============================================================
-- 2. ARCHIVED_URLS - Cold storage for old URLs
-- ===============================================================
create table if not exists public.archived_urls (
    id bigserial primary key,
    url_hash varchar(64) not null,
    canonical_url text not null,
    domain varchar(255) not null,
    processed_at timestamptz,
    score integer default 0,
    archived_at timestamptz default now()
);

create index if not exists idx_archived_urls_hash 
on public.archived_urls(url_hash);

-- ===============================================================
-- 3. DOMAINS - Trust scoring system
-- ===============================================================
create table if not exists public.domains (
    domain varchar(255) primary key,
    trust_score float default 0,
    last_seen timestamptz default now(),
    offer_count integer default 0,
    spam_count integer default 0,
    is_blacklisted boolean default false
);

-- Index for trust score sorting
create index if not exists idx_domains_trust 
on public.domains(trust_score);

-- Partial index for fast blacklist checks
create index if not exists idx_domains_blacklist 
on public.domains(is_blacklisted) 
where is_blacklisted = true;

-- ===============================================================
-- 4. OFFERS - Valid student benefits found
-- ===============================================================
create table if not exists public.offers (
    id bigserial primary key,
    domain varchar(255) not null references public.domains(domain),
    url text not null,
    title varchar(500),
    description text,
    benefits_found text[],  -- Array of matched terms
    score integer default 0,
    discovered_at timestamptz default now()
);

create index if not exists idx_offers_domain 
on public.offers(domain);

create index if not exists idx_offers_score 
on public.offers(score desc);

create index if not exists idx_offers_discovered 
on public.offers(discovered_at);

-- ===============================================================
-- 5. KEYWORD_POOL - Controlled vocabulary (max 500 terms)
-- ===============================================================
create table if not exists public.keyword_pool (
    term varchar(100) primary key,
    category varchar(20) not null check (category in ('core', 'learned')),
    yield_score float default 1.0,
    usage_count integer default 0,
    last_used timestamptz default now(),
    is_active boolean default true
);

-- Partial index for active keyword queries
create index if not exists idx_keywords_active 
on public.keyword_pool(is_active, category) 
where is_active = true;

-- ===============================================================
-- 6. LEARNED_TERMS - Co-occurrence frequency tracking
-- ===============================================================
create table if not exists public.learned_terms (
    id bigserial primary key,
    term varchar(200) not null,
    context varchar(100),
    frequency integer default 1,
    discovered_at timestamptz default now(),
    promoted boolean default false,
    unique(term, context)
);

-- Index for finding promotable terms (freq >= 5, not promoted)
create index if not exists idx_learned_frequency 
on public.learned_terms(frequency desc) 
where promoted = false;

-- ===============================================================
-- 7. SYSTEM_STATS - Runtime monitoring
-- ===============================================================
create table if not exists public.system_stats (
    id bigserial primary key,
    cycle_number integer,
    urls_discovered integer default 0,
    urls_processed integer default 0,
    offers_found integer default 0,
    errors_count integer default 0,
    runtime_seconds integer,
    recorded_at timestamptz default now()
);

create index if not exists idx_stats_time 
on public.system_stats(recorded_at);

-- ===============================================================
-- SEED CORE VOCABULARY
-- Max 500 total keywords, core terms never removed
-- ===============================================================

-- Entity terms
insert into public.keyword_pool (term, category, yield_score, is_active) values
('student', 'core', 1.0, true), 
('students', 'core', 1.0, true),
('academic', 'core', 1.0, true), 
('university', 'core', 1.0, true),
('college', 'core', 1.0, true), 
('undergraduate', 'core', 1.0, true),
('graduate', 'core', 1.0, true), 
('phd', 'core', 1.0, true),
('scholar', 'core', 1.0, true), 
('education', 'core', 1.0, true),
('campus', 'core', 1.0, true), 
('faculty', 'core', 1.0, true), 
('edu', 'core', 1.0, true)
on conflict (term) do nothing;

-- Benefit terms
insert into public.keyword_pool (term, category, yield_score, is_active) values
('discount', 'core', 1.0, true), 
('discounts', 'core', 1.0, true),
('offer', 'core', 1.0, true), 
('offers', 'core', 1.0, true),
('deal', 'core', 1.0, true), 
('deals', 'core', 1.0, true),
('free', 'core', 1.0, true), 
('savings', 'core', 1.0, true),
('save', 'core', 1.0, true),
('pricing', 'core', 1.0, true), 
('promotion', 'core', 1.0, true),
('promo', 'core', 1.0, true), 
('coupon', 'core', 1.0, true),
('voucher', 'core', 1.0, true), 
('rebate', 'core', 1.0, true),
('cashback', 'core', 1.0, true),
('trial', 'core', 1.0, true)
on conflict (term) do nothing;

-- Program phrases (higher weight in scoring)
insert into public.keyword_pool (term, category, yield_score, is_active) values
('student discount', 'core', 1.5, true), 
('student offer', 'core', 1.5, true),
('education pricing', 'core', 1.5, true), 
('academic discount', 'core', 1.5, true),
('university deal', 'core', 1.5, true), 
('campus offer', 'core', 1.5, true),
('student pricing', 'core', 1.5, true), 
('academic pricing', 'core', 1.5, true),
('education discount', 'core', 1.5, true)
on conflict (term) do nothing;

-- Vertical modifiers
insert into public.keyword_pool (term, category, yield_score, is_active) values
('software', 'core', 1.0, true), 
('hardware', 'core', 1.0, true),
('laptop', 'core', 1.0, true), 
('computer', 'core', 1.0, true),
('subscription', 'core', 1.0, true), 
('streaming', 'core', 1.0, true),
('music', 'core', 1.0, true), 
('video', 'core', 1.0, true),
('productivity', 'core', 1.0, true), 
('cloud', 'core', 1.0, true),
('storage', 'core', 1.0, true), 
('development', 'core', 1.0, true),
('design', 'core', 1.0, true), 
('creative', 'core', 1.0, true)
on conflict (term) do nothing;

-- ===============================================================
-- UTILITY FUNCTIONS
-- ===============================================================

-- Get system summary
CREATE OR REPLACE FUNCTION public.get_stats_summary()
RETURNS TABLE (
    total_urls bigint,
    total_offers bigint,
    total_domains bigint,
    active_keywords bigint,
    blacklisted_domains bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.processed_urls),
        (SELECT COUNT(*) FROM public.offers),
        (SELECT COUNT(*) FROM public.domains),
        (SELECT COUNT(*) FROM public.keyword_pool WHERE is_active = true),
        (SELECT COUNT(*) FROM public.domains WHERE is_blacklisted = true);
END;
$$ LANGUAGE plpgsql;

-- Archive old URLs (run monthly via cron)
CREATE OR REPLACE FUNCTION public.archive_old_urls(cutoff_days int DEFAULT 90)
RETURNS int AS $$
DECLARE
    archived_count int;
BEGIN
    -- Move to archive
    INSERT INTO public.archived_urls (url_hash, canonical_url, domain, processed_at, score)
    SELECT url_hash, canonical_url, domain, processed_at, score
    FROM public.processed_urls
    WHERE processed_at < now() - (cutoff_days || ' days')::interval;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Delete from processed
    DELETE FROM public.processed_urls
    WHERE processed_at < now() - (cutoff_days || ' days')::interval;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Apply trust decay (run monthly)
CREATE OR REPLACE FUNCTION public.apply_trust_decay()
RETURNS void AS $$
BEGIN
    UPDATE public.domains
    SET trust_score = GREATEST(0, trust_score * 0.95)
    WHERE trust_score > 0;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- VERIFICATION
-- ===============================================================
SELECT 'Schema created successfully' as status;
SELECT COUNT(*) as keyword_count FROM public.keyword_pool;
