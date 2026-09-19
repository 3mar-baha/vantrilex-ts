# 13 — Deployment — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Build, artifact, environment, migration, and rollback steps.

## Status

Production promotion requires a green /test gate.

## Schema

### Pipeline

1. `npm run typecheck && npm run lint && npm test` — all green.
2. `npm run package` — Electron Builder produces the Windows installer.
3. Sign the artifact with the release certificate.
4. Publish the release with checksums and release notes.
5. Rollback: re-publish the prior signed artifact; no data migration
   exists in v1, so rollback is artifact replacement.

### Environments

Development (local), release candidate (signed, staged), production
(signed, published). Promotion is manual with a 10-CHECKPOINT.md entry.
