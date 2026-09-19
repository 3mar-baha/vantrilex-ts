---
name: vantrilex-project-onboarder
description: Extend documented projects (Case 2). Ingest existing architecture, expand features, provision missing tools, update workflows.
---

# vantrilex-project-onboarder (Case 2 — Documented existing)

## 1. Ingest

Read docs/01-PRODUCT-REQUIREMENTS.md, docs/04-ARCHITECTURE.md, and
docs/00-MAP-OF-ARCHITECTURE.md end to end. Summarize the system back to
the owner in five lines and confirm understanding before continuing.

## 2. Feature expansion

Prompt the owner for the new feature or expansion scope. Map it to
affected components, data entities, contracts, and tests, citing the
numbered docs by section.

## 3. Tool gap check

Search the provisioned catalog for MCPs, skills, agents, and plugins the
expansion needs. Provision missing tools through the launcher flow, then
record every addition in docs/07-IMPLEMENTATION-PLAN.md with its reason.

## 4. Update

Extend the affected numbered docs in the same change, append a
docs/09-DECISIONS.md entry, and add docs/16-WORKFLOWS.md entries with
/plan -> /code -> /test -> /sync gates. Refresh docs/HANDOFF.md last.
