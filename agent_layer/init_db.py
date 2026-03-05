#!/usr/bin/env python3
"""
Initialize Supabase database using service role key.
Uses raw HTTP to execute DDL statements.
"""
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip('/')
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def check_connection():
    """Check if we can connect to Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/keyword_pool?limit=0"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        return resp.status_code in [200, 404]
    except Exception as e:
        print(f"Connection error: {e}")
        return False

def get_project_ref():
    """Extract project ref from URL."""
    # https://your-project-id.supabase.co -> your-project-id
    parts = SUPABASE_URL.split('.')
    if len(parts) >= 1:
        return parts[0].replace('https://', '')
    return None

def create_tables_via_management_api():
    """Attempt to create tables via Supabase Management API."""
    print("Attempting to create tables via Management API...")
    print("This requires your Management API key, not the service_role key.")
    print("If this fails, you'll need to manually run schema_complete.sql")
    
    # This requires a management API token which is different from service_role
    # Most users won't have this, so we'll provide instructions
    return False

def generate_sql_curl_command():
    """Generate curl command to run SQL."""
    sql_file = '/home/vboxuser/.openclaw/workspace/student_scraper/schema_complete.sql'
    
    if not os.path.exists(sql_file):
        print(f"SQL file not found: {sql_file}")
        return None
    
    with open(sql_file, 'r') as f:
        sql = f.read()
    
    # Escape for curl
    escaped_sql = sql.replace('"', '\\"').replace('\n', '\\n')
    
    cmd = f'''curl -X POST \\
  {SUPABASE_URL}/rest/v1/rpc/exec_sql \\
  -H "apikey: {SUPABASE_KEY[:10]}..." \\
  -H "Authorization: Bearer {SUPABASE_KEY[:10]}..." \\
  -H "Content-Type: application/json" \\
  -d '{{"query": "{escaped_sql[:100]}..."}}' '''
    
    return cmd

def print_manual_instructions():
    """Print instructions for manual setup."""
    print("\n" + "="*70)
    print("MANUAL SETUP REQUIRED")
    print("="*70)
    print("\nSupabase tables must be created via the Dashboard SQL Editor.")
    print("\nSteps:")
    print("1. Go to: https://supabase.com/dashboard/project/_/sql/new")
    print("   Or: https://your-project-id.supabase.co/project/_/sql/new")
    print("\n2. Open this file in a text editor:")
    print("   /home/vboxuser/.openclaw/workspace/student_scraper/schema_complete.sql")
    print("\n3. Copy the entire contents (Ctrl+A, Ctrl+C)")
    print("\n4. Paste into the Supabase SQL Editor")
    print("\n5. Click 'Run' (top right)")
    print("\n6. Verify success:")
    print("   SELECT COUNT(*) FROM keyword_pool;")
    print("   Should return: 50")
    print("\n" + "="*70)
    
def check_tables_exist():
    """Check if tables exist."""
    tables = [
        "processed_urls", "archived_urls", "domains",
        "offers", "keyword_pool", "learned_terms", "system_stats"
    ]
    existing = []
    missing = []
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    for table in tables:
        url = f"{SUPABASE_URL}/rest/v1/{table}?limit=0"
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                existing.append(table)
            elif resp.status_code == 404:
                missing.append(table)
            else:
                print(f"  {table}: HTTP {resp.status_code}")
                missing.append(table)
        except Exception as e:
            print(f"  {table}: Error - {e}")
            missing.append(table)
    
    return existing, missing

def main():
    print("="*70)
    print("Supabase Database Initialization")
    print("="*70)
    print(f"\nProject URL: {SUPABASE_URL}")
    print(f"Service Key: {SUPABASE_KEY[:20]}...{SUPABASE_KEY[-10:]}")
    print()
    
    # Check connection
    print("Checking connection...")
    if not check_connection():
        print("✗ Cannot connect to Supabase. Check URL and key.")
        sys.exit(1)
    print("✓ Connection OK")
    print()
    
    # Check tables
    print("Checking existing tables...")
    existing, missing = check_tables_exist()
    
    print(f"\n  Existing tables ({len(existing)}):")
    for t in existing:
        print(f"    ✓ {t}")
    
    if missing:
        print(f"\n  Missing tables ({len(missing)}):")
        for t in missing:
            print(f"    ✗ {t}")
        
        print_manual_instructions()
        
        # Show SQL preview
        print("\nSQL Preview (first 20 lines):")
        with open('/home/vboxuser/.openclaw/workspace/student_scraper/schema_complete.sql', 'r') as f:
            lines = f.readlines()[:20]
            for line in lines:
                print(line.rstrip())
        print("   ...")
        
        return False
    else:
        print("\n✓ All tables exist!")
        
        # Check keyword count
        url = f"{SUPABASE_URL}/rest/v1/keyword_pool?select=*"
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                count = len(resp.json())
                print(f"\n✓ Keywords in pool: {count}")
                if count < 10:
                    print("  [!] Warning: Low keyword count, seed may be needed")
        except:
            pass
        
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
