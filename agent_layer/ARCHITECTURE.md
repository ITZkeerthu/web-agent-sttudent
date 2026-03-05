# Student Scraper — Architecture Diagram

## System Overview

The system operates in **two modes**: Deterministic (engine.py) and Autonomous Agent (agent_engine.py). Both share the same data layer and core processing modules.

```

┌─────────────────┐                 ┌─────────────────┐
│  MANUAL MODE    │                 │  AGENT MODE     │
│  engine.py      │                 │  agent_engine.py│
└─────────────────┘                 └─────────────────┘
       ↓                                   ↓
 - Fixed queries                    - LLM decides queries
 - Search DuckDuckGo            →   - Search DuckDuckGo
 - Fetch URLs                    →   - Fetch URLs
 - Score pages                   →   - Score pages
 - Store in Supabase            →   - Store in Supabase
       ↓                                   ↓
  OFFERS TABLE                       OFFERS TABLE

  
┌───────────────────────────────────────────────────────────────────────────────────┐
│                   EXECUTION MODES (Choose One)                                    │
├─────────────────────────────────────────────┬───────────────────────────────────┤
│  DETERMINISTIC MODE                         │  AUTONOMOUS AGENT MODE            │
│  (engine.py)                                │  (agent_engine.py)                │
│                                             │                                   │
│  ExecutionController                        │  AgentExecutionController         │
│  ├─ QueryBudgetController                   │  ├─ AgentReasoningCore            │
│  ├─ CoOccurrenceLearner                     │  │  ├─ AgentMemory                │
│  ├─ KeywordPruningEngine                    │  │  ├─ ToolRegistry               │
│  └─ Runs fixed query loops per cycle        │  │  └─ ReAct Loop:                │
│                                             │  │     Observe→Reason→Act→Eval    │
│  Query → Search → Browse → Score → Store    │  │                                │
│  (linear pipeline)                          │  │  AgentLLM                       │
│                                             │  │  ├─ NVIDIA AI Endpoints         │
│                                             │  │  ├─ Kimi K2 Model              │
│                                             │  │  └─ JSON reasoning              │
│                                             │  │                                │
│                                             │  └─ Strategic tool selection:     │
│                                             │     • search_web                  │
│                                             │     • browse_page                 │
│                                             │     • expand_keywords             │
│                                             │     • deep_crawl                  │
│                                             │     • query_stats                 │
└─────────────────────────────────────────────┴───────────────────────────────────┘
```

---

## Data Processing Pipeline

```
                    INPUT LAYER
┌──────────────────────────────────┐
│   DuckDuckGo Search Results      │
│   (via scraper.py)               │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  SCRAPER: DuckDuckGoScraper              │
│  ├─ Rate limiting: 1 req / 8-12 sec     │
│  ├─ CAPTCHA detection & avoidance        │
│  ├─ Automatic cooldown on 429/403        │
│  └─ HTML parsing with BeautifulSoup      │
└──────────────┬───────────────────────────┘
               │ URLs (raw)
               ▼
┌──────────────────────────────────────────┐
│  CANONICALIZER: URLCanonicalizer         │
│  ├─ Normalize scheme (http→https)        │
│  ├─ Remove www prefix                    │
│  ├─ Strip tracking parameters            │
│  ├─ Lowercase paths & domains            │
│  └─ SHA256 hashing for deduplication     │
└──────────────┬───────────────────────────┘
               │ Canonical URLs + hashes
               ▼
┌──────────────────────────────────────────┐
│  DEDUPLICATION / CACHE CHECK             │
│  ├─ Memory cache (~200k URLs)            │
│  ├─ Database processed_urls table        │
│  └─ Blacklist check                      │
└──────────────┬───────────────────────────┘
               │ New URLs
               ▼
┌──────────────────────────────────────────┐
│  FETCHER: ContentFetcher                 │
│  ├─ Max concurrency: 2-3 requests        │
│  ├─ Rate limit: 1 req/sec per worker     │
│  ├─ Retry with exponential backoff       │
│  ├─ HTTPS only (skip non-HTTPS)          │
│  └─ Timeout: 10 seconds                  │
└──────────────┬───────────────────────────┘
               │ Raw HTML
               ▼
┌──────────────────────────────────────────┐
│  EXTRACTOR: ContentExtractor             │
│  ├─ Parse HTML DOM                       │
│  ├─ Extract text content                 │
│  ├─ Extract metadata (title, desc, og)   │
│  ├─ Count outbound links                 │
│  └─ Filter out listicles (reject >30)    │
└──────────────┬───────────────────────────┘
               │ Structured content
               ▼
┌──────────────────────────────────────────┐
│  SCORER: MultiFactorScorer               │
│  ├─ Entity matching (software, tools...)│
│  ├─ Benefit matching (free, discount...)│
│  ├─ Program phrase detection             │
│  ├─ Spam keyword detection               │
│  ├─ Domain trust bonus                   │
│  └─ Hard reject if spam_score > 6        │
│                                          │
│  Output: ScoreResult                     │
│  ├─ score: 0-10                          │
│  ├─ is_offer: bool (score >= 4)          │
│  ├─ is_hard_rejected: bool               │
│  ├─ benefits_found: []                   │
│  └─ matches: {entity, benefit, program}  │
└──────────────┬───────────────────────────┘
               │ Scored pages
               ▼
        OUTPUT LAYER
┌──────────────────────────────────────────┐
│  DECISION LOGIC                          │
│                                          │
│  If score >= 4 && not hard_rejected:    │
│  └─ Store in offers table                │
│     └─ Update domain trust (+0.5)        │
│                                          │
│  If hard_rejected:                       │
│  └─ Blacklist domain (trust -= 1.5)     │
│                                          │
│  Always:                                 │
│  └─ Store in processed_urls table        │
└──────────────┬───────────────────────────┘
               │
               ▼
        DATABASE (Supabase/PostgreSQL)
```

---

## Agent Architecture (ReAct Loop)

```
                    ┌───────────────────────────────┐
                    │  agent_engine.py              │
                    │  AgentExecutionController     │
                    │  └─ run_forever()             │
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │  agent_core.py                │
                    │  AgentReasoningCore           │
                    └──────────────┬────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
    ┌─────────┐            ┌──────────────┐        ┌────────────────┐
    │ OBSERVE │            │    REASON    │        │   EVALUATE     │
    ├─────────┤            ├──────────────┤        ├────────────────┤
    │         │            │              │        │                │
    │ Query   │            │ Send context │        │ Process results│
    │ DB for: │     →      │ to LLM       │   →    │ and auto-      │
    │         │            │              │        │ pipeline       │
    │ • URLs  │            │ LLM returns: │        │ browse→score   │
    │ • Offers│            │ • reasoning  │        │                │
    │ • Stats │            │ • action     │        │ Store offers   │
    │ • Yield │            │ • parameters │        │ Update domains │
    │         │            │              │        │                │
    │ Result: │            └──────────────┘        │ Next cycle:    │
    │ Agents- │                                    │ search new     │
    │ tate    │                  ↑                  │ queries        │
    │         │                  │                 │                │
    │ ↓       │                  │                 │ Result:        │
    │ Return  │            ┌──────────────┐        │ ToolResult     │
    │ context │            │  agent_tools │        │                │
    │ prompt  │            │  .py         │        └────────────────┘
    └─────────┘            │              │              │
                           │ ToolRegistry │              │
                           │              │              │
                           │ • search_web │              │
                           │ • browse_page│              │
                           │ • expand_kw  │              │
                           │ • deep_crawl │              │
                           │ • query_stats│              │
                           │              │              │
                           └──────────────┘              │
                                  │                     │
                                  └─────────────────────┘

        OBSERVATION CONTEXT BUILT BY agent_memory.py:
        ┌─────────────────────────────────────────────┐
        │ AgentMemory                                 │
        │ ├─ Cycle number & actions taken            │
        │ ├─ Total URLs processed & offers found     │
        │ ├─ Active keywords                         │
        │ ├─ Top domains by trust                    │
        │ ├─ Recent offers discovered                │
        │ ├─ Yield rate (offers/cycle)               │
        │ ├─ Discovery trend (↑/↓)                   │
        │ ├─ Spam detection rate                     │
        │ └─ Decision history                        │
        └─────────────────────────────────────────────┘

        LLM INTEGRATION:
        ┌─────────────────────────────────────────────┐
        │ llm_client.py                               │
        │ ├─ ChatNVIDIA (NVIDIA AI Endpoints)        │
        │ ├─ Model: moonshotai/kimi-k2-instruct      │
        │ ├─ Temp: 0.6, top_p: 0.9                   │
        │ ├─ Max tokens: 2048                        │
        │ ├─ Rate limit: 60 calls/hour               │
        │ ├─ JSON response parsing                   │
        │ └─ AgentLLM.reason() → LLMResponse         │
        └─────────────────────────────────────────────┘
```

---

## Tool Execution Flow (Auto-Pipeline)

```
Agent Tool Result → Auto-Process Chain (no LLM needed)

search_web result:
  └─ For each URL:
     ├─ Canonicalize & dedup check
     ├─ Domain blacklist check
     ├─ browse_page (fetch content)
       │ └─ ContentFetcher + Extractor
     ├─ score_page (auto)
       │ └─ MultiFactorScorer
     ├─ If offer (score >= 4):
       │ ├─ Insert into offers table
       │ ├─ Update domain trust +0.5
       │ └─ Print result ✓
       │
       └─ Store in processed_urls

deep_crawl result:
  └─ For each priority link:
     ├─ Similar flow as search_web
     └─ Print deep crawl offer ✓

expand_keywords result:
  └─ Store new queries for next cycle

query_stats result:
  └─ Display database statistics

browse_page result:
  └─ Direct browse (single URL)
     └─ Auto-score and store if offer
```

---

## Database Schema (Supabase PostgreSQL)

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE TABLES                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  processed_urls                                            │
│  ├─ url_hash (UNIQUE, PRIMARY KEY)                         │
│  ├─ canonical_url                                          │
│  ├─ domain                                                 │
│  ├─ processed_at (timestamp)                               │
│  ├─ score (0-10)                                           │
│  ├─ spam_score (0-10)                                      │
│  └─ is_offer (boolean)                                     │
│                                                             │
│  offers ⭐ (Main result table)                              │
│  ├─ id (PRIMARY KEY)                                       │
│  ├─ domain                                                 │
│  ├─ url                                                    │
│  ├─ title                                                  │
│  ├─ description                                            │
│  ├─ benefits_found (JSONB array)                           │
│  ├─ score (0-10)                                           │
│  └─ discovered_at (timestamp)                              │
│                                                             │
│  domains                                                   │
│  ├─ domain (UNIQUE, PRIMARY KEY)                           │
│  ├─ trust_score (-10.0 to +10.0)                           │
│  ├─ last_seen (timestamp)                                  │
│  ├─ offer_count (integer)                                  │
│  ├─ spam_count (integer)                                   │
│  └─ is_blacklisted (boolean)                               │
│                                                             │
│  keyword_pool                                              │
│  ├─ id (PRIMARY KEY)                                       │
│  ├─ term (UNIQUE)                                          │
│  ├─ category ('core', 'learned')                           │
│  ├─ yield_score (0.0-1.0)                                  │
│  ├─ usage_count (integer)                                  │
│  ├─ last_used (timestamp)                                  │
│  └─ is_active (boolean)                                    │
│                                                             │
│  learned_terms                                             │
│  ├─ id (PRIMARY KEY)                                       │
│  ├─ term                                                   │
│  ├─ co_occurrence_count (integer)                          │
│  ├─ entity_benefit_pair (text)                             │
│  └─ created_at (timestamp)                                 │
│                                                             │
│  archived_urls                                             │
│  ├─ url_hash                                               │
│  ├─ canonical_url                                          │
│  ├─ domain                                                 │
│  └─ archived_at (timestamp)                                │
│                                                             │
│  system_stats                                              │
│  ├─ id (PRIMARY KEY)                                       │
│  ├─ metric_name (text)                                     │
│  ├─ metric_value (numeric)                                 │
│  └─ recorded_at (timestamp)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Layer (config.py)

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIG: All system tunables in one place                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Limits (hard caps)                                        │
│  ├─ MAX_KEYWORDS: 500                                      │
│  ├─ MAX_LEARNED_TERMS: 300                                 │
│  ├─ MAX_QUERIES_PER_CYCLE: 10                              │
│  ├─ MAX_CONCURRENCY: 3                                     │
│  ├─ MAX_RETRIES: 3                                         │
│  ├─ MAX_OUTBOUND_LINKS: 30                                 │
│  ├─ HARD_REJECT_OUTBOUND_LINKS: 50                         │
│  └─ BATCH_SIZE: 50                                         │
│                                                             │
│  Thresholds (decision points)                              │
│  ├─ MIN_SCORE_FOR_OFFER: 4                                 │
│  ├─ HARD_REJECT_SPAM_SCORE: 6                              │
│  ├─ BLACKLIST_DOMAIN_SCORE: -10                            │
│  ├─ DEPRIORITIZE_QUERY_CYCLES: 5                           │
│  ├─ PRUNE_KEYWORD_CYCLES: 10                               │
│  └─ YIELD_THRESHOLD_FOR_DEPRIORITIZE: 0.0                  │
│                                                             │
│  Timing (intervals, timeouts)                              │
│  ├─ SEARCH_MIN_INTERVAL: 8.0 sec                           │
│  ├─ SEARCH_MAX_INTERVAL: 12.0 sec                          │
│  ├─ REQUEST_TIMEOUT: 10 sec                                │
│  ├─ COOLDOWN_ON_429: 600 sec                               │
│  └─ RETRY_BACKOFF_BASE: 2.0                                │
│                                                             │
│  ScoringWeights                                            │
│  ├─ ENTITY_MATCH: +1                                       │
│  ├─ BENEFIT_MATCH: +1                                      │
│  ├─ PROGRAM_PHRASE: +2                                     │
│  ├─ DOMAIN_BONUS: +1.0 to +2.0                             │
│  ├─ SPAM_KEYWORD: -2                                       │
│  └─ EXCESS_LINKS: -1                                       │
│                                                             │
│  TrustDecay                                                │
│  ├─ VALID_OFFER_BONUS: +0.5                                │
│  ├─ SPAM_DETECTION_PENALTY: -1.5                           │
│  └─ LINK_DECAY_PER_DAY: 0.1                                │
│                                                             │
│  CORE_VOCABULARY                                           │
│  ├─ entities: [software, tools, apps, ...]                 │
│  ├─ benefits: [free, discount, deal, ...]                  │
│  ├─ verticals: [cloud, streaming, creative, ...]           │
│  └─ program_phrases: [student hub, ...]                    │
│                                                             │
│  SPAM_KEYWORDS: [casino, bet, loan, ...]                   │
│                                                             │
│  SYNONYM_GRAPH: {term: [synonyms]}                         │
│                                                             │
│  CREDENTIALS                                               │
│  ├─ SUPABASE_URL (env)                                     │
│  ├─ SUPABASE_KEY (env)                                     │
│  └─ NVIDIA_API_KEY (env)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPORT GRAPH                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  agent_engine.py                                           │
│  ├─ agent_core.py                                          │
│  │  ├─ agent_memory.py                                     │
│  │  │  └─ database.py                                      │
│  │  │     ├─ config.py ⭐                                  │
│  │  │     └─ supabase client                               │
│  │  ├─ agent_tools.py                                      │
│  │  │  ├─ scraper.py                                       │
│  │  │  ├─ fetcher.py                                       │
│  │  │  │  └─ canonicalizer.py                              │
│  │  │  ├─ scorer.py                                        │
│  │  │  │  └─ config.py                                     │
│  │  │  └─ database.py                                      │
│  │  ├─ llm_client.py                                       │
│  │  │  └─ langchain_nvidia_ai_endpoints                    │
│  │  ├─ database.py                                         │
│  │  └─ canonicalizer.py                                    │
│  ├─ database.py                                            │
│  └─ config.py                                              │
│                                                             │
│  engine.py (deterministic mode alternative)               │
│  ├─ database.py                                            │
│  ├─ scraper.py                                             │
│  ├─ fetcher.py                                             │
│  ├─ scorer.py                                              │
│  ├─ canonicalizer.py                                       │
│  ├─ query_controller.py                                    │
│  │  └─ database.py                                         │
│  ├─ config.py                                              │
│  └─ ...                                                    │
│                                                             │
│  config.py ⭐ (root)                                       │
│  └─ Constants, thresholds, credentials                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Concurrent Operations

```
Per Cycle Timeline:

DETERMINISTIC (engine.py):
  Cycle: 45-75 minutes
  ├─ Execute 5-10 queries (sequential)
  │  ├─ Per query: 8-12 sec pause
  │  │ ├─ Search: 1-2 sec
  │  │ └─ Browse top 10: ~20 sec total
  │  └─ Score & store: <1 sec
  └─ Post-cycle updates:
     ├─ Learn co-occurrences
     ├─ Prune keywords
     └─ Sleep 45-75 min

AGENT (agent_engine.py):
  Cycle: ~150-180 seconds
  ├─ Observe DB state: <1 sec
  ├─ LLM reasoning (1-5): 1-4 sec each
  │  └─ Max 15 actions per cycle
  │     ├─ search_web (auto-processes 10 URLs):
  │     │  ├─ Browse concurrently (2-3): ~10 sec
  │     │  └─ Score each: <1 sec
  │     ├─ expand_keywords: <500ms
  │     ├─ deep_crawl: ~5-10 sec
  │     └─ query_stats: <500ms
  └─ Update memory & sleep 15-25 min

CONCURRENCY LIMITS:
  ├─ Search requests: 1 req / 8-12 sec (rate limit)
  ├─ Page fetches: 2-3 concurrent max
  │  └─ 1 req/sec per worker
  ├─ LLM calls: max 60 per hour
  └─ Supabase API: async batch operations
```

---

## Error Handling & Resilience

```
┌─────────────────────────────────────────────────────────────┐
│  FAULT TOLERANCE STRATEGIES                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Network Errors (fetch, scrape, API)                       │
│  ├─ Retry with exponential backoff (base: 2.0)             │
│  ├─ Max retries: 3                                         │
│  └─ Cooldown on rate limit (429): 600 sec                  │
│                                                             │
│  CAPTCHA / Rate Limit (scraper)                            │
│  ├─ Automatic cooldown                                     │
│  ├─ Skip to next query                                     │
│  └─ Randomize request intervals (8-12 sec)                 │
│                                                             │
│  Database Failures                                          │
│  ├─ Network blocked? (e.g., Postgres ports)                │
│  └─ Fall back to REST API (HTTPS only)                     │
│                                                             │
│  LLM Failures                                              │
│  ├─ Timeout: retry with backoff                            │
│  ├─ Rate limit: halt reasoning, continue tools             │
│  ├─ Invalid JSON: parse gracefully                         │
│  └─ Max 60 calls/hour guardrail                            │
│                                                             │
│  Process Crashes                                           │
│  ├─ Try/except at cycle level                              │
│  ├─ Error logging & count tracking                         │
│  ├─ Automatic process restart (systemd)                    │
│  └─ Memory cleanup (gc.collect) per cycle                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features & Safeguards

```
┌─────────────────────────────────────────────────────────────┐
│  FEATURE MATRIX                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Discovery                                               │
│  ├─ Dynamic keyword expansion (agent learns)                │
│  ├─ Vertical-specific queries (cloud, creative, etc.)       │
│  ├─ Co-occurrence learning (related terms)                  │
│  └─ Synonym expansion (1-depth graph lookup)                │
│                                                             │
│  🛡️ Anti-Spam Defense                                       │
│  ├─ Spam keyword blacklist                                  │
│  ├─ Hard reject on >50 outbound links                       │
│  ├─ Domain trust scoring with decay                         │
│  ├─ Listicle pattern detection                              │
│  └─ Aggressive filtering (min_score=4)                      │
│                                                             │
│  ⚡ Performance                                              │
│  ├─ URL deduplication (memory cache + DB)                   │
│  ├─ Batch operations (50 URLs at a time)                    │
│  ├─ Concurrent fetching (max 2-3)                           │
│  ├─ Domain blacklist checks (O(1))                          │
│  └─ Query yield tracking & deprioritization                 │
│                                                             │
│  🎯 Autonomous Reasoning (Agent Only)                       │
│  ├─ ReAct pattern (Reason+Act per decision)                 │
│  ├─ Context-aware strategy selection                        │
│  ├─ Auto-pipeline (search → browse → score → store)         │
│  ├─ Yield-driven vertical exploration                       │
│  └─ Decision history tracking                               │
│                                                             │
│  💾 Data Persistence                                        │
│  ├─ Supabase (managed PostgreSQL)                           │
│  ├─ ACID transactions for inserts                           │
│  ├─ Archive old URLs (>90 days)                             │
│  ├─ System metrics tracking                                 │
│  └─ Domain trust scoring history                            │
│                                                             │
│  📊 Observability                                           │
│  ├─ Per-cycle logging (actions, offers, yield)              │
│  ├─ Cumulative stats (total offers, runtime)                │
│  ├─ Agent memory state snapshots                            │
│  ├─ Decision rationale from LLM                             │
│  └─ Performance metrics (latency, success rate)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Execution Entry Points

```
┌─────────────────────────────────────────────────────────────┐
│  HOW TO RUN                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. AUTONOMOUS AGENT MODE (Recommended)                    │
│     $ python3 agent_engine.py                               │
│     └─ Runs forever, LLM-driven, strategic tool use        │
│                                                             │
│  2. DETERMINISTIC MODE (Baseline)                          │
│     $ python3 engine.py                                     │
│     └─ Runs forever, fixed queries, rule-based scoring      │
│                                                             │
│  3. DEMO RUN (Single cycle)                                │
│     $ python3 run_demo.py                                   │
│     └─ One search, score, and display results              │
│                                                             │
│  4. DATABASE SETUP                                         │
│     $ python3 setup.py                                      │
│     └─ Create tables & seed keywords (if needed)           │
│                                                             │
│  5. TESTS                                                  │
│     $ python3 test.py                                       │
│     └─ Unit tests for all modules                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES & LIBRARIES                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 DuckDuckGo (Search)                                     │
│  ├─ HTML scraping (no API key required)                     │
│  ├─ Rate limited: 1 req / 8-12 sec                          │
│  └─ Returns: ~10 URLs per query                             │
│                                                             │
│  🤖 NVIDIA AI Endpoints (LLM — Agent Only)                 │
│  ├─ Model: moonshotai/kimi-k2-instruct                      │
│  ├─ API endpoint: api.nvidia.com/v1/chat/completions       │
│  ├─ Auth: API key in env (NVIDIA_API_KEY)                   │
│  ├─ Rate limit: 60 calls/hour (soft)                        │
│  └─ Latency: ~2-4 sec per reasoning step                    │
│                                                             │
│  📊 Supabase (Database)                                     │
│  ├─ PostgreSQL backend                                      │
│  ├─ REST API (HTTPS/443 only)                               │
│  ├─ Auth: Service role key in env (SUPABASE_KEY)            │
│  ├─ Tables: 7 (see schema above)                            │
│  └─ Batch operations supported                              │
│                                                             │
│  📦 Python Libraries                                        │
│  ├─ aiohttp (async HTTP client)                             │
│  ├─ asyncio (async runtime)                                 │
│  ├─ beautifulsoup4 (HTML parsing)                           │
│  ├─ lxml (HTML parsing backend)                             │
│  ├─ supabase-py (DB client)                                 │
│  ├─ langchain-nvidia-ai-endpoints (LLM)                     │
│  ├─ langchain-core (base classes)                           │
│  ├─ python-dotenv (env loading)                             │
│  └─ psycopg2-binary (Postgres adapter)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## System State Machine

```
                    START
                      │
                      ▼
            ┌─────────────────┐
            │  Initialize DB  │
            │ (seed keywords) │
            └────────┬────────┘
                     │
                     ▼
          ╔═════════════════════╗
          ║  MAIN LOOP: REPEAT  ║
          ╚═════════════════════╝
                     │
        ┌────────────┼────────────┐
        │            │            │
    MODE: AGENT  MODE: DETERM  DEMO: ONCE
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Observe│  │Execute │  │ Single   │
    │ & Reason│ │5-10    │  │ Search   │
    │        │  │queries │  │          │
    └───┬────┘  └───┬────┘  └───┬──────┘
        │           │            │
        ▼           ▼            ▼
    ┌────────────────────────────────┐
    │  PROCESS & STORE RESULTS       │
    │  ├─ Browse top URLs            │
    │  ├─ Score & filter             │
    │  ├─ Insert offers              │
    │  └─ Update domain trust        │
    └────────┬─────────────────────┘
             │
        UPDATE MEMORY & LOG
             │
        ┌────┴──────┐
        │            │
    AGENT       DETERM/DEMO
        │            │
        ▼            ▼
   Sleep 15-25  Sleep 45-75
   minutes      minutes (or exit)
        │            │
        └────┬───────┘
             │
             └─────┐
                   │ Loop back to MAIN LOOP
                   │
                   ▲
```

---

## Summary

This is a **dual-mode web scraper** that discovers student software discounts:

1. **Deterministic Mode** (engine.py): Fixed queries, rule-based scoring, cyclic execution
2. **Agent Mode** (agent_engine.py): LLM-driven reasoning, strategic tool selection, ReAct loop

Both share the same **data layer** (Supabase PostgreSQL) and **core processors** (scraper, fetcher, scorer, canonicalizer).

**Key design principles:**
- Rate-limited, defensive, anti-CAPTCHA
- Multi-factor scoring with domain trust
- Batch processing & deduplication
- Async/concurrent where possible
- Complete observability & logging
- Resilient error handling

**Result:** A set of legitimate student software deals stored in the `offers` table.


