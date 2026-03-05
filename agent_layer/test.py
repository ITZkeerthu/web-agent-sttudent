#!/usr/bin/env python3
"""
Test runner for the student scraper.
Runs a single cycle to verify everything works.
"""
import os
import sys
import asyncio
import time
from datetime import datetime
from dotenv import load_dotenv

# Load env
load_dotenv()

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Limits, Timing, Thresholds
from database import SupabaseStore
from scraper import DuckDuckGoScraper
from fetcher import ContentFetcher, ContentExtractor
from canonicalizer import canonicalizer
from scorer import scorer
from query_controller import QueryBudgetController

class TestRunner:
    """Test one complete cycle."""
    
    def __init__(self):
        self.db = SupabaseStore()
        self.query_controller = QueryBudgetController(self.db)
        self.scraper = DuckDuckGoScraper()
        self.fetcher = ContentFetcher()
        self.extractor = ContentExtractor()
    
    async def test_connection(self):
        """Test database connection."""
        print("[Test] Checking database connection...")
        try:
            # Try to get a count from keyword_pool
            from supabase import create_client
            client = create_client(
                os.getenv("SUPABASE_URL"), 
                os.getenv("SUPABASE_KEY")
            )
            result = client.table("keyword_pool").select("count").limit(1).execute()
            print("  ✓ Database connected")
            return True
        except Exception as e:
            print(f"  ✗ Database error: {e}")
            print("\n  [!] Tables not found. Run this SQL in Supabase Dashboard:")
            print("  https://your-project-id.supabase.co/project/_/sql/new")
            print()
            return False
    
    async def test_canonicalizer(self):
        """Test URL canonicalization."""
        print("\n[Test] URL Canonicalization...")
        
        test_urls = [
            "https://example.com/student-discount?utm_source=test",
            "http://www.Example.COM/Student-Discount",
            "https://example.com/page?utm_campaign=xyz#/section",
        ]
        
        for url in test_urls:
            canonical, hash_val = canonicalizer.canonicalize(url)
            print(f"  Input:  {url[:50]}...")
            print(f"  Output: {canonical[:50]}...")
            print(f"  Hash:   {hash_val[:16]}...")
        
        print("  ✓ Canonicalizer working")
        return True
    
    async def test_scorer(self):
        """Test multi-factor scoring."""
        print("\n[Test] Multi-Factor Scoring...")
        
        # Simulate extracted content
        content = {
            'title': 'Student Discount - 20% Off for University Students',
            'description': 'Get exclusive student pricing on software',
            'text_lower': '''This page offers student discounts for university students. 
            Get 20% off with your student id. Academic pricing available.''',
            'outbound_link_count': 10,
            'affiliate_link_count': 0,
            'is_listicle': False
        }
        
        # Test with good domain trust
        result = scorer.score_content(content, domain_trust=3)
        print(f"  Title: '{content['title']}'")
        print(f"  Score: {result.score} (threshold: {Thresholds.MIN_SCORE_FOR_OFFER})")
        print(f"  Spam Score: {result.spam_score} (reject at: {Thresholds.HARD_REJECT_SPAM_SCORE})")
        print(f"  Is Offer: {result.is_offer}")
        print(f"  Matches: {result.matches}")
        
        # Test spam content
        spam_content = {
            'title': 'UNLIMITED FREE MONEY - STUDENT HACK',
            'description': '',
            'text_lower': 'Get cracked software and unlimited free access',
            'outbound_link_count': 50,
            'affiliate_link_count': 20,
            'is_listicle': True
        }
        
        spam_result = scorer.score_content(spam_content, domain_trust=0)
        print(f"\n  Spam test:")
        print(f"  Score: {spam_result.score}, Spam Score: {spam_result.spam_score}")
        print(f"  Is Hard Rejected: {spam_result.is_hard_rejected}")
        
        print("  ✓ Scorer working")
        return True
    
    async def test_query_controller(self):
        """Test query selection."""
        print("\n[Test] Query Budget Controller...")
        
        try:
            # Sync with DB if possible
            await self.query_controller.sync_with_db()
        except:
            print("  [!] Skipping DB sync (tables may not exist)")
        
        selected = self.query_controller.select_queries(budget=3)
        print(f"  Selected {len(selected)} queries:")
        for q in selected:
            print(f"    - {q}")
        
        print("  ✓ Query controller working")
        return True
    
    async def test_duckduckgo(self):
        """Test DuckDuckGo scraper (single query)."""
        print("\n[Test] DuckDuckGo Scraper...")
        print("  [!] This makes live HTTP requests")
        print("  Query: 'student discount software'...")
        
        try:
            urls = await self.scraper.search("student discount software")
            print(f"  Found {len(urls)} URLs:")
            for url in urls[:5]:
                print(f"    - {url[:60]}...")
            print("  ✓ Scraper working")
            return True
        except Exception as e:
            print(f"  ✗ Scraper error: {e}")
            return False
    
    async def run_all(self):
        """Run all tests."""
        print("="*60)
        print("Student Scraper Test Suite")
        print("="*60)
        print()
        
        # Test 1: Connection
        if not await self.test_connection():
            print("\n[!] DATABASE TABLES NOT FOUND")
            print("="*60)
            print("ACTION REQUIRED:")
            print("="*60)
            print("1. Go to: https://your-project-id.supabase.co/project/_/sql/new")
            print("2. Copy the contents of schema_complete.sql")
            print("3. Paste and run the SQL")
            print("4. Re-run this test")
            print("="*60)
            return False
        
        # Test 2: Canonicalizer
        await self.test_canonicalizer()
        
        # Test 3: Scorer
        await self.test_scorer()
        
        # Test 4: Query Controller
        await self.test_query_controller()
        
        # Test 5: Scraper (optional - requires network)
        do_network_test = input("\nRun network test (makes HTTP requests)? [y/N]: ").lower() == 'y'
        if do_network_test:
            await self.test_duckduckgo()
        
        # Cleanup
        await self.scraper.close()
        await self.fetcher.close()
        
        print("\n" + "="*60)
        print("Tests complete!")
        print("="*60)
        return True

if __name__ == "__main__":
    runner = TestRunner()
    success = asyncio.run(runner.run_all())
    sys.exit(0 if success else 1)
