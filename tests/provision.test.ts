import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { RegistryItem } from '../src/engine/catalog/registry'
import {
  applyFoundryGuard,
  applySelections,
  selectionsTotal,
  type ProgressFn
} from '../src/engine/scaffold/provision'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'vtx-prov-'))
  dirs.push(d)
  return d
}

function item(name: string, extra: Partial<RegistryItem> = {}): RegistryItem {
  return { name, description: `${name} desc`, tags: [], source: 'src', rawUrl: 'http://127.0.0.1:1/nope', install: '', selected: false, ...extra }
}

describe('provisioning pipeline execution', () => {
  it('computes deterministic totals', () => {
    const sel = {
      agents: [item('a')],
      skills: [item('s1'), item('s2')],
      plugins: [item('p', { install: 'mp/p' })],
      hooks: [item('h', { source: 'PostToolUse', install: 'PostToolUse:h' })],
      mcps: [item('m', { install: 'npx -y m' })]
    }
    expect(selectionsTotal(sel)).toBe(2 + 1 + 1 + 1 + 1 + 2 + 1)
  })

  it('provisions selections with monotonic progress', async () => {
    const ws = tempDir()
    const sel = {
      agents: [item('a-one')],
      skills: [item('s-one')],
      plugins: [item('p-one', { install: 'mp/p-one' })],
      hooks: [item('h-one', { source: 'PostToolUse', install: 'PostToolUse:h-one' })],
      mcps: []
    }
    const steps: Array<{ done: number; total: number; file: string }> = []
    const onProgress: ProgressFn = (done, total, file) => {
      steps.push({ done, total, file })
    }
    const { created } = await applySelections(ws, sel, 'opencode', onProgress)
    expect(created.length).toBeGreaterThan(0)
    expect(steps.length).toBeGreaterThan(0)
    const total = selectionsTotal(sel)
    steps.forEach((s, i) => {
      expect(s.total).toBe(total)
      expect(s.done).toBe(i + 1)
    })
    for (const rel of ['.claude/skills/s-one/SKILL.md', '.claude/agents/a-one.md', '.claude/plugins/manifest.json', '.claude/settings.json', 'CLAUDE.md']) {
      expect(readFileSync(join(ws, rel), 'utf8').length).toBeGreaterThan(0)
    }
  })

  it('writes the plan-guard hook non-destructively', async () => {
    const ws = tempDir()
    const first = applyFoundryGuard(ws)
    expect(first.created).toEqual(['.claude/hooks/block-unplanned-edits.json'])
    const body = JSON.parse(
      readFileSync(join(ws, '.claude/hooks/block-unplanned-edits.json'), 'utf8')
    ) as Record<string, string>
    expect(body['name']).toBe('block-unplanned-edits')
    expect(body['event']).toBe('PreToolUse')
    expect(body['checkpoint']).toBe('docs/10-CHECKPOINT.md')
    const second = applyFoundryGuard(ws)
    expect(second.created).toEqual([])
  })
})
