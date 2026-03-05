#!/usr/bin/env python3
"""
Create Supabase tables via REST API.
Uses service role key for privileged operations.
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def create_table_via_rpc(table_name, columns):
    """Try to create table via various methods."""
    
    # Method 1: Try raw SQL via rpc
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"\nCreating {table_name}...")
    
    # Build SQL
    cols_sql = ", ".join([f"{name} {type}" for name, type in columns.items()])
    sql = f"CREATE TABLE IF NOT EXISTS public.{table_name} ({cols_sql});"
    
    try:
        resp = requests.post(rpc_url, json={"query": sql}, headers=headers, timeout=30)
        print(f"  RPC response: {resp.status_code}")
        if resp.status_code in [200, 201, 204]:
            return True
    except Exception as e:
        print(f"  RPC failed: {e}")
    
    return False

def create_via_postgrest(table_name, sample_data):
    """Create table by inserting data with column definitions."""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    try:
        resp = requests.post(url, json=sample_data, headers=headers, timeout=30)
        print(f"  POST response: {resp.status_code}")
        if resp.status_code in [201, 200, 409]:  # 409 = already exists
            return True
    except Exception as e:
        print(f"  POST failed: {e}")
    
    return False

def generate_sql_script():
    """Generate complete SQL for manual creation."""
    sql = """-- Complete Schema for Student Scraper
-- Run in Supabase SQL Editor

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

-- Seed core keywords
insert into public.keyword_pool (term, category, yield_score, is_active) values
('student', 'core', 1.0, true), ('students', 'core', 1.0, true),
('academic', 'core', 1.0, true), ('university', 'core', 1.0, true),
('college', 'core', 1.0, true), ('undergraduate', 'core', 1.0, true),
('graduate', 'core', 1.0, true), ('education', 'core', 1.0, true),
('campus', 'core', 1.0, true), ('faculty', 'core', 1.0, true),
('edu', 'core', 1.0, true),
('discount', 'core', 1.0, true), ('discounts', 'core', 1.0, true),
('offer', 'core', 1.0, true), ('offers', 'core', 1.0, true),
('deal', 'core', 1.0, true), ('deals', 'core', 1.0, true),
('free', 'core', 1.0, true), ('savings', 'core', 1.0, true),
('pricing', 'core', 1.0, true), ('promotion', 'core', 1.0, true),
('promo', 'core', 1.0, true), ('coupon', 'core', 1.0, true),
('voucher', 'core', 1.0, true), ('rebate', 'core', 1.0, true),
('trial', 'core', 1.0, true),
('student discount', 'core', 1.0, true), ('student offer', 'core', 1.0, true),
('education pricing', 'core', 1.0, true), ('academic discount', 'core', 1.0, true),
('university deal', 'core', 1.0, true), ('campus offer', 'core', 1.0, true),
('student pricing', 'core', 1.0, true), ('academic pricing', 'core', 1.0, true),
('education discount', 'core', 1.0, true),
('software', 'core', 1.0, true), ('hardware', 'core', 1.0, true),
('laptop', 'core', 1.0, true), ('computer', 'core', 1.0, true),
('subscription', 'core', 1.0, true), ('streaming', 'core', 1.0, true),
('music', 'core', 1.0, true), ('video', 'core', 1.0, true),
('productivity', 'core', 1.0, true), ('cloud', 'core', 1.0, true),
('storage', 'core', 1.0, true), ('development', 'core', 1.0, true),
('design', 'core', 1.0, true), ('creative', 'core', 1.0, true)
on conflict (term) do nothing;
"""
    return sql

def main():
    print("="*60)
    print("Supabase Schema Creator")
    print("="*60)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_URL and SUPABASE_KEY in .env")
        return
    
    # Try creating tables via simple POST
    print("\n[!] Attempting to create tables via REST API...")
    
    TABLES = {
        "keyword_pool": {"term": "_test", "category": "test", "yield_score": 1.0, "is_active": True},
        "domains": {"domain": "_test.com", "trust_score": 0, "is_blacklisted": False},
        "processed_urls": {"url_hash": "_test", "canonical_url": "_test", "domain": "_test", "is_offer": False},
        "archived_urls": {"url_hash": "_test", "canonical_url": "_test", "domain": "_test"},
        "offers": {"domain": "_test.com", "url": "_test", "title": "_test", "score": 0},
        "learned_terms": {"term": "_test", "context": "_test", "frequency": 1, "promoted": False},
        "system_stats": {"cycle_number": 0, "urls_discovered": 0, "offers_found": 0}
    }
    
    created = []
    failed = []
    
    for table, sample in TABLES.items():
        if table == "offers":
            # Need domain first
            create_via_postgrest("domains", {"domain": "_test.com", "trust_score": 0})
        
        if create_via_postgrest(table, sample):
            created.append(table)
        else:
            failed.append(table)
    
    if len(created) == len(TABLES):
        print(f"\n✓ All {len(created)} tables created successfully")
        
        # Seed keywords
        print("\n[2] Seeding keywords...")
        seed_keywords()
        
    else:
        print(f"\n[!] Created: {len(created)}/{len(TABLES)}")
        print(f"[!] Failed: {failed}")
        print("\n" + "="*60)
        print("RUN THIS SQL IN SUPABASE DASHBOARD > SQL EDITOR:")
        print("="*60)
        print(generate_sql_script())
        print("="*60)

def seed_keywords():
    """Seed keywords if tables exist."""
    keywords = [
        {"term": "student", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "discount", "category": "core", "yield_score": 1.0, "is_active": True},
        {"term": "student discount", "category": "core", "yield_score": 1.0, "is_active": True},
    ]
    
    url = f"{SUPABASE_URL}/rest/v1/keyword_pool"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    try:
        resp = requests.post(url, json=keywords, headers=headers)
        print(f"  Keyword seed: {resp.status_code}")
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    main()
