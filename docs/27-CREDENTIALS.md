# 27 — Credentials — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Where every secret lives and how it moves.

## Status

Plaintext secrets never touch disk, logs, or IPC payloads.

## Schema

### Stores

- Voice keys (Fish Audio, Groq): OS credential store, pooled in the
  keyring with 10-request rotation.
- Agent credentials: user-owned accounts, injected at spawn via
  environment, never persisted by the launcher.
- Mobile tokens: short-lived relay tokens with expiry; re-pairing
  re-issues.

### Rules

UI shows presence booleans only. Revocation drops handles and prompts
for replacements. No credential ever appears in docs, reports, or error
text.
