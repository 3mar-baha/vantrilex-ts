import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const enum ProjectCase {
  Fresh = 1,
  Established = 2,
  Brownfield = 3
}

export interface CaseDetails {
  projectCase: ProjectCase
  language: string
  stack: string
  action: string
}

export const DOC_COMPLETENESS_BYTES = 200

const MANIFESTS: ReadonlyArray<{ file: string; language: string; stack: string }> = [
  { file: 'package.json', language: 'JavaScript/TypeScript', stack: 'Node.js' },
  { file: 'go.mod', language: 'Go', stack: 'Go modules' },
  { file: 'Cargo.toml', language: 'Rust', stack: 'Cargo' },
  { file: 'pyproject.toml', language: 'Python', stack: 'PEP 517' },
  { file: 'Makefile', language: 'Polyglot', stack: 'Make' }
]

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function trimmedSize(path: string): number {
  try {
    return readFileSync(path, 'utf8').trim().length
  } catch {
    return 0
  }
}

function findManifest(dir: string): { file: string; language: string; stack: string } | null {
  for (const m of MANIFESTS) {
    if (isFile(join(dir, m.file))) {
      return m
    }
  }
  try {
    const hits = readdirSync(dir).filter((f) => f.endsWith('.sln'))
    if (hits.length > 0) {
      return { file: hits[0], language: '.NET', stack: 'MSBuild' }
    }
  } catch {
    return null
  }
  return null
}

function caseAction(c: ProjectCase): string {
  switch (c) {
    case ProjectCase.Fresh:
      return 'Run vantrilex-project-founder: interview, draft 28-file spec, select stack.'
    case ProjectCase.Established:
      return 'Run vantrilex-project-onboarder: ingest architecture, expand, update workflows.'
    case ProjectCase.Brownfield:
      return 'Run vantrilex-project-reverse-engineer: read code as truth, rebuild docs.'
  }
}

export function caseName(c: ProjectCase): string {
  switch (c) {
    case ProjectCase.Fresh:
      return 'Case 1 — Fresh workspace'
    case ProjectCase.Established:
      return 'Case 2 — Established workspace'
    case ProjectCase.Brownfield:
      return 'Case 3 — Brownfield / ambiguous repository'
  }
}

export function detectProjectCase(workspace: string): CaseDetails {
  let entries: string[] = []
  try {
    entries = readdirSync(workspace)
  } catch {
    return { projectCase: ProjectCase.Fresh, language: 'None yet', stack: 'Greenfield', action: caseAction(ProjectCase.Fresh) }
  }
  const visible = entries.filter((e) => e !== '.git')
  if (visible.length === 0) {
    return { projectCase: ProjectCase.Fresh, language: 'None yet', stack: 'Greenfield', action: caseAction(ProjectCase.Fresh) }
  }
  const manifest = findManifest(workspace)
  if (manifest && trimmedSize(join(workspace, manifest.file)) > DOC_COMPLETENESS_BYTES) {
    return { projectCase: ProjectCase.Established, language: manifest.language, stack: manifest.stack, action: caseAction(ProjectCase.Established) }
  }
  const language = manifest ? manifest.language : 'Unknown'
  const stack = manifest ? manifest.stack : 'Unknown'
  return { projectCase: ProjectCase.Brownfield, language, stack, action: caseAction(ProjectCase.Brownfield) }
}
