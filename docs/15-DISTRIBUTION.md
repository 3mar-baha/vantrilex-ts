# 15 — Distribution — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

NSIS packaging, signing, update channel, and first-run bootstrap.

## Status

Lazy bootstrap keeps the download light; heavy runtimes fetch on demand.

## Schema

### Installer

Electron Builder produces the Windows NSIS installer. Signed with the
release certificate. Checksums published per release.

### First-run bootstrap

On first launch the app checks for Node, Bun, the Happy CLI, and the
chosen agent CLI. Missing pieces download in the background with
progress; the wizard never blocks on them. `bunx` replaces `npx` for MCP
servers when Bun resolves.

### Updates

Auto-update channel with staged rollout; release-candidate ring first,
production second, each gated by 10-CHECKPOINT.md.
