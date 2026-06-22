```markdown name=README.md url=https://github.com/ITZkeerthu/web-agent-sttudent
# Web Agent — Student Benefits Scraper + Dashboard

A hardened web-scraping agent that discovers and scores student discounts/benefit pages, paired with a small React/Vite dashboard for inspection and basic monitoring. Built for controlled, low-impact crawling with strong deduplication, domain-trust scoring, and a bounded self-learning keyword pipeline.

- Purpose: find valid student offers across the web while minimizing spam, blocking, and unbounded growth.
- Audience: engineers running research/collection jobs or operators inspecting discovered offers through the included dashboard.
- License: MIT — use responsibly and respect sites' robots.txt and Terms of Service.

---

## Quick summary / What this repo contains

- agent_layer/ — Python-based scraping & agent layer (core collector, scoring, canonicalization, DB schema, docs).
- dashboard/ — Vite + React frontend and a minimal Node backend for serving the dashboard UI and simple APIs.
- agent_layer/docker-compose.yml, Dockerfile, and systemd service template for production deployment.

---

## Stack

- Languages: Python (agent), JavaScript/React (dashboard)
- Runtimes & frameworks:
  - Python 3.x, common libs via requirements.txt
  - React + Vite for the dashboard (Node 18+ recommended)
- Notable dependencies:
  - Supabase/Postgres as the persistent store (SQL schema included)
  - async HTTP / parsing libraries in Python (requirements.txt)
  - TailwindCSS, Vite, lucide-react on the frontend

---

## High-level architecture

1. Controlled keyword dataset -> query budget controller -> hardened DuckDuckGo scraper
2. Canonicalize and deduplicate URLs (SHA256 + multi-layer dedupe)
3. Async fetch + content extraction -> multi-factor scorer -> store offers/domains/keywords in Supabase
4. Dashboard reads backend API to show recent offers, keywords, domain trust, and basic metrics

The agent enforces strict caps (keyword cap, rate limits, concurrency limits), randomized timing, CAPTCHA detection/cooldown, and domain trust updates with decay/auto-blacklist.

---

## Repository layout

```
agent_layer/                 # Scraper & agent (Python)
  ARCHITECTURE.md            # Design & controller details
  QUICK_START.md             # Quickstart for agent
  SETUP_GUIDE.md             # Setup and config details
  README.md                  # Agent-specific README (detailed)
  engine.py                  # Main execution controller
  agent_core.py              # Core agent logic
  agent_engine.py            # Execution engine and loop
  agent_memory.py            # In-memory caching/dedupe layer
  agent_tools.py             # Helper utilities
  canonicalizer.py           # URL normalization + hashing
  fetcher.py                 # Async HTTP + extraction
  scraper.py                 # DuckDuckGo search + scraping
  scorer.py                  # Multi-factor offer scoring
  query_controller.py        # Query budget / learning / promotion
  database.py                # Supabase wrapper & caching
  schema.sql                 # DB DDL for Supabase / Postgres
  requirements.txt           # Python deps
  docker-compose.yml         # Local/compose deployment
  Dockerfile                 # Docker for agent
  quickstart.sh              # convenience script
  student-scraper.service    # systemd unit template
dashboard/                   # Frontend + small backend for dashboard
  package.json               # Frontend package & scripts
  src/                       # React + CSS (Vite)
  backend/                   # Minimal Node backend (server.js)
```

---

## Quickstart: run locally

Requirements:
- Python 3.10+ (or compatible 3.x)
- Node.js 18+ and npm
- A Supabase/Postgres instance (or Postgres-compatible DB) and credentials

1) Prepare Supabase / Postgres
- Create a project and run the SQL in `agent_layer/schema.sql` (or `schema_complete.sql`) in the SQL editor.

2) Agent (collector)
```bash
# from repo root
cd agent_layer

# install Python deps (use venv)
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# copy env template and edit for your Supabase URL / key and other settings
cp .env.example .env
# edit .env: SUPABASE_URL, SUPABASE_KEY, DATABASE_URL, and any other required vars

# run the agent (single run / cycle)
python engine.py

# or run via docker-compose
docker-compose up --build
```

Notes:
- See `SETUP_GUIDE.md` and `QUICK_START.md` inside agent_layer for more detailed setup, keys, and tuning.
- For production, use the `student-scraper.service` systemd unit or run in a container; the code includes cooldown and rate-limiting guards for safe operation.

3) Dashboard (UI + backend)
```bash
# install frontend deps
cd dashboard
npm install

# run the frontend dev server
npm run dev

# Run backend (if you want the Node backend)
cd dashboard/backend
cp .env.example .env
# edit .env as needed
npm install
node server.js
```

The dashboard is a Vite React app (TailwindCSS). The backend is intentionally minimal — adapt its env and API as necessary to point to Supabase or the agent's APIs.

---

## Configuration & sensible defaults

Important agent limits are declared in `agent_layer/config.py`:
- MAX_KEYWORDS: 500
- MAX_QUERIES_PER_CYCLE: 10
- MAX_CONCURRENCY: 3
- BATCH_SIZE: 50
- ARCHIVE_DAYS: 90
- MIN_SCORE_FOR_OFFER: 4
- HARD_REJECT_SPAM_SCORE: 6
- BLACKLIST_DOMAIN_SCORE: -10

Adjust carefully — the system's guarantees rely on these bounds to avoid overloading external sites and to limit resource usage.

---

## Monitoring & maintenance

The repo includes a few SQL snippets for quick checks (found in agent docs). Example queries to run in Supabase SQL Editor:
```sql
-- stats summary
select * from public.get_stats_summary();

-- active keywords
select * from keyword_pool where is_active = true order by yield_score desc;

-- recent offers
select * from offers order by discovered_at desc limit 10;

-- blacklisted domains
select * from domains where is_blacklisted = true;
```

Log messages and cooldown markers are written by the agent; when rate-limited or CAPTCHA detected you will see `[Scraper] Cooldown active` in logs.

---

## Safety, ethics, and legal notes

- This system is designed for low-impact discovery. Do not remove rate limits or randomized delays.
- Respect robots.txt and site Terms of Service. The maintainers disclaim responsibility for misuse.
- Use only for lawful, ethical research or operations.

---

## Tips & troubleshooting

- If the agent finds no URLs: check active keywords and yield scores (see SQL above).
- If you encounter CAPTCHAs or blocking: agent auto-triggers a 10-minute cooldown; review logs and consider lowering query rates.
- If memory is high: the in-memory cache auto-clears at configured thresholds; a restart will flush it.

---

## Contributing

Contributions are welcome:
- Open issues for bugs, suggestions, or missing integrations (Supabase improvements, additional extractors, etc).
- For code changes, follow the repo's style and add tests where appropriate. Provide clear PR descriptions that explain changes to limits or runtime behavior.

---

## Contact / Authors

See repository owners on GitHub for contact. Use issues for questions or to report operational problems.

---
```
