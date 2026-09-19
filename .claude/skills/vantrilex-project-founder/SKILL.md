---
name: vantrilex-project-founder
description: Found greenfield projects (Case 1). Interview the owner, draft the 24-file docs hierarchy, select the stack, and synthesize gated workflows.
---

# vantrilex-project-founder (Case 1 — Greenfield)

## 1. Concept intake

Ask the owner for one concept paragraph: what the product does, for whom,
and why now. Do not proceed on a one-line idea; ask one clarifying round
first if the paragraph is missing users or value.

## 2. Ten crucial questions

Formulate exactly 10 non-technical questions (business, users, value,
workflow) and present them in ONE copyable block so the owner can answer
elsewhere or delegate to another AI. Cover: primary user, painful problem,
current workaround, definition of done, must-have versus nice-to-have,
success metric, budget and timeline bounds, integrations, risks, and
launch audience.

## 3. Populate in four batches

Fill all 28 files under docs/ with complete prose (every section filled in,
no placeholder text), in this order:

- Batch 1 Vision: docs/VISION.md, docs/ai/PROJECT-CONTEXT.md,
  docs/01-PRODUCT-REQUIREMENTS.md, docs/02-PRODUCT-SPECIFICATION.md,
  docs/08-ROADMAP.md.
- Batch 2 Architecture: docs/03-TECHNICAL-SPECIFICATION.md,
  docs/04-ARCHITECTURE.md, docs/05-DATA-MODEL.md,
  docs/06-API-SPECIFICATION.md, docs/12-SECURITY.md,
  docs/00-MAP-OF-ARCHITECTURE.md.
- Batch 3 Execution: docs/07-IMPLEMENTATION-PLAN.md,
  docs/09-DECISIONS.md, docs/10-CHECKPOINT.md, docs/11-TESTING.md,
  docs/13-DEPLOYMENT.md, docs/14-RUNBOOK.md, docs/15-ORACLE-DEPLOY.md,
  docs/00-MAP-OF-TESTING-AND-AUDITS.md.
- Batch 4 Governance: docs/TIMELINE.md, docs/PROJECT-JOURNEY.md,
  docs/HANDOFF.md, docs/ai/AI-INSTRUCTIONS.md, docs/16-WORKFLOWS.md.

Then write the run-generated governance outputs for this session:
docs/OWNER_ACTION_REQUIRED.md and docs/OWNER-NEXT-STEPS.md.

## 4. Stack selection

Invoke vantrilex-stack-selector against the provisioned catalog
(agents, skills, plugins, hooks, MCP servers) and record the picks in
docs/12-TOOLING.md with one-line reasons.

## 5. Workflows

Synthesize docs/16-WORKFLOWS.md entries with strict
/plan -> /code -> /test -> /sync gates before any implementation begins.
