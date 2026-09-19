# 01 — Product Requirements — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

The single problem, users, value, and scope boundaries for a public,
generic, open-source agentic workbench. Written for a non-technical reader.

## Status

Approved baseline. Every requirement carries an ID and a verification method.

## Schema

### Problem

Non-technical users cannot set up AI coding agents: installing CLIs,
wiring MCP servers, writing project docs, and pairing a phone each demand
expert knowledge. Vantrilex reduces this to launching one app, answering
guided prompts, and pressing Enter.

### Users and value

- **Non-technical owner** (low comfort): gets a working project with docs,
  tools, and mobile control without touching a terminal. Metric: time from
  launch to first agent run under 15 minutes.
- **Developer** (high comfort): gets reproducible provisioning, session
  history, and a voice plus mobile control plane. Metric: zero manual
  config file edits per project.

### Scope boundaries

The launcher provisions workspaces and spawns runner CLIs (`opencode`,
`claude`, `codex`). It does not run language models itself. Agents own
their models and subscriptions. Out of scope: model hosting, model
billing, code-graph indexing (removed), legacy terminal UI.

### Acceptance

- REQ-001 Guided setup completes on a fresh machine (verification: demo).
- REQ-002 Provisioned workspace contains the 28-file docs, skills, MCP
  configs, and guard hook (verification: file test).
- REQ-003 Agent handover launches the chosen CLI in the workspace
  (verification: integration test).
- REQ-004 No OpenRouter, model-matrix, or code-graph code paths exist
  (verification: grep test).
