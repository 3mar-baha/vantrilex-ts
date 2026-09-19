import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  deleteSession,
  loadSessions,
  recordSession,
  SESSION_CAP,
  sessionsForWorkspace
} from '../src/engine/runner/sessions'

const files: string[] = []
afterEach(() => {
  for (const f of files.splice(0)) {
    rmSync(f, { force: true })
  }
})

function tempFile(): string {
  const p = join(mkdtempSync(join(tmpdir(), 'vtx-sess-')), 'sessions.json')
  files.push(p)
  return p
}

const tick = (() => {
  let n = 0
  return () => `2026-09-19T00:00:${String(n++).padStart(3, '0')}Z`
})()

describe('session ledger cap, sorting, persistence, deletion', () => {
  it('starts empty on missing or corrupt files', () => {
    expect(loadSessions(join(tempFile(), 'nope.json'))).toEqual([])
  })

  it('evicts oldest beyond the 50-session cap, newest-first', () => {
    const file = tempFile()
    for (let i = 0; i < SESSION_CAP + 5; i++) {
      recordSession({ workspace: `C:/p${i}`, runner: 'opencode' }, file, tick)
    }
    const all = loadSessions(file)
    expect(all.length).toBe(SESSION_CAP)
    expect(all[0].workspace).toBe(`C:/p${SESSION_CAP + 4}`)
    expect(all.every((s, i, a) => i === 0 || a[i - 1].timestamp >= s.timestamp)).toBe(true)
  })

  it('deletes by id and filters by workspace', () => {
    const file = tempFile()
    const a = recordSession({ workspace: 'C:/a', runner: 'claude' }, file, tick)
    recordSession({ workspace: 'C:/b', runner: 'codex' }, file, tick)
    expect(deleteSession('missing', file)).toBe(false)
    expect(deleteSession(a.id, file)).toBe(true)
    expect(loadSessions(file).length).toBe(1)
    expect(sessionsForWorkspace('C:/b', file).length).toBe(1)
    expect(sessionsForWorkspace('C:/a', file)).toEqual([])
  })
})
