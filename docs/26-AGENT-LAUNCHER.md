# 26 — Agent Launcher — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Spawning and supervising runner CLIs with credential injection.

## Status

Agents own their models and subscriptions. The launcher owns the spawn.

## Schema

### Runners

`opencode`, `claude`, `codex`. Selection is by CLI capability, never by
model. The launcher does not pick, route, or bill models.

### Spawn contract

Argv per runner contract (`--model` and `--effort` are not forced; each
agent uses its own defaults unless the user sets them explicitly).
`cwd` equals the workspace. Stdio inherits the terminal. Credentials
inject via environment at spawn time from the OS store; nothing persists
to disk.

### Sessions

Ledger caps at 50, newest-first, with delete. History scan rediscovers
workspace and home sessions with resume argv per runner.
