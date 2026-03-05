#!/usr/bin/env python3
"""
Demo/Quick Test - Single search without database.
Use this to verify scraper + scorer work before full deployment.
"""
import asyncio
import sys
sys.path.insert(0, '/home/vboxuser/.openclaw/workspace/student_scraper')

from scraper import DuckDuckGoScraper
from fetcher import fetcher, extractor
from canonicalizer import canonicalizer
from scorer import scorer
from config import Limits

async def demo_cycle():
    """Run one demo cycle - search, fetch, score, report."""
    print("="*60)
    print("Student Scraper - Demo Mode")
    print("="*60)
    print("\nThis will:")
    print("  1. Search DuckDuckGo for 'student discount'")
    print("  2. Fetch top 2-3 URLs")
    print("  3. Score content for student offers")
    print("  4. Print results\n")
    
    scraper = DuckDuckGoScraper()
    
    # Step 1: Search
    print("[1] Searching DuckDuckGo...")
    try:
        urls = await scraper.search("student discount software")
        print(f"  Found {len(urls)} URLs")
        
        if not urls:
            print("  ✗ No URLs found - possible rate limit")
            return
            
    except Exception as e:
        print(f"  ✗ Search failed: {e}")
        return
    
    # Truncate for demo
    urls = urls[:3]
    print(f"  Testing {len(urls)} URLs:")
    for u in urls:
        print(f"    - {u[:60]}...")
    
    # Step 2: Fetch
    print("\n[2] Fetching content...")
    fetched = await fetcher.fetch_batch(urls)
    print(f"  Successfully fetched {len(fetched)}/{len(urls)}")
    
    if not fetched:
        print("  ✗ No content retrieved")
        return
    
    # Step 3: Extract & Score
    print("\n[3] Analyzing content...")
    print("-"*60)
    
    for response in fetched:
        url = response['url']
        html = response['html']
        domain = canonicalizer.extract_domain(url)
        
        print(f"\nURL: {url[:70]}...")
        print(f"Domain: {domain}")
        
        # Extract
        content = extractor.extract(html, url)
        if not content:
            print("  Status: ✗ Extraction failed")
            continue
        
        # Score
        result = scorer.score_content(content)
        
        print(f"  Title: {content['title'][:60]}")
        print(f"  Links: {content['outbound_link_count']} outbound")
        print(f"  Score: {result.score} | Spam: {result.spam_score}")
        
        # Decision
        if result.is_hard_rejected:
            print("  Status: ✗ HARD REJECTED (spam)")
        elif result.is_offer:
            print("  Status: ✓ VALID OFFER")
            print(f"  Benefits found: {result.matches.get('benefits', [])[:3]}")
        else:
            print("  Status: ✗ Not an offer (score too low)")
    
    print("\n" + "="*60)
    print("Demo complete!")
    print("="*60)
    print("\n[Next Steps]")
    print("1. Create tables: https://your-project-id.supabase.co")
    print("2. Run: python3 test.py")
    print("3. Run: python3 engine.py")

if __name__ == "__main__":
    asyncio.run(demo_cycle())
