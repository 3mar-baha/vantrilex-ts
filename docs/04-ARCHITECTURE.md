# 04 — Architecture — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

System structure, dependency direction, and constraints.

## Status

Structural changes require a 09-DECISIONS.md entry.

## Schema

### Structure

```
Electron main ──IPC──► React renderer (DESIGN.md)
     │
     ├── engine/   detection · scaffold · skills · immune · catalog
     │             doctor · bun · mcp-inject · spawn · sessions
     ├── voice/    Fish TTS · Groq Whisper · keyring
     └── mobile/   Happy relay client · QR · push · approvals
```

Dependency direction: renderer → preload → engine. Engine never imports
UI. Voice and mobile attach to sessions, not to provisioning.

### Constraints

TypeScript strict, React renderer sandboxed (no Node), secrets only via
OS credential store, workspace writes non-destructive, agent CLIs invoked
as child processes with inherited stdio plus injected credentials.
