---
name: project-stress-tester
description: Detect the project stack, scaffold a load and fuzz harness, and report bottlenecks with file and line locations.
---

# project-stress-tester

## 1. Detect the stack

Inspect manifests: go.mod (Go), package.json (Node), pyproject.toml or
setup.py (Python), Cargo.toml (Rust). Record the choice and the exact
test and bench commands for that stack.

## 2. Scaffold the harness

Create a dedicated harness directory (stress/ or equivalent): a load
driver that ramps concurrency in stages, and a fuzz driver that feeds
malformed inputs to parsers and handlers. The harness exits non-zero on
any failure and prints machine-readable timing lines.

## 3. Measure

Run the harness and record latency percentiles, peak memory, and error
rates per concurrency stage. Repeat the peak stage to confirm stability
before concluding.

## 4. Report

Write docs/reports/STRESS_TEST_REPORT.md: stack and commands, stage
table with latency, memory, and errors, and every bottleneck pinned to
file and line. Each bottleneck links a remediation item in
docs/REMEDIATION_PLAN.md.
