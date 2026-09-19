# 02 — Product Specification — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Feature-level specification derived from the 01 requirements. Each
feature traces to at least one REQ ID.

## Status

Draft. Features are observable behaviors, not implementation notes.

## Schema

### Features

- FEAT-001 (REQ-001): 2-mode fork — Guided Smart Project for zero-knowledge
  setup, Classic Custom Mode for granular control. Observable: mode screen
  with two options, Enter commits.
- FEAT-002 (REQ-001): 3-case auto-detection — Greenfield, Documented
  existing, Undocumented existing. Observable: confirmation card naming the
  case, language, stack, and action; Tab overrides.
- FEAT-003 (REQ-002): 28-file canonical scaffold plus 7 core skills plus
  plan-guard hook, written non-destructively. Observable: file assertions.
- FEAT-004 (REQ-003): Runner picker and handover — OpenCode, Claude Code,
  Codex; the chosen CLI starts in the workspace with injected credentials.
- FEAT-005 (REQ-001): Voice panel — Fish Audio TTS plus Groq Whisper STT
  with key rotation. Observable: spoken reply plays on desktop.
- FEAT-006 (REQ-001): Mobile pairing — QR handshake to the self-hosted
  Happy relay with push notifications and step approvals.
- FEAT-007 (REQ-004): Absence guarantees — no OpenRouter client, no model
  picker, no graph engine in the binary (verification: dependency and
  symbol tests).

### Personas

Owner (low comfort) drives guided wording; developer (high comfort) uses
classic mode, history, and the voice plus mobile control plane.
