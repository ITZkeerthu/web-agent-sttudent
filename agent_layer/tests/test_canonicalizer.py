import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canonicalizer import URLCanonicalizer


def test_empty_url():
    assert URLCanonicalizer().canonicalize("") == ("", "")


def test_normalizes_scheme_www_fragment_and_trailing_slash():
    c = URLCanonicalizer()
    url, h = c.canonicalize("HTTP://WWW.Example.com/Offers/#top")
    assert url == "https://example.com/offers"
    assert len(h) == 64


def test_strips_tracking_params_and_sorts_query():
    c = URLCanonicalizer()
    url, _ = c.canonicalize("https://a.com/x?b=2&utm_source=z&a=1&fbclid=q")
    assert url == "https://a.com/x?a=1&b=2"


def test_equivalent_urls_share_hash():
    c = URLCanonicalizer()
    assert c.canonicalize("http://www.a.com/p/?utm_medium=x")[1] == c.canonicalize("https://a.com/p")[1]


def test_malformed_url_does_not_raise():
    c = URLCanonicalizer()
    assert c.canonicalize("http://[bad") == ("", "")
    assert c.is_valid_url("http://[bad") is False
    assert c.extract_domain("http://[bad") == ""


def test_is_valid_url_returns_bool():
    c = URLCanonicalizer()
    assert c.is_valid_url("http://") is False
    assert c.is_valid_url("ftp://a.com") is False
    assert c.is_valid_url("https://a.com") is True
    assert c.is_valid_url("https://localhost") is False


def test_seen_hash_tracking():
    c = URLCanonicalizer()
    _, h = c.canonicalize("https://a.com")
    assert not c.is_duplicate(h)
    c.mark_seen(h)
    assert c.is_duplicate(h)
