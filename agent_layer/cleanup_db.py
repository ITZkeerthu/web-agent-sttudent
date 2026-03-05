#!/usr/bin/env python3
"""
Database Cleanup Script — Truncates all Supabase tables.

Tables cleared (in FK-safe order):
  1. offers           (FK → domains, must go first)
  2. system_stats
  3. learned_terms
  4. processed_urls
  5. archived_urls
  6. domains
  7. keyword_pool

Usage:
  python3 cleanup_db.py              # Truncate all, re-seed keywords
  python3 cleanup_db.py --no-seed    # Truncate all, leave keyword_pool empty
  python3 cleanup_db.py --dry-run    # Show row counts only, no deletions
"""
import os
import sys
import argparse
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ---------------------------------------------------------------
# Tables in deletion order (FK constraints: offers before domains)
# ---------------------------------------------------------------
TABLES = [
    "offers",           # FK references domains — must go first
    "system_stats",
    "learned_terms",
    "processed_urls",
    "archived_urls",
    "domains",
    "keyword_pool",
]

# Primary key column for each table (used for the delete filter)
TABLE_PK = {
    "offers":        ("id",     "gte", 0),
    "system_stats":  ("id",     "gte", 0),
    "learned_terms": ("id",     "gte", 0),
    "processed_urls":("id",     "gte", 0),
    "archived_urls": ("id",     "gte", 0),
    "domains":       ("domain", "neq", ""),
    "keyword_pool":  ("term",   "neq", ""),
}

# ---------------------------------------------------------------
# Core keyword seed (mirrors setup.py)
# ---------------------------------------------------------------
CORE_KEYWORDS = [
    # Entities
    {"term": "student",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "students",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "academic",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "university",   "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "college",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "undergraduate","category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "graduate",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "phd",          "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "scholar",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "education",    "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "campus",       "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "faculty",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "edu",          "category": "core", "yield_score": 1.0, "is_active": True},
    # Benefits
    {"term": "discount",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "discounts",    "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "offer",        "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "offers",       "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "deal",         "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "deals",        "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "free",         "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "savings",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "save",         "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "pricing",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "promotion",    "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "promo",        "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "coupon",       "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "voucher",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "rebate",       "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "cashback",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "trial",        "category": "core", "yield_score": 1.0, "is_active": True},
    # Verticals
    {"term": "software",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "hardware",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "laptop",       "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "subscription", "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "streaming",    "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "cloud",        "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "storage",      "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "development",  "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "design",       "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "creative",     "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "productivity", "category": "core", "yield_score": 1.0, "is_active": True},
    {"term": "tools",        "category": "core", "yield_score": 1.0, "is_active": True},
]


def get_row_count(client: Client, table: str) -> int:
    """Return current row count for a table."""
    try:
        pk_col, _, _ = TABLE_PK[table]
        result = client.table(table).select(pk_col, count="exact").execute()
        return result.count or 0
    except Exception as e:
        return -1


def truncate_table(client: Client, table: str) -> int:
    """
    Delete all rows from a table. Returns number of rows deleted.
    Uses the PK filter appropriate for each table's key type.
    """
    pk_col, op, val = TABLE_PK[table]
    try:
        before = get_row_count(client, table)
        if before == 0:
            return 0

        q = client.table(table).delete()
        if op == "gte":
            q = q.gte(pk_col, val)
        elif op == "neq":
            q = q.neq(pk_col, val)
        q.execute()

        return before
    except Exception as e:
        print(f"  [!] Error clearing {table}: {e}")
        return 0


def seed_keywords(client: Client) -> int:
    """Re-seed the core keyword pool."""
    try:
        client.table("keyword_pool").upsert(
            CORE_KEYWORDS,
            on_conflict="term"
        ).execute()
        return len(CORE_KEYWORDS)
    except Exception as e:
        print(f"  [!] Error seeding keywords: {e}")
        return 0


def main():
    parser = argparse.ArgumentParser(description="Truncate all Supabase tables")
    parser.add_argument(
        "--no-seed", action="store_true",
        help="Skip re-seeding keyword_pool after cleanup"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show row counts only, make no changes"
    )
    args = parser.parse_args()

    # ── Validate credentials ─────────────────────────────────────
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[!] Missing SUPABASE_URL or SUPABASE_KEY in .env")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("=" * 60)
    print("  DATABASE CLEANUP")
    print(f"  Target: {SUPABASE_URL[:45]}...")
    print("=" * 60)

    # ── Dry run: just show counts ─────────────────────────────────
    if args.dry_run:
        print("\n[Dry Run] Current row counts:\n")
        total = 0
        for table in TABLES:
            count = get_row_count(client, table)
            flag = " ← empty" if count == 0 else ""
            print(f"  {table:<20} {count:>6} rows{flag}")
            total += max(count, 0)
        print(f"\n  {'TOTAL':<20} {total:>6} rows")
        print("\n[Dry Run] No changes made. Remove --dry-run to execute.")
        return

    # ── Confirm before proceeding ─────────────────────────────────
    print("\n[!] This will permanently delete all rows from all tables.")
    print("    keyword_pool will be re-seeded with 41 core keywords.")
    if args.no_seed:
        print("    --no-seed flag set: keyword_pool will be left EMPTY.")
    print()
    confirm = input("    Type 'yes' to continue: ").strip().lower()
    if confirm != "yes":
        print("\n[Aborted] No changes made.")
        sys.exit(0)

    # ── Truncate each table ───────────────────────────────────────
    print("\n[1] Clearing tables...\n")
    total_deleted = 0
    for table in TABLES:
        deleted = truncate_table(client, table)
        if deleted > 0:
            print(f"  ✓ {table:<20} {deleted} rows deleted")
        else:
            print(f"  - {table:<20} already empty")
        total_deleted += deleted

    print(f"\n  Total rows deleted: {total_deleted}")

    # ── Re-seed keywords ──────────────────────────────────────────
    if not args.no_seed:
        print("\n[2] Re-seeding keyword_pool...")
        seeded = seed_keywords(client)
        if seeded:
            print(f"  ✓ Seeded {seeded} core keywords")
        else:
            print("  [!] Keyword seeding failed")
    else:
        print("\n[2] Skipping keyword seed (--no-seed)")

    # ── Final counts ──────────────────────────────────────────────
    print("\n[3] Final row counts:\n")
    for table in TABLES:
        count = get_row_count(client, table)
        print(f"  {table:<20} {count:>6} rows")

    print("\n" + "=" * 60)
    print("  Cleanup complete.")
    print("=" * 60)


if __name__ == "__main__":
    main()
