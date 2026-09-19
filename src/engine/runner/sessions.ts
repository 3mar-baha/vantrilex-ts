import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { RunnerId } from './spawn'

export const SESSION_CAP = 50

export type SessionStatus = 'active' | 'exited' | 'resumed'

export interface Session {
  id: string
  workspace: string
  runner: RunnerId
  timestamp: string
  status: SessionStatus
}

export function sessionsDir(home: string = homedir()): string {
  const dir = join(home, '.vantrilex')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function sessionsFile(home?: string): string {
  return join(sessionsDir(home), 'sessions.json')
}

export function loadSessions(file?: string): Session[] {
  const path = file ?? sessionsFile()
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (!Array.isArray(parsed)) {
      return []
    }
    return (parsed as Session[])
      .filter((s) => typeof s.id === 'string' && typeof s.workspace === 'string')
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0))
  } catch {
    return []
  }
}

function writeSessions(sessions: Session[], file?: string): void {
  const path = file ?? sessionsFile()
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(sessions, null, 2), 'utf8')
}

let counter = 0

export function recordSession(
  entry: Omit<Session, 'id' | 'timestamp' | 'status'> & Partial<Pick<Session, 'status'>>,
  file?: string,
  now: () => string = () => new Date().toISOString()
): Session {
  counter += 1
  const at = now()
  const session: Session = {
    id: `${at}-${counter}`,
    timestamp: at,
    status: 'active',
    ...entry
  }
  const all = [session, ...loadSessions(file)].slice(0, SESSION_CAP)
  writeSessions(all, file)
  return session
}

export function deleteSession(id: string, file?: string): boolean {
  const kept = loadSessions(file).filter((s) => s.id !== id)
  if (kept.length === loadSessions(file).length) {
    return false
  }
  writeSessions(kept, file)
  return true
}

export function sessionsForWorkspace(workspace: string, file?: string): Session[] {
  return loadSessions(file).filter((s) => s.workspace === workspace)
}
