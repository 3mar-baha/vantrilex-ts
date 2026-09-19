# 10 — Checkpoint — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

The approved-plan ledger that gates all code changes.

## Status

An edit or write tool runs only against a checkpoint recorded here.

## Schema

### Active plan

Plan ID, scope files, MCPs and skills named, test command, rollback
step, approver, approval timestamp. The pre-tool hook reads this
section; absent or expired plans block execution.

### History

Closed checkpoints archive here with outcome (shipped, reverted) and
the workflow log reference. History is never rewritten.
