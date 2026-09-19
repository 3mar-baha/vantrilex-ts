import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RunnerId } from './spawn'
import type { Session } from './sessions'

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

export function checkpointPath(workspace: string): string {
  return join(workspace, 'docs', '10-CHECKPOINT.md')
}

export function hasCheckpoint(workspace: string): boolean {
  try {
    return readFileSync(checkpointPath(workspace), 'utf8').trim().length > 0
  } catch {
    return false
  }
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

export function primeCheckpoint(workspace: string): boolean {
  const path = checkpointPath(workspace)
  if (existsSync(path)) {
    return false
  }
  mkdirSync(join(workspace, 'docs'), { recursive: true })
  writeFileSync(
    path,
    '# 10 — Checkpoint\n\n<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->\n\n## Purpose\n\nThe approved-plan ledger that gates all code changes.\n\n## Status\n\nSeeded by history scan; awaiting the first approved plan.\n\n## Schema\n\n### Active plan\n\nNo active plan recorded yet.\n',
    'utf8'
  )
  return true
}
