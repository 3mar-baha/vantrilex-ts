# 07 — Implementation Plan — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Ordered build sequence from empty tree to shippable increment.

## Status

Steps execute through 16-WORKFLOWS.md gates only.

## Schema

### Phases

- Phase 0: Electron + Vite + React + TS scaffold, DESIGN.md tokens, CI.
- Phase 1: Engine port — catalog, detection, 28-file generator, skills,
  immune ledger.
- Phase 2: Doctor, portable Bun, MCP injection (`bunx`/`npx`).
- Phase 3: Renderer — mode fork, 3-case card, runner picker, progress.
- Phase 4: Agent launcher spawn, session ledger (cap 50), history scan.
- Phase 5: Fish Audio TTS + Groq Whisper + keyring rotation.
- Phase 6: Self-hosted Happy relay, QR pairing, push, approvals.
- Phase 7: Hardening, NSIS packaging, full verification.

Each phase lists entry criteria, file-level changes, test commands, and
exit criteria. No phase starts until the prior gate is green.

### Provisioned tooling

The stack-selector table lives in the active project docs: need, pick,
kind, reason per tool, plus rejected near-misses so reruns do not
re-litigate choices.
