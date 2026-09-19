import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CORE_SKILLS, provisionCoreSkills, skillBody, SKILL_CREATOR } from '../src/engine/foundry/skills'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

describe('skill frontmatter and content', () => {
  it('registers exactly 7 core skills', () => {
    expect(CORE_SKILLS.length).toBe(7)
    expect(new Set(CORE_SKILLS).size).toBe(7)
  })

  it('provisions all skills with frontmatter, idempotent', () => {
    const ws = mkdtempSync(join(tmpdir(), 'vtx-skills-'))
    dirs.push(ws)
    const first = provisionCoreSkills(ws)
    expect(first.created.length).toBe(7)
    for (const dir of CORE_SKILLS) {
      const body = readFileSync(join(ws, '.claude', 'skills', dir, 'SKILL.md'), 'utf8')
      expect(body.startsWith(`---\nname: ${dir}`)).toBe(true)
      if (dir !== SKILL_CREATOR) {
        expect(body).not.toContain('TODO')
        expect(body).not.toContain('...')
      }
    }
    const second = provisionCoreSkills(ws)
    expect(second.created).toEqual([])
    expect(second.kept.length).toBe(7)
  })

  it('rejects unknown skill dirs', () => {
    expect(() => skillBody('nope')).toThrow('unknown core skill')
  })
})
