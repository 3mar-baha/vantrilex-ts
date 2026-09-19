import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { RegistryItem } from '../catalog/registry'
import { immunologySummary, loadLedger } from '../immune/ledger'
import { FOUNDRY_DOCS } from '../foundry/docs'
import { provisionCoreSkills as provisionCoreSkillsImpl } from '../foundry/skills'

export type ProgressFn = (done: number, total: number, file: string) => void

export interface Selections {
  agents: RegistryItem[]
  skills: RegistryItem[]
  plugins: RegistryItem[]
  hooks: RegistryItem[]
  mcps: RegistryItem[]
}

export interface ProvisionResult {
  created: string[]
}

const STARTER_SKILL = `# starter

Starter skill scaffolded by Vantrilex.

## Workflow
1. Read the task and relevant repo files first.
2. Plan the smallest reversible change.
3. Implement, then verify (build/tests).
4. Summarize in English.
`

const STARTER_AGENT = `---
name: planner
description: Starter sub-agent scaffolded by Vantrilex.
---

You are the planner sub-agent. Work in English, keep changes small and verified.
`

async function fetchBody(url: string): Promise<string | null> {
  const trimmed = url.trim()
  if (trimmed === '') {
    return null
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20000)
      try {
        const resp = await fetch(trimmed, { signal: controller.signal })
        const buf = Buffer.from(await resp.arrayBuffer())
        if (!resp.ok || buf.length === 0 || buf.length > 2 * 1024 * 1024) {
          continue
        }
        return buf.toString('utf8')
      } finally {
        clearTimeout(timer)
      }
    } catch {
      continue
    }
  }
  return null
}

export function selectionsTotal(sel: Selections): number {
  return (
    sel.skills.length +
    sel.agents.length +
    (sel.plugins.length > 0 ? 1 : 0) +
    sel.hooks.length +
    (sel.hooks.length > 0 ? 1 : 0) +
    2 * (sel.mcps.length > 0 ? 1 : 0) +
    1
  )
}

export async function applySelections(
  workspace: string,
  sel: Selections,
  runnerId: string,
  onProgress?: ProgressFn
): Promise<ProvisionResult> {
  const created: string[] = []
  let done = 0
  const total = selectionsTotal(sel)
  const step = (file: string) => {
    done += 1
    onProgress?.(done, total, file)
  }

  for (const d of ['.claude/skills', '.claude/agents', '.claude/plugins', '.claude/hooks']) {
    mkdirSync(join(workspace, d), { recursive: true })
  }

  for (const s of sel.skills) {
    const rel = `.claude/skills/${s.name}/SKILL.md`
    const abs = join(workspace, rel)
    if (!existsSync(abs)) {
      let content = `${STARTER_SKILL}\nSource: ${s.source}\n${s.description}\n`
      const body = await fetchBody(s.rawUrl)
      if (body) {
        content = `# ${s.name}\n\n${body}`
      }
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, content, 'utf8')
      created.push(rel)
    }
    step(rel)
  }

  for (const a of sel.agents) {
    const rel = `.claude/agents/${a.name}.md`
    const abs = join(workspace, rel)
    if (!existsSync(abs)) {
      let content = `${STARTER_AGENT}\nRole: ${a.source}\n${a.description}\n`
      const body = await fetchBody(a.rawUrl)
      if (body) {
        content = body
      }
      writeFileSync(abs, content, 'utf8')
      created.push(rel)
    }
    step(rel)
  }

  if (sel.plugins.length > 0) {
    const rel = '.claude/plugins/manifest.json'
    const abs = join(workspace, rel)
    if (!existsSync(abs)) {
      const manifest = { plugins: sel.plugins.map((p) => p.install) }
      writeFileSync(abs, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
      created.push(rel)
    }
    step(rel)
  }

  if (sel.hooks.length > 0) {
    const rel = '.claude/settings.json'
    const abs = join(workspace, rel)
    let cur: Record<string, unknown> = {}
    try {
      cur = JSON.parse(readFileSync(abs, 'utf8')) as Record<string, unknown>
    } catch {
      cur = {}
    }
    const hooks = (cur['hooks'] as Record<string, unknown> | undefined) ?? {}
    for (const h of sel.hooks) {
      const ev = h.source === '' ? 'PostToolUse' : h.source
      const key = `${ev}:${h.name}`
      if (!(key in hooks)) {
        hooks[key] = { command: h.install, event: ev }
      }
      const hrel = `.claude/hooks/${h.name}.json`
      const habs = join(workspace, hrel)
      if (!existsSync(habs)) {
        let content = JSON.stringify({ name: h.name, event: ev, note: h.description })
        const body = await fetchBody(h.rawUrl)
        if (body) {
          content = body
        }
        writeFileSync(habs, content, 'utf8')
        created.push(hrel)
      }
      step(hrel)
    }
    cur['hooks'] = hooks
    if (!existsSync(abs)) {
      writeFileSync(abs, `${JSON.stringify(cur, null, 2)}\n`, 'utf8')
      created.push(rel)
    }
    step(rel)
  }

  const manifest = [`\n## Active Components (runner=${runnerId})\n`]
  const dump = (title: string, items: RegistryItem[]) => {
    manifest.push(`\n### ${title} (${items.length})\n`)
    for (const it of items) {
      manifest.push(`- ${it.name} — ${it.description}\n`)
    }
  }
  dump('Agents', sel.agents)
  dump('Skills', sel.skills)
  dump('Plugins', sel.plugins)
  dump('Hooks', sel.hooks)
  dump('MCP Servers', sel.mcps)
  const claudePath = join(workspace, 'CLAUDE.md')
  if (!existsSync(claudePath)) {
    const immune = immunologySummary(loadLedger())
    writeFileSync(claudePath, `<!-- Vantrilex provisioned -->\n${immune}${manifest.join('')}`, 'utf8')
    created.push('CLAUDE.md')
  } else {
    appendFileSync(claudePath, manifest.join(''), 'utf8')
  }
  step('CLAUDE.md')

  return { created }
}

export function applyFoundryGuard(workspace: string): { created: string[] } {
  const created: string[] = []
  const rel = '.claude/hooks/block-unplanned-edits.json'
  const abs = join(workspace, rel)
  if (!existsSync(abs)) {
    mkdirSync(dirname(abs), { recursive: true })
    const guard = {
      name: 'block-unplanned-edits',
      event: 'PreToolUse',
      matcher: 'Edit|Write',
      checkpoint: 'docs/10-CHECKPOINT.md',
      policy:
        'Block edit and write tool execution unless an approved /plan is recorded in docs/10-CHECKPOINT.md with scope files, MCPs, skills, test command, and rollback step.',
      rollback:
        'Before /code, run git stash create on dirty trees or tag a checkpoint on clean ones. After more than 3 /test failures, prompt automated rollback to the checkpoint before further edits.'
    }
    writeFileSync(abs, `${JSON.stringify(guard, null, 2)}\n`, 'utf8')
    created.push(rel)
  }
  return { created }
}

export function foundryDocCount(): number {
  return FOUNDRY_DOCS.length
}

export async function provisionFoundryDocs(
  workspace: string,
  projectName: string,
  immuneSummaryText: string,
  onProgress?: ProgressFn
): Promise<ProvisionResult> {
  const { scaffoldDocs } = await import('../foundry/docs')
  const { created } = scaffoldDocs(workspace, projectName, { immuneSummary: immuneSummaryText })
  created.forEach((f, i) => onProgress?.(i + 1, created.length, f))
  return { created }
}

export async function provisionCoreSkills(workspace: string): Promise<ProvisionResult> {
  const { created } = provisionCoreSkillsImpl(workspace)
  return { created }
}
