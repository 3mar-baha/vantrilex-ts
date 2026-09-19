# 23 — Stress Testing — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Load and fuzz harness discipline for provisioned projects.

## Status

The `project-stress-tester` skill owns harness scaffolding.

## Schema

### Inputs

Stack detection (Go, Python, Node, Rust manifests) plus the exact test
and bench commands for that stack.

### Output

Dedicated harness directory with a staged-concurrency load driver and a
malformed-input fuzz driver. Non-zero exit on failure with timing lines.
`docs/reports/STRESS_TEST_REPORT.md` records latency percentiles, peak
memory, error rates per stage, and every bottleneck pinned to file and
line with a remediation link.
