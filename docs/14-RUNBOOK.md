# 14 — Runbook — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Operational procedures for logs, alerts, incidents, and recovery.

## Status

Every alert links a procedure; alerts without procedures are removed.

## Schema

### Procedures

- **Agent CLI missing at launch**: surface the doctor install hint
  (`npm install -g` for the runner); rescan before retry.
- **Provisioning failure**: footer shows the cause; fix network or disk
  permissions and confirm again; cancel cleanly on back-out.
- **Voice key exhausted**: keyring rotates automatically; on full pool
  exhaustion, prompt for a replacement key via the credential flow.
- **Mobile pairing lost**: re-issue a QR token; check relay reachability;
  approvals queue locally until reconnect.
- **Corrupt session ledger**: load as empty, continue; ledger rebuilds on
  next launch.
