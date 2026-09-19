# 12 — Security — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Authentication, authorization, secrets, validation, and update policy.

## Status

New trust boundaries are recorded here before code crosses them.

## Schema

### Boundaries

- **API keys** (Fish Audio, Groq): OS credential store only, never disk,
  never logs; UI reports presence booleans.
- **Agent credentials**: user-owned, injected at spawn via environment,
  never persisted by the launcher.
- **Workspace input**: validated and expanded before any fs write.
- **Registry fetches**: HTTPS only, 2 MB cap, timeouts, starter fallback.
- **Renderer**: sandboxed, no Node, all privileged calls via preload IPC.

### Policy

Dependencies update on the cadence in 08-ROADMAP.md. Secrets rotate via
the keyring; leaked handles are revoked and replaced, never edited.
