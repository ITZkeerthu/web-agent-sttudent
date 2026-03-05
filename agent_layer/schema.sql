-- Supabase Schema for Student Scraper
-- Run this in Supabase SQL Editor

-- Enable RLS (optional, for production)
-- alter table public.processed_urls enable row level security;

-- ===============================================================
-- 1. PROCESSED_URLS - Deduplication layer
-- ===============================================================
create table if not exists public.processed_urls (
    id bigint generated always as identity primary key,
    url_hash varchar(64) unique not null,
    canonical_url text not null,
    domain varchar(255) not null,
    processed_at timestamp with time zone default now(),
    score integer default 0,
    spam_score integer default 0,
    is_offer boolean default false
);

-- Unique index for hash lookups (O(1))
create unique index if not exists idx_processed_urls_hash 
on public.processed_urls(url_hash);

-- Index for time-based archival
create index if not exists idx_processed_urls_time 
on public.processed_urls(processed_at);

-- Index for domain lookups
create index if not exists idx_processed_urls_domain 
on public.processed_urls(domain);

-- ===============================================================
-- 2. ARCHIVED_URLS - Old URL storage
-- ===============================================================
create table if not exists public.archived_urls (
    id bigint generated always as identity primary key,
    url_hash varchar(64) not null,
    canonical_url text not null,
    domain varchar(255) not null,
    processed_at timestamp with time zone,
    score integer default 0,
    archived_at timestamp with time zone default now()
);

create index if not exists idx_archived_urls_hash 
on public.archived_urls(url_hash);

-- ===============================================================
-- 3. DOMAINS - Trust scoring
-- ===============================================================
create table if not exists public.domains (
    domain varchar(255) primary key,
    trust_score float default 0,
    last_seen timestamp with time zone default now(),
    offer_count integer default 0,
    spam_count integer default 0,
    is_blacklisted boolean default false
);

-- Index for trust score lookups
create index if not exists idx_domains_trust 
on public.domains(trust_score);

-- Index for blacklist checks
create index if not exists idx_domains_blacklist 
on public.domains(is_blacklisted) 
where is_blacklisted = true;

-- ===============================================================
-- 4. OFFERS - Valid student offers
-- ===============================================================
create table if not exists public.offers (
    id bigint generated always as identity primary key,
    domain varchar(255) not null references public.domains(domain),
    url text not null,
    title varchar(500),
    description text,
    benefits_found text[],  -- Array of matched benefit terms
    score integer default 0,
    discovered_at timestamp with time zone default now()
);

create index if not exists idx_offers_domain 
on public.offers(domain);

create index if not exists idx_offers_score 
on public.offers(score desc);

create index if not exists idx_offers_discovered 
on public.offers(discovered_at);

-- ===============================================================
-- 5. KEYWORD_POOL - Controlled vocabulary
-- ===============================================================
create table if not exists public.keyword_pool (
    term varchar(100) primary key,
    category varchar(20) not null,  -- 'core', 'learned'
    yield_score float default 1.0,
    usage_count integer default 0,
    last_used timestamp with time zone default now(),
    is_active boolean default true
);

-- Index for active keywords
create index if not exists idx_keywords_active 
on public.keyword_pool(is_active, category) 
where is_active = true;

-- ===============================================================
-- 6. LEARNED_TERMS - Co-occurrence tracking
-- ===============================================================
create table if not exists public.learned_terms (
    id bigint generated always as identity primary key,
    term varchar(200) not null,
    context varchar(100),  -- e.g., 'benefit_context'
    frequency integer default 1,
    discovered_at timestamp with time zone default now(),
    promoted boolean default false,
    unique(term, context)
);

create index if not exists idx_learned_frequency 
on public.learned_terms(frequency desc) 
where promoted = false;

-- ===============================================================
-- 7. SYSTEM_STATS - Monitoring
-- ===============================================================
create table if not exists public.system_stats (
    id bigint generated always as identity primary key,
    cycle_number integer,
    urls_discovered integer default 0,
    urls_processed integer default 0,
    offers_found integer default 0,
    errors_count integer default 0,
    runtime_seconds integer,
    recorded_at timestamp with time zone default now()
);

create index if not exists idx_stats_time 
on public.system_stats(recorded_at);

-- ===============================================================
-- Functions
-- ===============================================================

-- Function to get stats summary
create or replace function public.get_stats_summary()
returns table (
    total_urls bigint,
    total_offers bigint,
    total_domains bigint,
    active_keywords bigint,
    blacklisted_domains bigint
) as $$
begin
    return query
    select 
        (select count(*) from public.processed_urls) as total_urls,
        (select count(*) from public.offers) as total_offers,
        (select count(*) from public.domains) as total_domains,
        (select count(*) from public.keyword_pool where is_active = true) as active_keywords,
        (select count(*) from public.domains where is_blacklisted = true) as blacklisted_domains;
end;
$$ language plpgsql;

-- Function to archive old URLs (run monthly)
create or replace function public.archive_old_urls(cutoff_days int default 90)
returns int as $$
declare
    archived_count int;
begin
    -- Insert into archive
    insert into public.archived_urls (url_hash, canonical_url, domain, processed_at, score)
    select url_hash, canonical_url, domain, processed_at, score
    from public.processed_urls
    where processed_at < now() - (cutoff_days || ' days')::interval;
    
    get diagnostics archived_count = row_count;
    
    -- Delete from processed
    delete from public.processed_urls
    where processed_at < now() - (cutoff_days || ' days')::interval;
    
    return archived_count;
end;
$$ language plpgsql;

-- ===============================================================
-- Initial Data Seed
-- ===============================================================

-- Seed core entities
insert into public.keyword_pool (term, category) values
    ('student', 'core'), ('students', 'core'), ('academic', 'core'), 
    ('university', 'core'), ('college', 'core'), ('undergraduate', 'core'),
    ('graduate', 'core'), ('phd', 'core'), ('scholar', 'core'),
    ('education', 'core'), ('campus', 'core'), ('faculty', 'core'), ('edu', 'core')
on conflict (term) do nothing;

-- Seed benefit terms
insert into public.keyword_pool (term, category) values
    ('discount', 'core'), ('discounts', 'core'), ('offer', 'core'),
    ('offers', 'core'), ('deal', 'core'), ('deals', 'core'),
    ('free', 'core'), ('savings', 'core'), ('save', 'core'),
    ('pricing', 'core'), ('promotion', 'core'), ('promo', 'core'),
    ('coupon', 'core'), ('voucher', 'core'), ('rebate', 'core'),
    ('cashback', 'core'), ('trial', 'core')
on conflict (term) do nothing;

-- Seed program phrases
insert into public.keyword_pool (term, category) values
    ('student discount', 'core'), ('student offer', 'core'),
    ('education pricing', 'core'), ('academic discount', 'core'),
    ('university deal', 'core'), ('campus offer', 'core'),
    ('student pricing', 'core'), ('academic pricing', 'core'),
    ('education discount', 'core')
on conflict (term) do nothing;

-- Seed verticals
insert into public.keyword_pool (term, category) values
    ('software', 'core'), ('hardware', 'core'), ('laptop', 'core'),
    ('computer', 'core'), ('subscription', 'core'), ('streaming', 'core'),
    ('music', 'core'), ('video', 'core'), ('productivity', 'core'),
    ('cloud', 'core'), ('storage', 'core'), ('development', 'core'),
    ('design', 'core'), ('creative', 'core')
on conflict (term) do nothing;
