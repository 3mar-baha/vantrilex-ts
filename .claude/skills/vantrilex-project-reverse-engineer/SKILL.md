---
name: vantrilex-project-reverse-engineer
description: Document undocumented codebases (Case 3). Read code as truth via inspection, rebuild the 24 docs files, and draft remediation.
---

# vantrilex-project-reverse-engineer (Case 3 — Undocumented existing)

## 1. Zero interview

Ask the owner nothing. The code is the truth; missing docs are the gap.

## 2. Code-as-truth inspection

Inventory manifests, entry points, dependency graphs, state shapes,
network and filesystem touchpoints, and test coverage using file
inspection and AST-level reading. Quote file paths with line numbers for
every structural claim.

## 3. Populate the 28 files

Rebuild every docs/ file from observed behavior, marking inferred intent
as inferred (with the code evidence cited) rather than inventing product
rationale. Every section is filled in completely; unknown intent is recorded as
an open question in docs/09-DECISIONS.md.

## 4. Gap and remediation report

Generate docs/reports/CODEBASE_GAP_AND_REMEDIATION_REPORT.md: every gap
between observed code and required practice, ranked by risk, each with a
concrete remediation step. Also write docs/REMEDIATION_PLAN.md and
docs/AUDIT_REPORT.md for the run, then select remediation tools from the
catalog and draft docs/16-WORKFLOWS.md entries with gated steps.
