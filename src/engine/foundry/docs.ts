import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const FOUNDRY_META = '<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->'

export interface FoundryDoc {
  path: string
  body: string
}

export interface ScaffoldResult {
  created: string[]
  kept: string[]
}

function doc(title: string, purpose: string, status: string, schema: string): string {
  return `# ${title}\n\n${FOUNDRY_META}\n\n## Purpose\n\n${purpose}\n\n## Status\n\n${status}\n\n## Schema\n\n${schema}\n`
}

export const FOUNDRY_DOCS: FoundryDoc[] = [
  {
    path: 'docs/ai/AI-INSTRUCTIONS.md',
    body: doc(
      'AI Instructions — {{PROJECT}}',
      'Mandatory operating rules for every AI agent working in this workspace. Read this file before any other action.',
      'Active. Violations halt the workflow.',
      `### Plan Gate (mandatory)

Strict Zero-Action-Without-Plan Policy. The AI is strictly forbidden from
writing or modifying code without an approved /plan detailing the exact
MCPs and Skills to be used. If a required tool cannot be used, halt
immediately and report the blocker instead of improvising.

A valid /plan names: the target files, the MCP servers involved, the
skills applied, the test command that proves the change, and the rollback
step. No plan, no code. No exceptions for small edits.

### Reading order

1. docs/ai/PROJECT-CONTEXT.md for the project summary.
2. docs/00-MAP-OF-ARCHITECTURE.md to locate components.
3. The numbered specification relevant to the task (01 through 16).
4. docs/16-WORKFLOWS.md for the /plan -> /code -> /test -> /sync gates.

### Response rules

- Keep responses strictly in English.
- Prefer small, reversible changes with tests.
- Update the affected numbered doc in the same change that alters behavior.
- Never invent MCP servers, skills, or endpoints; use only provisioned ones.`
    )
  },
  {
    path: 'docs/ai/PROJECT-CONTEXT.md',
    body: doc(
      'Project Context — {{PROJECT}}',
      'One-page orientation for new contributors, human or AI.',
      'Bootstrapped by the Vantrilex Project Foundry.',
      `### Summary

{{PROJECT}} is described end to end in this docs/ hierarchy: intent in
01 through 08, execution in 09 through 16, governance in VISION.md and
TIMELINE.md.

### Entry points

docs/VISION.md, docs/01-PRODUCT-REQUIREMENTS.md,
docs/04-ARCHITECTURE.md, docs/16-WORKFLOWS.md.`
    )
  },
  {
    path: 'docs/00-MAP-OF-ARCHITECTURE.md',
    body: doc(
      'Map of Architecture — {{PROJECT}}',
      'Index from every component to its detail doc.',
      'Update this map whenever a component moves.',
      `| Component | Detail doc |
|---|---|
| Requirements | docs/01-PRODUCT-REQUIREMENTS.md |
| Specification | docs/02-PRODUCT-SPECIFICATION.md |
| Technical design | docs/03-TECHNICAL-SPECIFICATION.md |
| Architecture | docs/04-ARCHITECTURE.md |
| Data model | docs/05-DATA-MODEL.md |
| API contracts | docs/06-API-SPECIFICATION.md |
| Implementation | docs/07-IMPLEMENTATION-PLAN.md |`
    )
  },
  {
    path: 'docs/00-MAP-OF-TESTING-AND-AUDITS.md',
    body: doc(
      'Map of Testing and Audits — {{PROJECT}}',
      'Index from every verification activity to its strategy doc and gate.',
      'Audit findings land in docs/reports/ and triage into governance.',
      `| Activity | Strategy | Gate |
|---|---|---|
| Unit and integration | docs/11-TESTING.md | /test |
| Security review | docs/12-SECURITY.md | /test |
| Runbook drills | docs/14-RUNBOOK.md | /sync |
| Decision log | docs/09-DECISIONS.md | /sync |`
    )
  },
  {
    path: 'docs/01-PRODUCT-REQUIREMENTS.md',
    body: doc(
      '01 — Product Requirements — {{PROJECT}}',
      'The single problem, users, value, and scope boundaries in plain words.',
      'Draft. Every requirement carries an ID and a verification method.',
      `### Problem

One paragraph for a non-technical reader.

### Users and value

Each user group with its measurable outcome and one minimum metric.

### Scope boundaries

What the product explicitly does not do. Unlisted and un-backlogged
work is out of scope.

### Acceptance

IDs (REQ-001, REQ-002, and so on), each with test, review, or demo
verification. A requirement without verification is a wish.`
    )
  },
  {
    path: 'docs/02-PRODUCT-SPECIFICATION.md',
    body: doc(
      '02 — Product Specification — {{PROJECT}}',
      'Feature-level specification derived from docs/01 requirements.',
      'Each feature traces to at least one REQ ID.',
      `### Features

Feature records: ID (FEAT-001, FEAT-002, and so on), parent REQ IDs,
behavior, edge cases, and acceptance criteria in observable terms.

### Personas

Name, role, technical comfort, goal, current workaround, and failure
mode per persona. Low-comfort personas drive guided wording.`
    )
  },
  {
    path: 'docs/03-TECHNICAL-SPECIFICATION.md',
    body: doc(
      '03 — Technical Specification — {{PROJECT}}',
      'Implementation-facing specification: components, flows, and contracts.',
      'Mirrors docs/04-ARCHITECTURE.md at finer granularity.',
      `### Components

One component per section: responsibility, inputs, outputs, and the
contract at each boundary. One component, one owner, one reason to change.

### Flows

Primary flows traced input to output with error branches named.`
    )
  },
  {
    path: 'docs/04-ARCHITECTURE.md',
    body: doc(
      '04 — Architecture — {{PROJECT}}',
      'System structure, dependency direction, and constraints.',
      'Structural changes require a docs/09-DECISIONS.md entry.',
      `### Structure

Components, responsibilities, and dependency direction.

### Constraints

Language, runtime, hosting, and dependency constraints with reasons.`
    )
  },
  {
    path: 'docs/05-DATA-MODEL.md',
    body: doc(
      '05 — Data Model — {{PROJECT}}',
      'Entities, fields, ownership, lifecycle, and retention.',
      'Invariants enforced by the layer named per invariant.',
      `### Entities

Fields with types, required versus optional, lifecycle rules.

### Integrity

Invariants that must always hold, each with its enforcing layer and a
test reference in docs/11-TESTING.md.`
    )
  },
  {
    path: 'docs/06-API-SPECIFICATION.md',
    body: doc(
      '06 — API Specification — {{PROJECT}}',
      'Every endpoint and interface contract in one place.',
      'Published contracts version with migration notes.',
      `### Contracts

Method and path (or signature), inputs with validation, outputs with
shapes, error codes with meanings, versioning policy.`
    )
  },
  {
    path: 'docs/07-IMPLEMENTATION-PLAN.md',
    body: doc(
      '07 — Implementation Plan — {{PROJECT}}',
      'Ordered build sequence from empty tree to shippable increment.',
      'Steps execute through docs/16-WORKFLOWS.md gates only.',
      `### Phases

Numbered phases, each with entry criteria, file-level changes, test
commands, and exit criteria. No phase starts until the prior gate is
green.

### Provisioned tooling

The stack-selector table lives here: need, pick, kind, reason per tool,
plus rejected near-misses so reruns do not re-litigate choices.`
    )
  },
  {
    path: 'docs/08-ROADMAP.md',
    body: doc(
      '08 — Roadmap — {{PROJECT}}',
      'Sequenced milestones from now to launch and beyond.',
      'Milestones move only with a docs/09-DECISIONS.md entry.',
      `### Milestones

Dated milestones, each with the shippable outcome and the requirement
IDs it satisfies. The top item is always the next increment.`
    )
  },
  {
    path: 'docs/09-DECISIONS.md',
    body: doc(
      '09 — Decisions — {{PROJECT}}',
      'Immutable log of structural choices.',
      'Append-only. Reversals are new entries referencing the original.',
      `### Entries

Date, context, options considered, decision, reason, revisit trigger.
A tradeoff with no revisit trigger is deferred debt.`
    )
  },
  {
    path: 'docs/10-CHECKPOINT.md',
    body: doc(
      '10 — Checkpoint — {{PROJECT}}',
      'The approved-plan ledger that gates all code changes.',
      'An edit or write tool runs only against a checkpoint recorded here.',
      `### Active plan

Plan ID, scope files, MCPs and skills named, test command, rollback
step, approver, approval timestamp. The pre-tool hook reads this
section; absent or expired plans block execution.`
    )
  },
  {
    path: 'docs/11-TESTING.md',
    body: doc(
      '11 — Testing — {{PROJECT}}',
      'Test layers, commands, and justification discipline.',
      'Every change cites the command run and its result in the workflow log.',
      `### Layers

Unit behavior, component seams, and end-to-end journeys from the
product specification.

### Justification

Each test answers what bug it catches that no other test catches.
Tests without an answer are deleted.`
    )
  },
  {
    path: 'docs/12-SECURITY.md',
    body: doc(
      '12 — Security — {{PROJECT}}',
      'Authentication, authorization, secrets, validation, and update policy.',
      'New trust boundaries are recorded here before code crosses them.',
      `### Boundaries

Every boundary (user input, network payloads, deserialized data) with
its validation. Inside a validated boundary, trust the contract.`
    )
  },
  {
    path: 'docs/13-DEPLOYMENT.md',
    body: doc(
      '13 — Deployment — {{PROJECT}}',
      'Build, artifact, environment, migration, and rollback steps.',
      'Production promotion requires a green /test gate.',
      `### Pipeline

Ordered steps with exact commands, environments, promoters, and the
rollback procedure per environment.`
    )
  },
  {
    path: 'docs/14-RUNBOOK.md',
    body: doc(
      '14 — Runbook — {{PROJECT}}',
      'Operational procedures for logs, alerts, incidents, and recovery.',
      'Every alert links a procedure; alerts without procedures are removed.',
      `### Procedures

Symptom, diagnosis steps, fix, and verify per alert. Incident drills
reference docs/11-TESTING.md coverage.`
    )
  },
  {
    path: 'docs/15-ORACLE-DEPLOY.md',
    body: doc(
      '15 — Oracle Deploy — {{PROJECT}}',
      'Oracle Cloud deployment target: tenancy, compartment, and shape plan.',
      'Values are concrete per environment; no placeholder regions or shapes.',
      `### Target

Tenancy and compartment layout, compute shapes, networking, storage,
and the deploy command sequence with rollback.`
    )
  },
  {
    path: 'docs/16-WORKFLOWS.md',
    body: doc(
      '16 — Workflows — {{PROJECT}}',
      'The gated state machine every change travels.',
      'Skipping a gate restarts the workflow at /plan.',
      `### Gates

/plan -> /code -> /test -> /sync — in this order, no skipping.

A /plan names exact MCPs, Skills, files, tests, and rollback, and is
recorded in docs/10-CHECKPOINT.md. Deviations restart /plan.

### Atomic rollback checkpoint

Before /code, create a checkpoint: git stash create for dirty trees
or a checkpoint tag for clean ones. If /test fails more than 3 times,
prompt automated rollback to the checkpoint before further edits.

### Tool gates

Steps may use provisioned MCPs and Skills only. A missing or unusable
required tool halts the workflow with a blocker report.

### Workflow log

Date, plan reference, tests with results, docs updated per workflow.`
    )
  },
  {
    path: 'docs/VISION.md',
    body: doc(
      'Vision — {{PROJECT}}',
      'North star, principles, and non-goals.',
      'Principles resolve tradeoffs; new ones arrive via docs/09-DECISIONS.md.',
      `### North star

One paragraph: the future this project creates.

### Principles

Numbered, tradeoff-resolving. Clarity over cleverness, reversibility
over speed, unless a decision entry says otherwise.

### Non-goals

What success explicitly excludes.`
    )
  },
  {
    path: 'docs/TIMELINE.md',
    body: doc(
      'Timeline — {{PROJECT}}',
      'Dated horizons and review cadence.',
      'Dates move only with a decision entry explaining why.',
      `### Horizons

Now, next, later — each with its shippable outcome.

### Cadence

Risk review, backlog pruning, dependency updates.`
    )
  },
  {
    path: 'docs/PROJECT-JOURNEY.md',
    body: doc(
      'Project Journey — {{PROJECT}}',
      'Dated project memory that survives turnover.',
      'Append shipped work, learnings, and direction changes.',
      `### Log

Date, shipped increment, lesson, direction change with reason.`
    )
  },
  {
    path: 'docs/REMEDIATION_PLAN.md',
    body: doc(
      'Remediation Plan — {{PROJECT}}',
      'Ranked remediation backlog from audits and gap reports.',
      'Items close only with a linked workflow log entry.',
      `### Items

Gap reference, risk rank, remediation step, owner, workflow ID.
Source reports live in docs/reports/.`
    )
  },
  {
    path: 'docs/HANDOFF.md',
    body: doc(
      'Handoff — {{PROJECT}}',
      'Session-to-session continuity.',
      'Regenerated at the end of every session.',
      `### State

Current status, open threads with file and section pointers.

### Next session

The exact first three actions with commands to run.`
    )
  },
  {
    path: 'docs/OWNER_ACTION_REQUIRED.md',
    body: doc(
      'Owner Action Required — {{PROJECT}}',
      'Decisions and approvals only the owner can give.',
      'Empty means nothing is blocked on the owner.',
      `### Items

Question, context, options with recommendation, deadline. Case skills
append here instead of stalling.`
    )
  },
  {
    path: 'docs/OWNER-NEXT-STEPS.md',
    body: doc(
      'Owner Next Steps — {{PROJECT}}',
      "The owner's personal checklist after each session.",
      'Checked items stay visible with completion dates.',
      `### Steps

Ordered actions with commands or links. Regenerated per session by the
active case skill.`
    )
  },
  {
    path: 'docs/AUDIT_REPORT.md',
    body: doc(
      'Audit Report — {{PROJECT}}',
      'Latest audit verdict with evidence.',
      'Superseded reports archive under docs/reports/ with dates.',
      `### Verdict

Pass or fail per area, evidence quoted (file paths, command output),
remediation links into docs/REMEDIATION_PLAN.md.`
    )
  }
]

export interface ScaffoldOptions {
  immuneSummary?: string
}

function exists(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch {
    return false
  }
}

export function scaffoldDocs(
  workspace: string,
  projectName: string,
  options: ScaffoldOptions = {}
): ScaffoldResult {
  const name = projectName.trim() === '' ? workspace.split(/[\\/]/).filter(Boolean).pop() ?? 'project' : projectName.trim()
  const created: string[] = []
  const kept: string[] = []
  for (const dir of ['docs', 'docs/ai', 'docs/reports']) {
    mkdirSync(join(workspace, dir), { recursive: true })
  }
  for (const file of FOUNDRY_DOCS) {
    let body = file.body.split('{{PROJECT}}').join(name)
    if (file.path === 'docs/ai/AI-INSTRUCTIONS.md' && options.immuneSummary) {
      body += `\n${options.immuneSummary}`
    }
    const abs = join(workspace, file.path)
    if (exists(abs)) {
      kept.push(file.path)
      continue
    }
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, body, 'utf8')
    created.push(file.path)
  }
  return { created, kept }
}
