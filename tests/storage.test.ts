import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { escapePowershellArg } from '../src/engine/runner/spawn'
import { loadSessions, recordSession } from '../src/engine/runner/sessions'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

describe('atomic session writes', () => {
  it('leaves no temp files behind', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtx-atomic-'))
    dirs.push(dir)
    const file = join(dir, 'sessions.json')
    recordSession({ workspace: 'C:/a', runner: 'claude' }, file, () => '2026-09-19T00:00:01Z')
    expect(loadSessions(file).length).toBe(1)
    expect(readdirSync(dir)).toEqual(['sessions.json'])
    expect(existsSync(`${file}.tmp`)).toBe(false)
  })
})

describe('powershell argument escaping', () => {
  it('doubles embedded single quotes', () => {
    expect(escapePowershellArg('--resume')).toBe(`'--resume'`)
    expect(escapePowershellArg(`o'brien`)).toBe(`'o''brien'`)
    expect(escapePowershellArg('')).toBe(`''`)
  })
})
