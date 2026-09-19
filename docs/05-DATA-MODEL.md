# 05 — Data Model — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Entities, fields, ownership, lifecycle, and retention.

## Status

Invariants enforced by the layer named per invariant.

## Schema

### Entities

- **Session**: id, runner (`opencode`|`claude`|`codex`), workspace,
  startedAt, resumeArg. Cap 50, newest-first. Owner: engine/runner.
- **RegistryItem**: name, kind, description, tags, source, rawURL,
  install, selected. Loaded once from `data/*.json`. Owner: catalog.
- **ImmuneEntry**: id, category, symptom, cause, solution, cmd.
  Append-only. Owner: catalog.
- **Checkpoint**: planId, scope files, MCPs, skills, test command,
  rollback step, approver, timestamp. Owner: workflows.
- **VoiceKey**: provider (`fish`|`groq`), keyRef (credential store
  handle, never the secret), uses, lastRotated. Owner: keyring.
- **Pairing**: relayUrl, deviceId, token expiry, scopes. Owner: mobile.

### Integrity

Secrets never persist to disk; only credential-store handles. Session
ledger caps at 50 with oldest evicted. Registry loads are immutable
snapshots per launch.
