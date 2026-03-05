-- Student Scraper Schema - RUN THIS IN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/your-project-id/sql/new

-- TABLE 1: Processed URLs (O(1) hash-based dedup)
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
create unique index idx_processed_hash on public.processed_urls(url_hash);
create index idx_processed_time on public.processed_urls(processed_at);
create index idx_processed_domain on public.processed_urls(domain);

-- TABLE 2: Archived URLs
create table if not exists public.archived_urls (
    id bigserial primary key,
    url_hash varchar(64) not null,
    canonical_url text not null,
    domain varchar(255) not null,
    processed_at timestamptz,
    score integer default 0,
    archived_at timestamptz default now()
);
create index idx_archived_hash on public.archived_urls(url_hash);

-- TABLE 3: Domain Trust Scoring
create table if not exists public.domains (
    domain varchar(255) primary key,
    trust_score float default 0,
    last_seen timestamptz default now(),
    offer_count integer default 0,
    spam_count integer default 0,
    is_blacklisted boolean default false
);
create index idx_domains_trust on public.domains(trust_score);
create index idx_domains_blacklist on public.domains(is_blacklisted) where is_blacklisted = true;

-- TABLE 4: Valid Offers
create table if not exists public.offers (
    id bigserial primary key,
    domain varchar(255) not null references public.domains(domain),
    url text not null,
    title varchar(500),
    description text,
    benefits_found text[],
    score integer default 0,
    discovered_at timestamptz default now()
);
create index idx_offers_domain on public.offers(domain);
create index idx_offers_score on public.offers(score desc);
create index idx_offers_discovered on public.offers(discovered_at);

-- TABLE 5: Keyword Pool (Max 500 terms)
create table if not exists public.keyword_pool (
    term varchar(100) primary key,
    category varchar(20) not null check (category in ('core', 'learned')),
    yield_score float default 1.0,
    usage_count integer default 0,
    last_used timestamptz default now(),
    is_active boolean default true
);
create index idx_keywords_active on public.keyword_pool(is_active, category) where is_active = true;

-- TABLE 6: Co-occurrence Learning
create table if not exists public.learned_terms (
    id bigserial primary key,
    term varchar(200) not null,
    context varchar(100),
    frequency integer default 1,
    discovered_at timestamptz default now(),
    promoted boolean default false,
    unique(term, context)
);
create index idx_learned_freq on public.learned_terms(frequency desc) where promoted = false;

-- TABLE 7: System Stats
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

-- SEED CORE VOCABULARY (Max 500 total, these are ~50 core terms)
insert into public.keyword_pool (term, category, yield_score, is_active) values
('student', 'core', 1.0, true), ('students', 'core', 1.0, true),
('academic', 'core', 1.0, true), ('university', 'core', 1.0, true),
('college', 'core', 1.0, true), ('undergraduate', 'core', 1.0, true),
('graduate', 'core', 1.0, true), ('phd', 'core', 1.0, true),
('education', 'core', 1.0, true), ('campus', 'core', 1.0, true),
('discount', 'core', 1.0, true), ('discounts', 'core', 1.0, true),
('offer', 'core', 1.0, true), ('offers', 'core', 1.0, true),
('deal', 'core', 1.0, true), ('deals', 'core', 1.0, true),
('free', 'core', 1.0, true), ('pricing', 'core', 1.0, true),
('promotion', 'core', 1.0, true), ('coupon', 'core', 1.0, true),
('student discount', 'core', 1.5, true), ('academic discount', 'core', 1.5, true),
('education pricing', 'core', 1.5, true), ('student offer', 'core', 1.5, true),
('university deal', 'core', 1.5, true), ('software', 'core', 1.0, true),
('hardware', 'core', 1.0, true), ('laptop', 'core', 1.0, true),
('subscription', 'core', 1.0, true), ('streaming', 'core', 1.0, true)
on conflict (term) do nothing;

-- HELPER FUNCTIONS

-- Get system stats
CREATE OR REPLACE FUNCTION public.get_stats_summary()
RETURNS TABLE (total_urls bigint, total_offers bigint, total_domains bigint, active_keywords bigint, blacklisted bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.processed_urls),
        (SELECT COUNT(*) FROM public.offers),
        (SELECT COUNT(*) FROM public.domains),
        (SELECT COUNT(*) FROM public.keyword_pool WHERE is_active = true),
        (SELECT COUNT(*) FROM public.domains WHERE is_blacklisted = true);
END;
$$ language plpgsql;

-- Archive old URLs
CREATE OR REPLACE FUNCTION public.archive_old_urls(cutoff_days int default 90)
RETURNS int AS $$
DECLARE
    archived_count int;
BEGIN
    INSERT INTO public.archived_urls (url_hash, canonical_url, domain, processed_at, score)
    SELECT url_hash, canonical_url, domain, processed_at, score
    FROM public.processed_urls
    WHERE processed_at < now() - (cutoff_days || ' days')::interval;
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    DELETE FROM public.processed_urls WHERE processed_at < now() - (cutoff_days || ' days')::interval;
    RETURN archived_count;
END;
$$ language plpgsql;

-- Apply trust decay monthly
CREATE OR REPLACE FUNCTION public.apply_trust_decay()
RETURNS void AS $$
BEGIN
    UPDATE public.domains SET trust_score = GREATEST(0, trust_score * 0.95) WHERE trust_score > 0;
END;
$$ language plpgsql;

-- VERIFY
SELECT 'Schema created successfully' as status;
SELECT COUNT(*) as keywords_seeded FROM public.keyword_pool;
