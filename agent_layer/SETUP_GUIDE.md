# Setup Guide — Fresh Installation

This guide walks you through setting up the Student Scraper project on a new system from scratch.

---

## Prerequisites

**System Requirements:**
- Python 3.10 or higher
- Pip package manager
- Internet connection (for dependencies and external APIs)
- ~500 MB disk space

**Accounts Required (Free tier OK):**
1. **Supabase** — PostgreSQL database (free tier included)
2. **NVIDIA API** — For the AI agent (free tier available)

---

## Step-by-Step Setup

### 1. Clone/Copy the Project

```bash
# Navigate to your workspace
cd /path/to/your/workspace

# If cloning from git:
git clone <repo-url> student_scraper
cd student_scraper

# OR: If copy-pasting the folder:
cp -r /path/to/source/student_scraper .
cd student_scraper
```

Verify you see these files:
```bash
ls -la
# Should show: agent_engine.py, engine.py, config.py, database.py, etc.
```

---

### 2. Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
# On Linux/Mac:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Verify activation (should show (venv) in prompt)
which python3
```

---

### 3. Install Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install all required packages
pip install -r requirements.txt
```

Expected output: Successfully installed ~20 packages (aiohttp, beautifulsoup4, supabase, langchain, etc.)

Verify installation:
```bash
python3 -c "import aiohttp; import supabase; import langchain_nvidia_ai_endpoints; print('✓ All imports OK')"
```

---

### 4. Set Up Supabase Database

#### A. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **Sign Up** (free tier is fine)
3. Create a new project:
   - **Project name:** `student_scraper` (or your choice)
   - **Database password:** Save this securely
   - **Region:** Choose closest to you
4. Wait for project to initialize (~2 min)

#### B. Get Credentials

Once initialized, you'll see your project dashboard:

1. Click **Settings** (bottom left) → **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **Service Role Secret** (under `service_role`) → `SUPABASE_KEY`

Example:
```
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_KEY = your-service-role-key-here
```

#### C. Create Database Tables

You have **two options**:

**Option 1: Automatic (Recommended)**
```bash
python3 setup.py
# This will:
# - Create all 7 tables
# - Seed 41 core keywords
# - Set up indexes
```

**Option 2: Manual**
1. Go to Supabase dashboard → **SQL Editor**
2. Click **New Query**
3. Copy-paste the contents of `schema.sql` (or `schema_complete.sql`)
4. Click **Run**

Verify tables were created:
```bash
# In Supabase dashboard, go to Table Editor
# You should see: processed_urls, offers, domains, keyword_pool, learned_terms, archived_urls, system_stats
```

---

### 5. Set Up Environment Variables

#### A. Copy Example File

```bash
cp .env.example .env
```

#### B. Edit `.env` with Your Credentials

```bash
nano .env
# (or use your preferred editor)
```

Fill in these required values:

```env
# === SUPABASE ===
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here

# === NVIDIA AI ENDPOINTS (for agent mode) ===
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxx
```

#### C. Get NVIDIA API Key

1. Go to [nvidia.com/ai](https://nvidia.com/ai)
2. Sign up for **NVIDIA AI Endpoints** (free tier available)
3. Navigate to **API Keys**
4. Create a new key or copy existing key
5. Paste into `.env` as `NVIDIA_API_KEY`

Example:
```env
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### D. Verify `.env` is Loaded

```bash
python3 -c "from config import SUPABASE_URL; print('✓ Credentials loaded:', SUPABASE_URL[:30])"
```

---

### 6. Test the Setup

#### A. Run the Test Suite

```bash
python3 test.py
```

Expected output:
```
test_entity_scoring ... ok
test_benefit_scoring ... ok
...
------
Ran 8 tests in 0.123s
OK
```

If tests fail, check:
- `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`
- Database tables exist (check Supabase dashboard)
- All packages installed (`pip list | grep -E 'aiohttp|supabase|langchain'`)

#### B. Run the Demo

```bash
python3 run_demo.py
```

Expected output:
```
[Scraper] Query: 'student software deals...' | Status: 200
[Scraper] Found 10 URLs
[Extractor] Processing: https://github.com/...
[Scorer] Score: 7, is_offer: True
[Demo] ✓ Found offer: GitHub ...
```

If demo fails:
- Check internet connection
- Verify Supabase credentials in `.env`
- Check DuckDuckGo isn't blocked (try `curl -I https://duckduckgo.com`)

#### C. Quick Database Check

```bash
python3 -c "
import asyncio
from database import SupabaseStore

async def check():
    db = SupabaseStore()
    count = await db.count_offers()
    total = await db.count_processed()
    print(f'✓ Database OK: {total} URLs processed, {count} offers found')

asyncio.run(check())
"
```

---

### 7. Run the Project

#### Option A: Autonomous Agent (Recommended)

```bash
# Start the LLM-driven agent
python3 agent_engine.py

# Output:
# ============================================================
#   GOAL-ORIENTED AUTONOMOUS WEB AGENT
#   Objective: Discover legitimate student benefits
#   Model: moonshotai/kimi-k2-instruct (NVIDIA)
# ============================================================
#
# [AgentEngine] Initializing database...
# [Agent] Cycle #1 | 2026-03-03T15:23:45.123456
# ...
```

The agent will:
- Run 15 actions per cycle (~150 sec)
- Sleep 15-25 min between cycles
- Continue indefinitely until stopped (`Ctrl+C`)
- Discover student software deals and store in `offers` table

#### Option B: Deterministic Mode (Baseline)

```bash
# Start the rule-based crawler
python3 engine.py

# This mode uses fixed queries instead of LLM reasoning
```

#### Option C: Run in Background (Linux/Mac)

```bash
# Start in background
nohup python3 agent_engine.py > scraper.log 2>&1 &

# Monitor progress
tail -f scraper.log

# Stop it later
pkill -f agent_engine.py
```

#### Option D: Run with Systemd Service (Optional)

```bash
# Create service file (requires sudo)
sudo nano /etc/systemd/system/student-scraper.service
```

Paste:
```ini
[Unit]
Description=Student Scraper Agent
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/student_scraper
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python3 agent_engine.py
Restart=on-failure
RestartSec=300

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable student-scraper
sudo systemctl start student-scraper
sudo systemctl status student-scraper

# View logs
journalctl -u student-scraper -f
```

---

### 8. Monitor Results

#### View Discovered Offers

```bash
# Connect to Supabase
# Option 1: Via dashboard
# Go to Supabase → Table Editor → offers table

# Option 2: Via Python
python3 -c "
import asyncio
from database import SupabaseStore

async def show_offers():
    db = SupabaseStore()
    offers = db.client.table('offers').select('*').limit(10).execute()
    for offer in offers.data:
        print(f\"✓ {offer['domain']}: {offer['title']}\")

asyncio.run(show_offers())
"
```

#### Check Cycle Progress

The agent prints to stdout:
```
[Agent] Cycle #1 | 2026-03-03T15:23:45
[Agent] ✓ Offer: https://github.com/education/...
[Agent] Decision: deep_crawl — ...
[Agent] Cycle #1 complete: 15 actions, 12 offers, 171.0s
[AgentEngine] Cumulative: 1 cycles, 12 offers, runtime: 0:02:51
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'aiohttp'"

**Solution:**
```bash
# Ensure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### "Invalid credentials" or "Unauthorized" (Supabase)

**Solution:**
```bash
# Check .env file exists
cat .env | grep SUPABASE

# Verify values in Supabase dashboard:
# - Go to Settings → API
# - Copy exact values (no extra spaces)
# - Re-save .env and retry
```

### "Connection refused" or Network errors

**Solution:**
```bash
# Test internet connectivity
curl -I https://duckduckgo.com
curl -I https://api.nvidia.com

# Check firewall isn't blocking port 443
# If behind proxy, configure in config.py

# Try the demo
python3 run_demo.py
```

### "Rate limit exceeded" from NVIDIA

**Solution:**
- Free tier: 60 LLM calls per hour
- Agent uses 1-5 calls per cycle
- Space out runs or use deterministic mode
- Reduce `Limits.MAX_QUERIES_PER_CYCLE` in config.py

### "No offers found" after running

**Solution:**
1. Check Supabase tables are created: `python3 setup.py`
2. Run the demo: `python3 run_demo.py`
3. If demo finds offers, agent will too (may take a few cycles)
4. Give it time — agent learns and improves each cycle

### Database "Tables don't exist"

**Solution:**
```bash
# Run setup script
python3 setup.py

# If still fails, manually create via SQL:
# 1. Supabase → SQL Editor → New Query
# 2. Paste contents of schema.sql
# 3. Run
```

### Agent "stuck sleeping" or "slow"

**This is normal.** The agent:
- Sleeps 15-25 min between cycles (to avoid rate limits)
- Takes ~2-4 min per cycle (150+ sec for 15 actions)
- Gets smarter each cycle (more targeted queries)

To speed up for testing:
```python
# In agent_engine.py, line ~60:
sleep_minutes = random.randint(1, 2)  # Change from (15, 25)

# Then test with shorter cycles
python3 agent_engine.py
```

---

## Configuration Tuning (Optional)

After setup works, you can tune behavior in `config.py`:

```python
# Scoring thresholds
Thresholds.MIN_SCORE_FOR_OFFER = 4        # Lower = more results, more noise
Thresholds.HARD_REJECT_SPAM_SCORE = 6     # Lower = stricter spam filter

# Concurrency
Limits.MAX_CONCURRENCY = 3                # Higher = faster, more resource use
Limits.MAX_RETRIES = 3                    # Higher = more patient with failures

# Timing
Timing.SEARCH_MIN_INTERVAL = 8.0           # Seconds between searches (rate limit)
Timing.CYCLE_MIN_SLEEP = 15                # Minutes between agent cycles

# Agent reasoning
# In agent_core.py:
SYSTEM_PROMPT = "..."                      # Customize agent instructions
```

For most users: **leave defaults as-is.**

---

## What to Expect

### Timeline

- **Day 1:** Setup + first cycle = 12-20 offers discovered
- **Week 1:** ~50-100 offers (agent learns verticals)
- **Month 1:** ~200+ offers (diverse sources, refined queries)

### Typical Results

```
Sample offers discovered:
✓ GitHub Student Pack (github.com)
✓ Microsoft 365 Student (microsoft.com)
✓ Google Cloud for Students (cloud.google.com)
✓ JetBrains Student License (jetbrains.com)
✓ Adobe Creative Cloud Student (adobe.com)
✓ AWS Educate (aws.amazon.com)
✓ Datadog Student (datadog.com)
```

### Database Size

- Each processed URL: ~200 bytes
- Each offer: ~500 bytes
- After 1 month: ~50-100 MB database (free tier: 1 GB)

---

## Next Steps

1. **Let it run:** The agent improves each cycle
2. **Monitor logs:** `tail -f scraper.log` or Supabase dashboard
3. **Export results:** 
   ```sql
   -- Query all offers
   SELECT domain, title, benefits_found, score, discovered_at 
   FROM offers 
   ORDER BY discovered_at DESC 
   LIMIT 100;
   ```
4. **Slack/Email alerts:** Add webhooks to Supabase triggers
5. **Web dashboard:** Build a frontend from the `offers` table

---

## Quick Reference

```bash
# Activate environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python3 setup.py

# Test everything
python3 test.py
python3 run_demo.py

# Run agent
python3 agent_engine.py

# Run deterministic mode
python3 engine.py

# Check database
python3 -c "import asyncio; from database import SupabaseStore; \
asyncio.run(SupabaseStore().count_offers())" 

# Monitor background process
tail -f scraper.log
ps aux | grep python3
```

---

## Support

If stuck:
1. Check `.env` file (SUPABASE_URL, SUPABASE_KEY, NVIDIA_API_KEY)
2. Run `python3 test.py` for diagnostics
3. Check internet connectivity: `curl -I https://duckduckgo.com`
4. Verify Supabase tables exist
5. Read error messages carefully — they usually point to the issue

Happy scraping! 🚀
