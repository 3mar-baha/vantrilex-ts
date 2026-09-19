# 20 — Keyring — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Multi-key credential pool with rotation for voice providers.

## Status

Secrets live in the OS credential store. The app holds handles, not keys.

## Schema

### Pools

Per-provider pools: Fish Audio (`FISH_AUDIO_API_KEY` handles) and Groq
(`GROQ_API_KEY` handles). `nextKey(provider)` returns the current key
and rotates to the next after 10 requests.

### Rules

Keys never touch disk or logs; the UI reports presence booleans. On pool
exhaustion the app prompts for a replacement via the credential flow.
Revoked handles are dropped and replaced, never edited in place.
