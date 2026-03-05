#!/usr/bin/env python3
"""
Initialize Supabase schema - creates tables via API.
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def create_table(table_name, definition):
    """Create table via Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/"
    
    # Try to insert a test row to see if table exists
    test_url = f"{url}{table_name}"
    resp = requests.head(test_url, headers=HEADERS)
    
    if resp.status_code == 200:
        print(f"  ✓ Table '{table_name}' exists")
        return True
    
    print(f"  Table '{table_name}' not found (status: {resp.status_code})")
    return False

def seed_keywords():
    """Seed core keywords via REST API."""
    url = f"{SUPABASE_URL}/rest/v1/keyword_pool"
    
    keywords = [
        # Entities
        {"term": "student", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "students", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "academic", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "university", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "college", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "undergraduate", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "graduate", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "education", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "campus", "category": "core", "yield_score": 1.0, "is_active": True},
        # Benefits
        {"term": "discount", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "discounts", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "offer", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "offers", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "deal", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "deals", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "free", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "pricing", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "promotion", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "promo", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "coupon", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "voucher", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "trial", "category": "core", "yield_score": 1.0, "is_active": True},
        # Phrases
        {"term": "student discount", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "student offer", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "education pricing", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "academic discount", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "university deal", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "student pricing", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "academic pricing", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "education discount", "category": "core", "yield_score": 1.0, "is_active": True},
        # Verticals
        {"term": "software", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "hardware", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "laptop", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "computer", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "subscription", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "streaming", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "music", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "video", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "cloud", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "development", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "design", "category": "core", "yield_score": 1.0, "is_active": True},
    ]
    
    headers = {**HEADERS, "Prefer": "resolution=merge-duplicates"}
    
    try:
        resp = requests.post(url, json=keywords, headers=headers)
        if resp.status_code in [201, 200]:
            print(f"  ✓ Seeded {len(keywords)} keywords")
            return True
        else:
            print(f"  Response: {resp.status_code} - {resp.text[:100]}")
            return False
    except Exception as e:
        print(f"  Error: {e}")
        return False

def check_tables():
    """Check which tables exist."""
    tables = [
        "processed_urls", "archived_urls", "domains", 
        "offers", "keyword_pool", "learned_terms", "system_stats"
    ]
    
    existing = []
    for table in tables:
        url = f"{SUPABASE_URL}/rest/v1/{table}?limit=0"
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            existing.append(table)
            print(f"  ✓ {table}")
        else:
            print(f"  ✗ {table} - {resp.status_code}")
    
    return existing

def generate_sql_for_dashboard():
    """Generate SQL to paste into Supabase dashboard."""
    sql = '''
-- Run this in Supabase SQL Editor

-- 1. PROCESSED_URLS
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
create unique index idx_processed_urls_hash on public.processed_urls(url_hash);
create index idx_processed_urls_time on public.processed_urls(processed_at);
create index idx_processed_urls_domain on public.processed_urls(domain);

-- 2. ARCHIVED_URLS
create table if not exists public.archived_urls (
    id bigserial primary key,
    url_hash varchar(64) not null,
    canonical_url text not null,
    domain varchar(255) not null,
    processed_at timestamptz,
    score integer default 0,
    archived_at timestamptz default now()
);
create index idx_archived_urls_hash on public.archived_urls(url_hash);

-- 3. DOMAINS
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

-- 4. OFFERS
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

-- 5. KEYWORD_POOL
create table if not exists public.keyword_pool (
    term varchar(100) primary key,
    category varchar(20) not null,
    yield_score float default 1.0,
    usage_count integer default 0,
    last_used timestamptz default now(),
    is_active boolean default true
);
create index idx_keywords_active on public.keyword_pool(is_active, category) where is_active = true;

-- 6. LEARNED_TERMS
create table if not exists public.learned_terms (
    id bigserial primary key,
    term varchar(200) not null,
    context varchar(100),
    frequency integer default 1,
    discovered_at timestamptz default now(),
    promoted boolean default false,
    unique(term, context)
);
create index idx_learned_frequency on public.learned_terms(frequency desc) where promoted = false;

-- 7. SYSTEM_STATS
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

-- Insert core keywords
insert into public.keyword_pool (term, category, yield_score, is_active) values
('student', 'core', 1.0, true), ('students', 'core', 1.0, true),
('academic', 'core', 1.0, true), ('university', 'core', 1.0, true),
('college', 'core', 1.0, true), ('education', 'core', 1.0, true),
('discount', 'core', 1.0, true), ('offer', 'core', 1.0, true),
('deal', 'core', 1.0, true), ('pricing', 'core', 1.0, true),
('student discount', 'core', 1.0, true), ('academic discount', 'core', 1.0, true)
on conflict (term) do nothing;
'''
    return sql

def main():
    print("="*60)
    print("Supabase Setup Helper")
    print("="*60)
    print(f"\nProject URL: {SUPABASE_URL}")
    print(f"Service Key: {SUPABASE_KEY[:20]}...{SUPABASE_KEY[-10:]}")
    print()
    
    print("[1] Checking existing tables...")
    existing = check_tables()
    
    if len(existing) < 7:
        print("\n[!] Some tables are missing. You need to create them.")
        print("\nGo to your Supabase Dashboard > SQL Editor")
        print("Paste and run the following SQL:\n")
        print("-" * 60)
        print(generate_sql_for_dashboard())
        print("-" * 60)
    else:
        print("\n[2] Seeding keywords...")
        seed_keywords()
    
    print("\n" + "="*60)
    print("Done!")
    print("="*60)

if __name__ == "__main__":
    main()
