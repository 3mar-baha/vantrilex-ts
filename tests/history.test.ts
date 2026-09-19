import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  hasCheckpoint,
  latestResumeId,
  primeCheckpoint,
  priorSessions,
  scanWorkspace,
  withCheckpoint,
  type DetectedSession
} from '../src/engine/runner/history'
import type { Session } from '../src/engine/runner/sessions'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'vtx-hist-'))
  dirs.push(d)
  return d
}

describe('history scanner and resume detection', () => {
  it('detects runner markers per workspace', () => {
    const ws = tempDir()
    expect(scanWorkspace(ws)).toEqual([])
    mkdirSync(join(ws, '.claude'))
    mkdirSync(join(ws, '.opencode'))
    const found = scanWorkspace(ws)
    expect(found.map((f) => f.runner).sort()).toEqual(['claude', 'opencode'])
    expect(scanWorkspace(join(ws, 'missing'))).toEqual([])
  })

  it('reads checkpoint presence and primes missing checkpoints', () => {
    const ws = tempDir()
    expect(hasCheckpoint(ws)).toBe(false)
    expect(primeCheckpoint(ws)).toBe(true)
    expect(hasCheckpoint(ws)).toBe(true)
    expect(primeCheckpoint(ws)).toBe(false)
    const d: DetectedSession = { runner: 'claude', workspace: ws, resumeId: '', checkpoint: false }
    expect(withCheckpoint(d, ws).checkpoint).toBe(true)
  })

  it('resolves prior sessions and latest resume id', () => {
    const sessions: Session[] = [
      { id: 'n1', workspace: 'C:/w', runner: 'codex', timestamp: '2026-09-19T00:00:02Z', status: 'exited' },
      { id: 'n0', workspace: 'C:/w', runner: 'codex', timestamp: '2026-09-19T00:00:01Z', status: 'exited' },
      { id: 'x', workspace: 'C:/other', runner: 'codex', timestamp: '2026-09-19T00:00:03Z', status: 'exited' }
    ]
    expect(priorSessions('C:/w', sessions, 'codex').map((s) => s.id)).toEqual(['n1', 'n0'])
    expect(latestResumeId('C:/w', sessions, 'codex')).toBe('n1')
    expect(latestResumeId('C:/missing', sessions, 'codex')).toBe('')
    expect(priorSessions('C:/w', sessions, 'claude')).toEqual([])
  })
})
