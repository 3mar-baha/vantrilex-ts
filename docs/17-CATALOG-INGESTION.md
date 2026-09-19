# 17 — Catalog Ingestion — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

How the 2,699-item registry and immune ledger enter the app and stay fresh.

## Status

Sources are read-only; the app never writes back to them.

## Schema

### Sources (`data/`)

`agents_registry.json`, `hooks_registry.json`, `immunology_ledger.json`,
`mcp_registry.json`, `plugins_registry.json`, `skills_registry.json` —
copied verbatim from the Go reference repo. Default-selected items ship
preselected (architect, find-skills, skill-creator, ponytail, ask-matt,
commit-commands, code-review, typescript-lsp, pre-compact, session-start,
block-dev marker, sequential-thinking, filesystem, fetch, memory).

### Loading

Single load per launch with recorded parse errors (never silent).
Token-AND search over name, description, tags, and source. Catalog order
preserved; no ranking.

### Refresh

Regeneration scripts rebuild the JSON snapshots; refreshed files commit
when capacity gates pass. The immune ledger appends real solutions only.
