import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { caseName, detectProjectCase, ProjectCase } from '../src/engine/foundry/detect'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'vtx-detect-'))
  dirs.push(d)
  return d
}

describe('3-case detection accuracy', () => {
  it('classifies empty and .git-only dirs as fresh', () => {
    const empty = tempDir()
    expect(detectProjectCase(empty).projectCase).toBe(ProjectCase.Fresh)
    const gitOnly = tempDir()
    mkdirSync(join(gitOnly, '.git'))
    const d = detectProjectCase(gitOnly)
    expect(d.projectCase).toBe(ProjectCase.Fresh)
    expect(d.action).toContain('vantrilex-project-founder')
  })

  it('classifies hollow manifests as brownfield', () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'go.mod'), 'module x\n')
    const d = detectProjectCase(dir)
    expect(d.projectCase).toBe(ProjectCase.Brownfield)
    expect(d.language).toBe('Go')
    expect(d.stack).toBe('Go modules')
  })

  it('classifies substantive manifests as established', () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'package.json'), `{"name":"demo","version":"1.0.0","description":"${'x'.repeat(220)}"}\n`)
    const d = detectProjectCase(dir)
    expect(d.projectCase).toBe(ProjectCase.Established)
    expect(d.language).toBe('JavaScript/TypeScript')
  })

  it('names every case', () => {
    expect(caseName(ProjectCase.Fresh)).toContain('Case 1')
    expect(caseName(ProjectCase.Established)).toContain('Case 2')
    expect(caseName(ProjectCase.Brownfield)).toContain('Case 3')
  })
})
