# 09 — Decisions — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Immutable log of structural choices.

## Status

Append-only. Reversals are new entries referencing the original.

## Schema

### Entries

- 2026-09-19: Electron + TypeScript + React host; Go engine ported, Go
  repo preserved untouched as reference. Reason: browser UI plus
  DESIGN.md styling needs a web renderer. Revisit: never for v1.
- 2026-09-19: Agents own models; no model matrix, no effort picker, no
  OpenRouter. Reason: runner CLIs (OpenCode, Claude Code, Codex) call
  their own providers. Revisit: if an in-app LLM call becomes required.
- 2026-09-19: Voice via Fish Audio `s2.1-pro-free` TTS plus Groq Whisper
  STT with 10-request key rotation. Reason: direct provider APIs with
  free tiers. Revisit: on provider limit changes.
- 2026-09-19: Code-graph feature removed entirely (no GitNexus, no
  Obsidian graph). Reason: license weight plus scope discipline.
  Revisit: if a permissive-licensed engine appears.
- 2026-09-19: Mobile via self-hosted Happy relay fork. Reason: no
  third-party key custody for a public product. Revisit: never for v1.

Each entry records date, context, options, decision, reason, and revisit
trigger. A tradeoff with no revisit trigger is deferred debt.
