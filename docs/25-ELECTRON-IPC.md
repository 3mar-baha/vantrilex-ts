# 25 — Electron IPC — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

The sole privileged boundary between UI and engine.

## Status

Renderer never touches fs or processes. All privileged calls cross IPC.

## Schema

### Preload bridge

Typed channels over contextBridge: `foundry:detect`,
`foundry:provision`, `runner:launch`, `voice:speak`,
`voice:transcribe`, `mobile:pair`, `mobile:approve`. Channel names carry
a version prefix. No nodeIntegration, no remote module.

### Main process

App lifecycle, tray, updater, child supervision (agent CLIs), OS
credential access. Validates every IPC payload before dispatch and
rejects unknown channels.
