import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scorer import MultiFactorScorer


def make(text, title="", **kw):
    d = {"text_lower": text.lower(), "title": title}
    d.update(kw)
    return d


def test_genuine_student_offer_accepted():
    r = MultiFactorScorer().score_content(
        make("Student discount for university students on software", "Student discount")
    )
    assert r.is_offer and not r.is_hard_rejected
    assert "student discount" in " ".join(r.matches["program_phrases"])


def test_unrelated_page_rejected():
    r = MultiFactorScorer().score_content(make("recipes for pasta and sauce"))
    assert not r.is_offer and r.score == 0


def test_spam_hard_rejects_even_with_high_score():
    text = "student discount offer free cheap cracked pirated warez keygen"
    r = MultiFactorScorer().score_content(make(text))
    assert r.is_hard_rejected and not r.is_offer


def test_excess_outbound_links_penalised():
    s = MultiFactorScorer()
    base = s.score_content(make("student discount")).score
    pen = s.score_content(make("student discount", outbound_link_count=40)).score
    assert pen < base


def test_trusted_domain_bonus():
    s = MultiFactorScorer()
    r = s.score_content(make("student"), domain_trust=10)
    assert r.domain_bonus > 0


def test_extract_noun_phrases():
    out = MultiFactorScorer().extract_noun_phrases("cloud storage plan and music streaming")
    phrases = [p for p, _ in out]
    assert "cloud storage plan" in phrases
    assert "music streaming" in phrases
