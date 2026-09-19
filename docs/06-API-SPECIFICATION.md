# 06 — API Specification — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Every internal and external contract in one place.

## Status

Published contracts version with migration notes.

## Schema

### IPC (preload bridge)

- `foundry:detect(workspace)` → `{case, language, stack, action}`.
- `foundry:provision(workspace, case)` → `{created[], errors[]}`.
- `runner:launch(runner, workspace, resume?)` → `{pid}` or error.
- `voice:speak(text)` → `{audioId, cached}`; `voice:transcribe(audioId)`.
- `mobile:pair()` → `{qrPayload}`; `mobile:approve(id, decision)`.

### External

- Fish Audio API: TTS model `s2.1-pro-free`, bearer key from keyring,
  Ogg/Opus stream, client timeout 60s, one retry.
- Groq API: Whisper transcription endpoint, bearer key from keyring.
- Happy relay (self-hosted): QR handshake, push channel, approval channel.
- Agent CLIs: spawned with argv per runner contract, `cwd` = workspace.

### Stability

IPC channel names version with a `v1` prefix. External contracts follow
provider versioning; breaking provider changes land in 09-DECISIONS.md.
