# 16 — Workflows — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

The gated state machine every change travels, plus how the lead agent
and owner collaborate sprint by sprint.

## Status

Skipping a gate restarts the workflow at /plan. No exceptions.

## Schema

### Collaborative loop

- `/plan` — the agent drafts the sprint plan (scope files, MCPs, skills,
  test commands, rollback step) and records it in 10-CHECKPOINT.md. The
  owner approves with an explicit confirmation. No code before approval.
- `/code` — implement exactly the approved plan with TDD discipline
  (red, green, refactor). Deviations restart at /plan.
- `/test` — run `npm run typecheck`, `npm run lint`, `npm test`; record
  commands plus results in the workflow log. Red stays red until green
  with evidence.
- `/sync` — update affected numbered docs, append 09-DECISIONS.md
  entries, checkpoint the session, and report completion.

### Gates

/plan -> /code -> /test -> /sync — in this order, no skipping. Steps may
use provisioned MCPs and skills only. A missing or unusable required
tool halts the workflow with a blocker report, never a silent swap.

### Atomic rollback checkpoint

Before /code, create a checkpoint: `git stash create` on dirty trees
or a checkpoint tag on clean ones. If /test fails more than 3 times,
prompt automated rollback to the checkpoint before further edits.

### Granular atomic commits and GitHub sync (permanent policy)

- **Atomic commits**: never make monolithic commits. Partition every
  phase and feature into the largest logical number of atomic, focused
  commits following Conventional Commits (`feat:`, `test:`, `docs:`,
  `refactor:`, `chore:`). One concern per commit; docs, tests, and
  implementation ship as separate commits unless inseparable.
- **GitHub synchronization**: as part of the `/sync` gate of every
  phase, push all local commits to the remote GitHub repository.
- **Remote bootstrap**: if no GitHub remote exists, create and link it
  (via `gh repo create vantrilex-ts` or `git remote add`) and push all
  commits made so far before closing the phase.

### The 8 implementation phases

- **Phase 0**: Electron + Vite + React + TS workspace scaffold, DESIGN.md
  tokens (`src/design/tokens.ts`), CI (lint, test, typecheck).
- **Phase 1**: Engine port — catalog loaders, 3-case detection, 28-file
  generator, 7 core skills, immune ledger. Data-first, test-locked.
- **Phase 2**: Doctor probes, portable Bun (`~/.vantrilex/bin/`), MCP
  injection into `opencode.json` and `.mcp.json` with `bunx`/`npx`.
- **Phase 3**: Renderer — 2-mode fork, 3-case confirmation card, runner
  picker, provisioning progress, DESIGN.md styling.
- **Phase 4**: Agent launcher spawn (`opencode`, `claude`, `codex`) with
  env injection, session ledger (cap 50), history scan and resume argv.
- **Phase 5**: Fish Audio TTS (`s2.1-pro-free`) plus Groq Whisper STT with
  10-request OS keyring rotation.
- **Phase 6**: Self-hosted Happy relay (`vendor/happy/`), QR pairing,
  push notifications, step approvals.
- **Phase 7**: Hardening, NSIS packaging and signing, full verification.

### Workflow log

Append one entry per completed workflow: date, plan reference, tests run
with results, docs updated.
