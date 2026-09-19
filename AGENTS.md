# AGENTS.md — vantrilex-ts (Vantrilex Next-Gen Agentic Workbench & Launcher)

Public, generic, open-source workbench. The launcher provisions workspaces
and spawns runner CLIs (`opencode`, `claude`, `codex`). Agents own their
models and subscriptions. No model matrix, no OpenRouter, no code graphs.

## Active MCP servers (.mcp.json)

- `filesystem` — workspace file access (`@modelcontextprotocol/server-filesystem`)
- `fetch` — web fetch (`@modelcontextprotocol/server-fetch`)
- `memory` — persistent memory (`@modelcontextprotocol/server-memory`)
- `sequential-thinking` — structured reasoning (`@modelcontextprotocol/server-sequential-thinking`)

## Active skills (.claude/skills/)

Foundry: `skill-creator`, `vantrilex-project-founder`,
`vantrilex-project-onboarder`, `vantrilex-project-reverse-engineer`,
`vantrilex-stack-selector`, `project-showcase-builder`,
`project-stress-tester`.
Guards: `clean-code-guard`, `test-guard`, `docs-guard`, `tdd`.
Personas: `architect`, `refactoring-specialist`.

## Hooks (.claude/hooks/)

- `commit-guard` (PreToolUse on git commit) — conventional messages, no secrets.
- `lint-format-verify` (PostToolUse on Edit|Write) — tsc, eslint, prettier.
- `session-checkpoint` (SessionEnd) — persist session state.

## Catalog data (data/)

`agents_registry.json`, `hooks_registry.json`, `immunology_ledger.json`,
`mcp_registry.json`, `plugins_registry.json`, `skills_registry.json` —
copied verbatim from the Go reference repo (read-only source).

## Rules

- Keep responses strictly in English.
- Prefer small, reversible changes with tests.
- TDD discipline: red-green-refactor.
- Never invent MCP servers, skills, or endpoints; use only provisioned ones.
