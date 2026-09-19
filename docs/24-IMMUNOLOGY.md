# 24 — Immunology — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Failure-mode immunity for every spawned agent.

## Status

60 curated entries across 7 categories, append-friendly schema.

## Schema

### Ledger (`data/immunology_ledger.json`)

Entries carry id, category, symptom, cause, solution, and optional
command. Categories: windows-paths, ports, encoding, venv, go-modules,
npm, git. New real solutions append as entries; template filler is
rejected by test.

### Injection

The per-category digest injects into `AI-INSTRUCTIONS.md` at scaffold
time and into `CLAUDE.md` on every apply, so agents inherit immunity
without reading the full file.
