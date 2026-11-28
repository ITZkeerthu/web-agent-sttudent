import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from fetcher import ContentExtractor


def page(body, head="<title>T</title><meta name='description' content='D'>"):
    return f"<html><head>{head}</head><body>{body}</body></html>"


def test_extracts_title_description_and_text():
    r = ContentExtractor().extract(page("<p>Student discount here</p>"), "https://x.edu")
    assert r["title"] == "T"
    assert r["description"] == "D"
    assert "student discount here" in r["text_lower"]


def test_strips_nav_footer_script():
    html = page("<nav>MENU</nav><script>evil()</script><p>Body</p><footer>FOOT</footer>")
    r = ContentExtractor().extract(html, "https://x.edu")
    assert "menu" not in r["text_lower"] and "evil" not in r["text_lower"]
    assert "foot" not in r["text_lower"] and "body" in r["text_lower"]


def test_hard_rejects_too_many_links():
    links = "".join(f"<a href='https://e.com/{i}'>l</a>" for i in range(config.Limits.HARD_REJECT_OUTBOUND_LINKS + 1))
    assert ContentExtractor().extract(page(links), "https://x.edu") is None


def test_counts_affiliate_links_and_listicle():
    html = page("<h1>Top 10 student deals</h1><a href='https://a.com/?ref=1'>a</a><a href='https://b.com/'>b</a>")
    r = ContentExtractor().extract(html, "https://x.edu")
    assert r["affiliate_link_count"] == 1
    assert r["outbound_link_count"] == 2
    assert r["is_listicle"] is True


def test_text_truncated_but_word_count_full():
    r = ContentExtractor().extract(page("<p>" + "word " * 3000 + "</p>"), "https://x.edu")
    assert len(r["text"]) <= 5000 and r["word_count"] == 3000


def test_ssl_verification_enabled_by_default():
    # Default must be aiohttp's verifying default (None), never False
    if not config.ALLOW_INSECURE_SSL:
        assert config.SSL_VERIFY_ARG is None
