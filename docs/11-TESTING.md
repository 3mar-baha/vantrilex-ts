# 11 — Testing — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Test layers, commands, and justification discipline.

## Status

Every change cites the command run and its result in the workflow log.

## Schema

### Layers

Unit tests prove engine functions (detection, scaffold, keyring, MCP
inject). Integration tests prove IPC contracts and provisioning flows.
End-to-end tests prove the guided and classic journeys plus handover.

### Commands

- `npm run typecheck` — strict TypeScript, zero errors.
- `npm run lint` — eslint clean.
- `npm test` — full suite green, coverage on engine modules.

### Justification

Each test answers what bug it catches that no other test catches.
Tests without an answer are deleted. TDD discipline: red, green, refactor.
