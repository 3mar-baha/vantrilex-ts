import { statSync } from 'node:fs'
import { join } from 'node:path'
import type { RunnerId } from './spawn'
import type { Session } from './sessions'
import { checkpointPath, hasCheckpoint, primeCheckpoint } from '../foundry/checkpoint'

export { checkpointPath, hasCheckpoint, primeCheckpoint }

export interface DetectedSession {
  runner: RunnerId
  workspace: string
  resumeId: string
  checkpoint: boolean
}

const SESSION_MARKERS: Array<{ dir: string; runner: RunnerId }> = [
  { dir: '.claude', runner: 'claude' },
  { dir: '.opencode', runner: 'opencode' },
  { dir: '.codex', runner: 'codex' }
]

export function scanWorkspace(workspace: string): DetectedSession[] {
  const out: DetectedSession[] = []
  try {
    if (!statSync(workspace).isDirectory()) {
      return out
    }
  } catch {
    return out
  }
  for (const m of SESSION_MARKERS) {
    try {
      if (statSync(join(workspace, m.dir)).isDirectory()) {
        out.push({ runner: m.runner, workspace, resumeId: '', checkpoint: false })
      }
    } catch {
      continue
    }
  }
  return out
}

export function withCheckpoint(session: DetectedSession, workspace: string): DetectedSession {
  return { ...session, checkpoint: hasCheckpoint(workspace) }
}

export function priorSessions(workspace: string, sessions: Session[], runner: RunnerId): Session[] {
  return sessions.filter((s) => s.workspace === workspace && s.runner === runner)
}

export function latestResumeId(workspace: string, sessions: Session[], runner: RunnerId): string {
  const hit = priorSessions(workspace, sessions, runner)[0]
  return hit ? hit.id : ''
}
