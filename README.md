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
