"""
Configuration and constants for the student benefits scraper.
All hard limits and thresholds defined here.
"""
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Limits:
    """Hard system limits — never exceeded."""
    MAX_KEYWORDS: int = 500
    MAX_LEARNED_TERMS: int = 300
    MAX_QUERIES_PER_CYCLE: int = 10
    MAX_NEW_PROMOTIONS_PER_CYCLE: int = 10
    MAX_CONCURRENCY: int = 3
    MAX_RETRIES: int = 3
    MAX_PAGINATION: int = 1
    BATCH_SIZE: int = 50
    MAX_OUTBOUND_LINKS: int = 30
    HARD_REJECT_OUTBOUND_LINKS: int = 50
    MIN_FREQUENCY_FOR_PROMOTION: int = 5
    ARCHIVE_DAYS: int = 90
    URL_HASH_LENGTH: int = 64


@dataclass(frozen=True)
class Thresholds:
    """Decision thresholds."""
    MIN_SCORE_FOR_OFFER: int = 4
    HARD_REJECT_SPAM_SCORE: int = 6
    BLACKLIST_DOMAIN_SCORE: int = -10
    DEPRIORITIZE_QUERY_CYCLES: int = 5
    PRUNE_KEYWORD_CYCLES: int = 10
    YIELD_THRESHOLD_FOR_DEPRIORITIZE: float = 0.0


@dataclass(frozen=True)
class Timing:
    """Timing constraints — all randomized within ranges."""
    SEARCH_MIN_INTERVAL: float = 8.0
    SEARCH_MAX_INTERVAL: float = 12.0
    CYCLE_MIN_SLEEP: int = 45  # minutes
    CYCLE_MAX_SLEEP: int = 75  # minutes
    REQUEST_TIMEOUT: int = 10  # seconds
    COOLDOWN_ON_429: int = 600  # seconds
    RETRY_BACKOFF_BASE: float = 2.0
    REQUESTS_PER_SECOND_PER_WORKER: float = 1.0


@dataclass(frozen=True)
class ScoringWeights:
    """Feature weights for multi-factor scoring."""
    ENTITY_MATCH: int = 2
    BENEFIT_MATCH: int = 2
    PROGRAM_PHRASE_MATCH: int = 3
    TRUSTED_DOMAIN_BONUS: int = 2
    SPAM_KEYWORD_PENALTY: int = -2
    EXCESS_OUTBOUND_LINKS_PENALTY: int = -1
    LISTICLE_PATTERN_PENALTY: int = -2


@dataclass(frozen=True)
class TrustDecay:
    """Domain trust decay parameters."""
    MONTHLY_DECAY_PERCENT: float = 0.05
    VALID_OFFER_BONUS: int = 2
    SPAM_DETECTION_PENALTY: int = -3


# Core vocabulary — never removed
CORE_VOCABULARY = {
    # Entity terms
    "entities": [
        "student", "students", "academic", "university", "college",
        "undergraduate", "graduate", "phd", "scholar", "education",
        "campus", "faculty", "edu"
    ],
    # Benefit terms
    "benefits": [
        "discount", "discounts", "offer", "offers", "deal", "deals",
        "free", "savings", "save", "pricing", "promotion", "promo",
        "coupon", "voucher", "rebate", "cashback", "trial"
    ],
    # Program phrases
    "program_phrases": [
        "student discount", "student offer", "education pricing",
        "academic discount", "university deal", "campus offer",
        "student pricing", "academic pricing", "education discount"
    ],
    # Vertical modifiers
    "verticals": [
        "software", "hardware", "laptop", "computer", "subscription",
        "streaming", "music", "video", "productivity", "cloud",
        "storage", "development", "design", "creative"
    ]
}

# Spam blacklist — always penalized
SPAM_KEYWORDS = [
    "cheap", "cracked", "pirated", "warez", "keygen",
    "unlimited", "instant", "guaranteed", "secret",
    "hack", "bypass", "generator", "fake", "scam"
]

# Static synonym graph — depth 1 only
SYNONYM_GRAPH = {
    "student": ["academic", "university", "college"],
    "academic": ["student", "university", "edu"],
    "discount": ["pricing", "offer", "deal", "savings"],
    "offer": ["discount", "deal", "promotion"],
    "deal": ["offer", "discount", "savings"],
    "pricing": ["discount", "cost", "rate"],
    "software": ["app", "application", "tool"],
    "subscription": ["membership", "plan"],
}

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# DuckDuckGo HTML endpoint
DDG_URL = "https://html.duckduckgo.com/html/"

# User agent rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.0",
]
