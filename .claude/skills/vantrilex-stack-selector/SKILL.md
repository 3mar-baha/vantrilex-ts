---
name: vantrilex-stack-selector
description: Select matching MCPs, agents, skills, and plugins from the provisioned catalog for a project. Invoked by the founder, onboarder, and reverse-engineer skills.
---

# vantrilex-stack-selector

## Inputs

The project summary (docs/ai/PROJECT-CONTEXT.md), the requirements
(docs/01-PRODUCT-REQUIREMENTS.md), and the architecture
(docs/04-ARCHITECTURE.md).

## Procedure

1. Extract capability needs: data sources, protocols, languages,
   review gates, automation hooks.
2. Search each provisioned registry (agents, skills, plugins, hooks,
   MCP servers) with token queries per need; prefer exact-name matches,
   then tag matches.
3. Score candidates: maintained source, narrow scope, composability.
   Reject overlapping picks; one job, one tool.
4. Emit a selection table (need, pick, kind, reason) and write it into
   docs/07-IMPLEMENTATION-PLAN.md under Provisioned tooling, replacing any
   prior table wholesale.
5. List rejected near-misses with one-line reasons so future runs do not
   re-litigate them.

## Rules

Select only provisioned items. If no provisioned item fits a need, record
the gap in docs/08-ROADMAP.md as a milestone dependency instead of
inventing a tool.
