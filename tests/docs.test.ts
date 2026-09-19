import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { FOUNDRY_DOCS, scaffoldDocs } from '../src/engine/foundry/docs'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'vtx-docs-'))
  dirs.push(d)
  return d
}

describe('28-file completeness, formatting, idempotence', () => {
  it('defines exactly 28 unique paths with metadata and sections', () => {
    expect(FOUNDRY_DOCS.length).toBe(28)
    const seen = new Set<string>()
    for (const doc of FOUNDRY_DOCS) {
      expect(seen.has(doc.path)).toBe(false)
      seen.add(doc.path)
      expect(doc.body).toContain('<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->')
      for (const section of ['## Purpose', '## Status', '## Schema']) {
        expect(doc.body, `${doc.path} missing ${section}`).toContain(section)
      }
    }
  })

  it('scaffolds 28 files with substitution, no filler, idempotent', () => {
    const ws = tempDir()
    const first = scaffoldDocs(ws, 'demo', { immuneSummary: '## Immune Ledger (1 entries)\n' })
    expect(first.created.length).toBe(28)
    for (const rel of first.created) {
      const body = readFileSync(join(ws, rel), 'utf8')
      expect(body).not.toContain('{{PROJECT}}')
      expect(body).toContain('demo')
      const scrubbed = body.split('./...').join('')
      expect(scrubbed).not.toContain('TODO')
      expect(scrubbed).not.toContain('...')
    }
    const ai = readFileSync(join(ws, 'docs/ai/AI-INSTRUCTIONS.md'), 'utf8')
    expect(ai).toContain('Strict Zero-Action-Without-Plan Policy')
    expect(ai).toContain('## Immune Ledger (1 entries)')
    const wf = readFileSync(join(ws, 'docs/16-WORKFLOWS.md'), 'utf8')
    expect(wf).toContain('/plan -> /code -> /test -> /sync')
    const second = scaffoldDocs(ws, 'demo', {})
    expect(second.created).toEqual([])
    expect(second.kept.length).toBe(28)
  })
})
