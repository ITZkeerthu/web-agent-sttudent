#!/bin/bash
# Setup and run commands for Student Scraper

echo "==============================================="
echo "Student Scraper - Quick Commands"
echo "==============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Create Database Tables (REQUIRED FIRST)${NC}"
echo "   URL: https://your-project-id.supabase.co/project/_/sql/new"
echo "   File: schema_complete.sql"
echo ""

echo -e "${YELLOW}2. Install Dependencies${NC}"
echo "   pip install -r requirements.txt"
echo ""

echo -e "${YELLOW}3. Test (No database needed)${NC}"
echo "   python3 run_demo.py"
echo ""

echo -e "${YELLOW}4. Test (With database)${NC}"
echo "   python3 test.py"
echo ""

echo -e "${YELLOW}5. Run Scraper${NC}"
echo "   python3 engine.py"
echo ""

echo -e "${YELLOW}6. Docker Deploy${NC}"
echo "   docker-compose up -d"
echo ""

echo -e "${YELLOW}7. Systemd Install${NC}"
echo "   sudo cp student-scraper.service /etc/systemd/system/"
echo "   sudo systemctl enable student-scraper"
echo "   sudo systemctl start student-scraper"
echo "   sudo journalctl -u student-scraper -f"
echo ""

# Check if tables exist
echo -e "${YELLOW}Checking database...${NC}"
python3 -c "
import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()

try:
    client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    result = client.table('keyword_pool').select('count').limit(1).execute()
    print(f'  {GREEN}✓ Database connected - tables exist{NC}')
    
    count = client.table('keyword_pool').select('*', count='exact').limit(1000).execute()
    print(f'  {GREEN}✓ Keywords found: {count.count}{NC}')
except Exception as e:
    print(f'  {RED}✗ Tables not found - run schema_complete.sql first{NC}')
"

echo ""
echo "==============================================="
