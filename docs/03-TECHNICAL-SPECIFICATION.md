# 03 — Technical Specification — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Implementation-facing specification: components, flows, and contracts for
the Electron + TypeScript + React host.

## Status

Mirrors 04-ARCHITECTURE.md at finer granularity.

## Schema

### Components

- **Electron main** (`electron/main.ts`): lifecycle, tray, updater, child
  process supervision, OS credential access. Sole privileged layer besides
  the engine.
- **Preload bridge** (`electron/preload.ts`): typed IPC via contextBridge.
  No nodeIntegration in the renderer, no direct fs or process access.
- **Renderer** (`src/ui/`): 2-mode fork, 3-case card, runner picker,
  provisioning progress, voice panel, pairing screen. DESIGN.md styling.
- **Engine** (`src/engine/`): foundry detection, 28-file generator, 7
  skills, immune ledger, catalog, doctor/Bun/portable, MCP injection,
  agent spawn, sessions, history.
- **Voice** (`src/engine/voice/`): Fish Audio TTS, Groq Whisper STT,
  keyring rotation.
- **Mobile** (`src/engine/mobile/`): self-hosted Happy relay client, QR
  pairing, push, approvals.

### Flows

Launch → Mode fork → (Guided: Workspace → Detect → provision → Launch) or
(Classic: Doctor → History → Runner → Workspace → registries → Skills →
Launch) → agent CLI owns the terminal. Voice and mobile attach to the
active session, never to provisioning internals.
