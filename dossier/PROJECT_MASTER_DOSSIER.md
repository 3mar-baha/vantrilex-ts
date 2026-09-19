# PROJECT MASTER DOSSIER — Vantrilex Next-Gen Agentic Workbench & Launcher

Forensic audit of the `vantrilex-ts` working tree (branch `main`, HEAD
`cce9e82` at audit open, toolchain Node v25.0.0 + npm 11.6.2). Every claim
below derives from physical source reads, executed `tsc` / `eslint` /
`vitest run --coverage` / `electron-vite build` runs on 2026-09-19, and
the traced call graphs. Where this file and any other document disagree,
this file wins until re-verified.

Verification baseline (executed, not recalled):

- `tsc --noEmit`: exit 0, zero errors.
- `eslint electron src tests`: exit 0, zero problems.
- `vitest run`: 22 files, 98 tests, 98 passed, 0 failed.
- `vitest run --coverage` (v8): 66.43% statements, 81.16% branches, 85%
  functions, 66.43% lines overall (dragged by the untestable Electron
  shell: `main.ts`, `preload.ts`, `tray.ts`, `updater.ts`, `main.tsx`
  all 0%; engine modules range 72–100% statements).
- `electron-vite build`: clean across main, preload, and renderer.
- Post-audit fixes applied and re-verified: `sessions.ts` single-`now()`
  capture, `channels.ts` duplicate union members removed.

---

## 1. Executive Audit Summary & Overall Score — 83 / 100

| Pillar | Score | Verdict |
|---|---|---|
| 1. Architecture & IPC Security | 17 / 20 | Strong isolation, stub gap on 2 channels |
| 2. Engine & Foundry Resilience | 16 / 20 | Accurate detection, two generator drifts |
| 3. Runner Handover & Sessions | 17 / 20 | Correct argv, fragile file writes |
| 4. Voice Pipeline & Keyring | 17 / 20 | Documented providers, store races |
| 5. Mobile Relay & Code Quality | 16 / 20 | Sound protocol, unwired transitions |
| **TOTAL** | **83 / 100** | **Production-ready with tracked risks** |

### Pillar 1 — Architecture & IPC Security: 17 / 20

Strengths: `BrowserWindow` pins `contextIsolation: true`,
`nodeIntegration: false`, `sandbox: true` (`electron/main.ts`). Zero
Node imports under `src/ui` (verified by grep; the single
`Workspace path` hit is UI label text). Preload is 4 lines exposing
only `window.vantrilex` via `contextBridge`; `import type` is erased at
compile. Strict CSP (`script-src 'self'` without `unsafe-inline` or
`unsafe-eval`, `object-src 'none'`, `base-uri`/`form-action 'self'`);
`style-src 'unsafe-inline'` is justified (pervasive React inline styles)
and `img-src`/`media-src` `data:`+`blob:` are required (QR data URIs,
TTS audio blobs). All 13 IPC channels typed in `channels.ts` with zero
registered-but-untyped or typed-but-unregistered mismatch. DESIGN.md
tokens pinned by test, including an explicit no-`#00FFFF` assertion.

Risks (−3): `foundry:detect` and `foundry:provision` are stubs returning
`{ok:false}` against typed `Promise<DetectResult>`/`Promise<ProvisionResult>`
— the renderer will mis-shape until wired. Renderer can invoke any
channel with arbitrary args; only `runner:launch` (resume `typeof`
check), `voice:keyring:set` (provider allowlist), and the voice
coercions validate — `workspace`/`id`/`text` are unvalidated main-side.

### Pillar 2 — Engine & Foundry Resilience: 16 / 20

Strengths: 3-case detection accurate across empty, `.git`-only, hollow,
and substantive fixtures with Go/Node stack mapping; token-AND catalog
search with order preservation; 28-file generator byte-identical in
structure (metadata + Purpose/Status/Schema), non-destructive with
`created`/`kept` accounting; 60-entry ledger with distinct ids and
required fields.

Risks (−4): `primeCheckpoint` and the `10-CHECKPOINT.md` foundry
template are two generators for one path with different bodies;
`loadLedger` caches regardless of path argument; `cause` never renders
in the summary; `.sln` picks `readdirSync[0]` (nondeterministic);
`caseAction`/`caseName` lack defaults; manifest priority misclassifies
polyglot repos (`package.json` always wins).

### Pillar 3 — Runner Handover & Sessions: 17 / 20

Strengths: argv matches verified CLI contracts exactly (claude
`--resume/--continue`, opencode `--session/--continue`, codex
`resume [id]/--last`; no `--model`/`--effort` forcing; workspace never
in argv). Host env inherited wholesale (Go parity) with an
`AUTH_TOKEN_PREFIXES` probe. 50-cap eviction with newest-first order and
delete-by-id, all pinned by test including corrupt-file tolerance.

Risks (−3): `writeSessions` is a direct non-atomic write (crash
mid-write corrupts the ledger); `deleteSession` reads the file twice;
`mkdirSync(join(path, '..'))` is fragile path arithmetic;
`terminalLaunchCommand` interpolates args into PowerShell without
escaping.

### Pillar 4 — Voice Pipeline & Keyring: 17 / 20

Strengths: Fish Audio call matches the documented surface exactly
(`POST https://api.fish.audio/v1/tts`, Bearer + `model: s2.1-pro-free`
header, mp3 body, mapped 401/402/503). Groq Whisper uses the
OpenAI-compatible multipart endpoint with `whisper-large-v3-turbo`.
DPAPI-backed store (`safeStorage` + `0600` JSON, Base64 ciphertext only)
with presence-booleans-only status. Exact 10-request rollover on
request 11, pinned by test across 22 calls.

Risks (−3): key-id counter is in-memory, so post-restart `addKey`
reuses ids and overwrites; concurrent `setSecret` read-modify-write can
lose keys; corrupt store reads as empty with no signal; `getSecret`
cannot distinguish vault-locked from deleted.

### Pillar 5 — Mobile Relay & Code Quality: 16 / 20

Strengths: self-hosted default (`http://127.0.0.1:8787`), strict
http(s) URL validation, 256-bit tokens + 96-bit session ids, full
Disconnected→AwaitingScan→Paired→Connected machine with 5-minute
expiry pruning, one-way approval queue, bearer-token transport.
98/98 green, clean typecheck/lint/build.

Risks (−4): `mobile:qr:generate` only calls `begin()` — `markScanned`
and `connect` are unreachable via IPC, so Paired/Connected and
`pairedDevices: 1` are unattainable in product (tests cover the
machine, the wiring does not); `ApprovalQueue.request`/`forward` are
never invoked via IPC (only `respond`); `awaitDecision` uses
non-injectable `Date.now()`; unknown server decisions collapse to
`pending`, masking errors.

---

## 2. Complete Physical File Manifest

Root: `O:\Claude Code\vantrilex-ts`. Git `main`, 10 post-Phase-4 commits
visible in log at audit open.

### Root manifests and config

| Path | Responsibility |
|---|---|
| `package.json` | App `vantrilex@1.0.0`; scripts `dev/build/test/typecheck/lint/package/dist/dist:dir`; electron-builder NSIS block (`com.vantrilex.workbench`, `Vantrilex Workbench & Launcher`, x64, non-one-click, custom path, desktop + start-menu shortcuts, `deleteAppDataOnUninstall: false`) |
| `package-lock.json` | Pinned dependency tree (committed per policy) |
| `tsconfig.json` | Strict + `noUnusedLocals/Parameters`, `jsx: react-jsx`, `vitest/globals` types; includes electron, src, tests |
| `tsconfig.node.json` | Composite config for `electron.vite.config.ts` |
| `electron.vite.config.ts` | main/preload/renderer builds (`out/main`, `out/preload`, `out/renderer`) |
| `vitest.config.ts` | jsdom, `tests/**/*.test.{ts,tsx}`, `tests/setup.ts` (RTL cleanup; required because `globals: false` disables auto-cleanup) |
| `eslint.config.mjs` | typescript-eslint recommended over electron/src/tests, ignoring out/node_modules/data/docs |
| `.gitignore` | `node_modules/`, `out/`, `dist/`, logs, OS files |
| `.mcp.json` | Dev-environment MCPs: filesystem, fetch, memory, sequential-thinking. Zero OpenRouter entries |
| `AGENTS.md` | Workspace agent contract (MCPs, skills, hooks, data, rules) |
| `opencode.json` | `$schema` + instructions + `opencode/zen` model |
| `data/` | 6 verbatim catalog JSONs (agents 130 KB, hooks 5 KB, immunology 17 KB, mcp 562 KB, plugins 4 KB, skills 600 KB) |
| `docs/` | 28 canonical files (01–28, see §7 runbook for map) |
| `dossier/` | This file |
| `vendor/happy/README.md` | Self-hosted relay fork map (`slopus/happy`, `slopus/happy-server`), `/v1/` surface, invariant |
| `DESIGN.md` | Untracked design authority (Anthropic editorial system; consumed by showcase skill) |

### `electron/` — privileged host (Node context)

| File | Responsibility |
|---|---|
| `main.ts` | Window (1200×800, cream bg, isolated/sandboxed), dev-URL vs file loading, 2 stubs (`foundry:detect`, `foundry:provision`), 11 real handlers (doctor probes, runner launch/sessions, keyring TTS/STT, mobile status/QR/respond), tray, updater check |
| `preload.ts` | 4-line `contextBridge` exposing `createApi(invoke)` only |
| `channels.ts` | 13-channel union + `IPC_CHANNELS` + typed `VantrilexApi` + `createApi` factory (duplicate union members removed in audit) |
| `secure-store.ts` | DPAPI `KeyStore`: `<userData>/voice-keys.json`, Base64 ciphertext map, `0600` mode, throws when vault unavailable |
| `tray.ts` | Tray with Open/Quit menu (`nativeImage.createEmpty()` placeholder icon) |
| `updater.ts` | Stub returning `{available: false, version: null}` — no network surface |

### `src/design/` and `src/ui/` — sandboxed renderer

| File | Responsibility |
|---|---|
| `src/design/tokens.ts` | Exact DESIGN.md tokens: canvas `#faf9f5`, coral `#cc785c`/`#a9583e`, ink `#141413`, dark `#181715`, serif-400 display, radii 8/12/16/pill, 32px cards, 96px rhythm |
| `src/ui/index.html` | Entry with strict CSP meta (script `self`-only, style `unsafe-inline`, img/media `data:`+`blob:`, connect `self`-only) |
| `src/ui/main.tsx` | React root mount (12 lines, zero coverage — mount-only) |
| `src/ui/App.tsx` | mode→workspace→runner→provisioning→handover state machine + VoicePanel + MobilePanel, null-safe bridge |
| `src/ui/vantrilex.d.ts` | `window.vantrilex` type declaration (erased at compile) |
| `src/ui/components/` | `Card` (light/dark), `ButtonPrimary` (coral/hover/disabled), `BadgePill` (5 tones), `TopNav`, `Footer` |
| `src/ui/stages/` | `types.ts` (WizardMode, DetectionView, RunnerOption, steps, `caseBadgeLabel`), `ModeStage` (arrows+Enter), `WorkspaceStage` (path input, detect, case card, Enter/Tab/Continue), `RunnerStage` (probe pills), `ProvisioningStage` (bar+checklist), `HandoverStage` (summary, sessions, resume, delete, launch/back), `VoicePanel` (badges, key forms, TTS/STT test), `MobilePanel` (pills, QR img, generate) |

### `src/engine/` — main-process logic

| File | Responsibility |
|---|---|
| `catalog/registry.ts` | 5-registry loader (902/12/1485/18/282 = 2699), token-AND search, 16-name defaults (17 selected via code-review collision), recorded errors |
| `foundry/detect.ts` | 17-entry manifest table + `.sln` fallback, >200-byte rule, Fresh/Established/Brownfield + language/stack/action |
| `foundry/docs.ts` | 28-file `FOUNDRY_DOCS` + `scaffoldDocs` (non-destructive, `{{PROJECT}}`, immune append on AI-INSTRUCTIONS) |
| `foundry/skills.ts` | 7 embedded bodies + toolkit-cache `skill-creator` resolution + `provisionCoreSkills` |
| `immune/ledger.ts` | 60-entry loader with cache, categories, `immunologySummary()` digest |
| `doctor/deps.ts` | 8 probes, PATH+PATHEXT lookup, version capture, winget/npm/powershell install chain |
| `doctor/portable.ts` | Portable Bun zip flow (64 MiB cap, 60s timeout, temp-file extraction), PATH prepend, fail-soft |
| `runner/spawn.ts` | Per-runner argv incl. resume variants, cwd+stdio inheritance, env passthrough, PowerShell terminal builder |
| `runner/sessions.ts` | 50-cap ledger, newest-first, delete, corrupt tolerance (single-`now()` capture post-audit) |
| `runner/history.ts` | Marker scan, checkpoint presence/prime, prior-session + latest-resume resolution |
| `scaffold/mcp.ts` | `sanitize`, `remoteMCPURL`, `bunx` acceleration, dual-config injection without overwrite |
| `scaffold/provision.ts` | Selections pipeline (skills/agents/plugins/hooks/manifest/CLAUDE.md), foundry wrappers, guard hook, deterministic totals |
| `voice/keyring.ts` | Dual pools, exact 10-request rollover, injectable store, presence-only status |
| `voice/tts.ts` | Fish Audio client (mp3, 50-clip FIFO cache, mapped errors, 60s timeout) |
| `voice/stt.ts` | Groq Whisper multipart client (normalization, mapped errors, 120s timeout) |
| `mobile/pairing.ts` | QR payload codec, crypto tokens/ids, SVG+data-URI rendering, expiring state machine |
| `mobile/relay.ts` | URL validation, bearer POST/GET, push/approval/decision polling with timeouts |
| `mobile/push.ts` | Approval queue with one-way respond and relay forwarding |

### `tests/` — 22 files, 98 tests

`setup.ts` (RTL cleanup), `ipc.test.ts` (12→13 channels, routing, args),
`components.test.tsx` (tokens incl. no-cyan, primitives, shell),
`stages.test.tsx` (mode/workspace/runner/provision/handover),
`flow.test.tsx` (guided + classic IPC journeys), `registry.test.ts`,
`detect.test.ts`, `docs.test.ts`, `skills.test.ts`, `ledger.test.ts`,
`doctor.test.ts`, `portable.test.ts` (node-pinned: adm-zip realm),
`mcp.test.ts`, `provision.test.ts`, `spawn.test.ts`, `sessions.test.ts`,
`history.test.ts`, `keyring.test.ts`, `voice.test.ts`,
`voicepanel.test.tsx`, `mobilepanel.test.tsx`, `pairing.test.ts`,
`relay.test.ts` (23rd file count includes setup; 22 files carry tests).

---

## 3. Runtime Execution Lifecycles

### 3.1 App launch → window

`app.whenReady()` → `setAppUserModelId` (win32) → `registerChannels()`
→ `createWindow()` (isolated, sandboxed, cream bg) → `loadURL(dev)` or
`loadFile(renderer/index.html)` under the CSP → `setupTray()` →
`checkForUpdates()` (stub, no network) → React mounts `App` at
`step='mode'`.

### 3.2 Guided wizard → detection → provisioning

ModeStage select → WorkspaceStage path input → `foundry:detect` (**stub**:
returns `{ok:false}` — see risk) → case card (badge, language, stack,
action) → Enter confirm / Tab override → RunnerStage (`doctor:probes`
live) → select → Continue → `foundry:provision` (**stub**) →
ProvisioningStage bar/checklist → Continue → sessions load →
HandoverStage (summary, recent sessions, resume pills, delete) →
`runner:launch` records session then `spawn(bin, args, {cwd, env,
stdio:inherit, detached:false})`.

### 3.3 Voice round-trip

VoicePanel save → `voice:keyring:set` (allowlisted provider, DPAPI
encrypt, status back) → Test speech → `voice:tts:speak` (cache check →
`nextKey` → Fish POST → base64 → `<audio>` blob playback) → Test
transcription → `voice:stt:transcribe` (base64 decode → Groq multipart
→ normalized text). Rotation advances silently every 10th call.

### 3.4 Mobile pairing → approvals

MobilePanel → `mobile:status` (state, relay, session, devices,
pending) → generate → `mobile:qr:generate` (`begin()` → QR SVG + data
URI, 5-min expiry) → scan (out of band; no IPC path advances state —
see risk) → approvals created via `ApprovalQueue` (currently only
`mobile:approval:respond` → one-way `respond` is wired).

---

## 4. Complete IPC & Channel Inventory

All channels renderer→main request/response via `invoke` (no
subscriptions). Payloads quoted from `channels.ts` + `main.ts`:

| # | Channel | Request payload | Response | Real / Stub |
|---|---|---|---|---|
| 1 | `foundry:detect` | `(workspace: string)` | `DetectResult {projectCase, language, stack, action}` (typed; stub returns `{ok:false,error}`) | Stub |
| 2 | `foundry:provision` | `(workspace: string, projectCase: number)` | `ProvisionResult {created[], errors[]}` (typed; stub returns `{ok:false,error}`) | Stub |
| 3 | `runner:launch` | `(runner: RunnerId, workspace: string, resume?: string)` | `{pid: number \| null}` | Real |
| 4 | `voice:tts:speak` | `(text: string)` | `{audioBase64, format: 'mp3', cached}` | Real |
| 5 | `voice:stt:transcribe` | `(audioBase64: string, filename?: string)` | `{text}` | Real |
| 6 | `voice:keyring:status` | `()` | `{fishAudio: {present, count}, groq: {present, count}}` | Real |
| 7 | `voice:keyring:set` | `(provider: 'fish_audio'\|'groq', secret: string)` | status (allowlisted, throws otherwise) | Real |
| 8 | `mobile:status` | `()` | `{state, relayUrl, sessionId \| null, pairedDevices, pendingApprovals}` | Real |
| 9 | `mobile:qr:generate` | `()` | `{svg, dataUri, expiresAt}` | Real |
| 10 | `mobile:approval:respond` | `(id: string, decision: boolean)` | `{ok}` | Real |
| 11 | `doctor:probes` | `()` | `{key, found, version}[]` | Real |
| 12 | `runner:sessions:list` | `()` | `Session[]` | Real |
| 13 | `runner:sessions:delete` | `(id: string)` | `{ok}` | Real |

Unvalidated main-side inputs: `workspace`, `id`, `text`, `audioBase64`
(no path/traversal/size checks beyond STT non-empty and TTS
non-blank); `resume` is `typeof`-checked; `provider` is allowlisted;
TTS/STT args are `String()`-coerced.

---

## 5. State & Storage Schemas

### `sessions.json` (`~/.vantrilex/sessions.json`, `0644`)

```json
[
  {
    "id": "2026-09-19T00:00:01Z-1",
    "workspace": "C:/projects/demo",
    "runner": "opencode",
    "timestamp": "2026-09-19T00:00:01Z",
    "status": "active"
  }
]
```

Newest-first array, cap 50 (oldest sliced off on write). `status` in
`active|exited|resumed` (writer always stamps `active`).

### DPAPI vault (`<userData>/voice-keys.json`, `0600`)

```json
{ "fish_audio:1": "<base64(safeStorage-ciphertext)>", "groq:1": "<base64>" }
```

Plaintext never at rest. Key ids are `${provider}:${n}` with an
in-memory counter (restart reuses ids — see risk). Corrupt file reads
as empty.

### QR pairing payload (JSON → QR)

```json
{ "v": 1, "relay": "http://127.0.0.1:8787", "session": "sess_<96-bit hex>", "token": "<256-bit base64url>", "exp": 1758326400000 }
```

Rendered as SVG (`qrSvg`) and PNG data URI (`qrDataUri`); 5-minute
`PAIRING_TIMEOUT_MS`; state machine prunes on read.

### Cached audio (in-memory only)

`Map<sha256('fish:s2.1-pro-free:'+text), Uint8Array>`, FIFO eviction at
50 entries. Crosses IPC as base64; renderer plays via blob/data URI.
Nothing persists to disk.

---

## 6. Test Coverage & Stress Analysis

### Execution metrics (2026-09-19)

- 22 test files, 98 tests, **98 passed, 0 failed**.
- `tsc --noEmit`: 0 errors. `eslint`: 0 problems.
- `electron-vite build`: clean (main 237ms class, preload, renderer).
- Coverage (v8): **66.43% stmts / 81.16% branch / 85% funcs / 66.43%
  lines** overall; engine 72–100% stmts (registry/docs/skills/pairing
  ≥94%; portable 72.41%, ledger 84.12%, provision 84.1% branch 54.16%);
  UI stages 80–100%; shell files (`main.ts`, `preload.ts`, `tray.ts`,
  `updater.ts`, `main.tsx`, configs) 0% by construction.

### Edge-case resilience (verified by test)

Empty/missing/corrupt inputs load as empty (registries, sessions,
settings, checkpoint); hollow docs stay Brownfield; strict `>` on the
200-byte boundary; single-key pools rotate trivially; empty pools/keys
throw; QR rejects non-JSON, malformed shapes, non-http relays; relay
non-OK surfaces status; approval double-respond returns false;
`begin()` expiry prunes on read; `bondary` PATH prepend is idempotent;
MCP injection never overwrites; scaffold second run creates zero.

### Known environment sensitivities

- adm-zip inflates empty under Vitest jsdom (`instanceof Buffer`
  cross-realm): extraction routes through a temp file and
  `portable.test.ts` is pinned to `node`.
- `globals: false` disables RTL auto-cleanup: `tests/setup.ts`
  registers it explicitly.
- `Buffer` in preload-adjacent code paths is main-side only; renderer
  handles base64 strings.

### Residual risks (tracked, not fixed in audit)

R1 (P1): two stub IPC handlers vs typed promises. R2 (P2): dual
checkpoint generators; ledger cache ignores path; `.sln` order
nondeterminism. R3 (P3): non-atomic session writes; double file reads;
unescaped PowerShell interpolation. R4 (P4): id-counter reuse on
restart; store read-modify-write races; silent corrupt reads. R5 (P5):
scan/connect unreachable via IPC; queue request/forward unwired;
`Date.now()` in relay polling; unknown decisions masked as pending.
Plus: default Electron icon (no `.ico` asset); updater is a stub.

---

## 7. Concrete Operations Runbook

All commands run from `O:\Claude Code\vantrilex-ts` (PowerShell):

```powershell
npm install                 # 300+ packages, Node 25 + npm 11 verified
npm run typecheck           # tsc --noEmit, must exit 0
npm run lint                # eslint electron src tests, must exit 0
npm test                    # vitest run: expect 22 files / 98 tests green
npx vitest run --coverage   # v8 report; engine floor ~72% stmts
npm run build               # electron-vite build: main + preload + renderer
npm run dist:dir            # electron-builder --dir: dist/win-unpacked integrity
npm run dist                # full NSIS installer (requires cert for signing)
git log --oneline -5        # atomic Conventional Commits per policy
git push origin master      # /sync gate mandates push per phase
```

Release checklist (`v1.0.0` pattern): gates green → `dist:dir`
integrity → docs reflect state → atomic commits → push → annotated tag
→ push tag.

---

*End of dossier. Ground truth established 2026-09-19 from working tree
on branch `main` (clean). Overall score 83/100. Re-run §6 commands
after any source change before trusting downstream documents.*
