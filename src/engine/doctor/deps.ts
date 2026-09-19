import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { delimiter, join } from 'node:path'
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { env, platform } from 'node:process'

const execFileAsync = promisify(execFile)

export interface Dep {
  key: string
  label: string
  binary: string
  fallbacks?: string[]
  versionArg: string
  kind?: 'npm'
  npmPkg?: string
  wingetId?: string
  optional?: boolean
}

export interface DepStatus {
  dep: Dep
  found: boolean
  version: string
  error: string
}

export const DEPS: Dep[] = [
  { key: 'git', label: 'Git (repo sync)', binary: 'git', versionArg: '--version', wingetId: 'Git.Git' },
  { key: 'node', label: 'Node.js (runners)', binary: 'node', versionArg: '--version', wingetId: 'OpenJS.NodeJS.LTS' },
  { key: 'npx', label: 'npx (runner exec)', binary: 'npx', versionArg: '--version' },
  { key: 'bun', label: 'Bun (ultra-fast JS/TS runtime & MCP accelerator)', binary: 'bun', versionArg: '--version', wingetId: 'Oven-sh.Bun', optional: true },
  { key: 'chafa', label: 'Chafa (logo render)', binary: 'chafa', versionArg: '--version', wingetId: 'HansPetterJansson.Chafa', optional: true },
  { key: 'claude', label: 'Claude Code CLI', binary: 'claude', versionArg: '--version', kind: 'npm', npmPkg: '@anthropic-ai/claude-code' },
  { key: 'opencode', label: 'OpenCode Agent', binary: 'opencode', fallbacks: ['opencode-ai'], versionArg: '--version', kind: 'npm', npmPkg: 'opencode-ai' },
  { key: 'codex', label: 'OpenAI Codex CLI', binary: 'codex', versionArg: '--version', kind: 'npm', npmPkg: '@openai/codex', optional: true }
]

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

export async function lookPath(binary: string, fallbacks: string[] = []): Promise<string | null> {
  if (binary.includes('/') || binary.includes('\\')) {
    return (await isExecutable(binary)) ? binary : null
  }
  const pathEnv = env.PATH ?? ''
  const dirs = pathEnv.split(delimiter).filter(Boolean)
  const names = platform === 'win32' ? [binary, ...['.exe', '.cmd', '.bat', '.ps1'].map((ext) => binary + ext)] : [binary]
  for (const dir of dirs) {
    for (const name of names) {
      const full = join(dir, name)
      if (await isExecutable(full)) {
        return full
      }
    }
  }
  for (const fb of fallbacks) {
    const hit = await lookPath(fb, [])
    if (hit) {
      return hit
    }
  }
  return null
}

export async function checkOne(dep: Dep): Promise<DepStatus> {
  const path = await lookPath(dep.binary, dep.fallbacks ?? [])
  if (!path) {
    return { dep, found: false, version: '', error: 'not on PATH' }
  }
  try {
    const { stdout } = await execFileAsync(path, [dep.versionArg], { timeout: 15000 })
    const line = stdout.split('\n', 1)[0].trim().slice(0, 64)
    return { dep, found: true, version: line, error: '' }
  } catch {
    return { dep, found: true, version: 'installed', error: '' }
  }
}

export async function checkAll(deps: Dep[] = DEPS): Promise<DepStatus[]> {
  const out: DepStatus[] = []
  for (const d of deps) {
    out.push(await checkOne(d))
  }
  return out
}

export function missingRequired(all: DepStatus[]): DepStatus[] {
  return all.filter((s) => !s.found && !s.dep.optional)
}

export function missingAny(all: DepStatus[]): DepStatus[] {
  return all.filter((s) => !s.found)
}

export function installCommands(dep: Dep, os: string = platform): string[] {
  const cmds: string[] = []
  if (os === 'win32' && dep.wingetId) {
    cmds.push(`winget install -e --id ${dep.wingetId}`)
  }
  if (dep.kind === 'npm' && dep.npmPkg) {
    cmds.push(`npm install -g ${dep.npmPkg}`)
  }
  if (dep.key === 'bun') {
    cmds.push(`powershell -NoProfile -Command "irm bun.sh/install.ps1 | iex"`)
  }
  if (cmds.length === 0 && os !== 'win32') {
    cmds.push(`install ${dep.binary} via system package manager`)
  }
  return cmds
}

export type Logger = (line: string) => void

function oneLine(s: string): string {
  return s.trim().split('\n', 1)[0].slice(0, 220)
}

async function runLogged(file: string, args: string[], log: Logger): Promise<{ stdout: string }> {
  const { stdout } = await execFileAsync(file, args, { timeout: 300000 })
  log(oneLine(stdout))
  return { stdout }
}

export async function installOne(
  dep: Dep,
  log: Logger,
  os: string = platform,
  runner: (file: string, args: string[], log: Logger) => Promise<{ stdout: string }> = runLogged
): Promise<void> {
  if (await lookPath(dep.binary, dep.fallbacks ?? [])) {
    return
  }
  if (os === 'win32' && dep.wingetId) {
    log(`winget: installing ${dep.wingetId} ...`)
    try {
      await runner('winget', ['install', '-e', '--silent', '--accept-package-agreements', '--accept-source-agreements', '--id', dep.wingetId], log)
      return
    } catch (err) {
      log(`winget failed: ${oneLine((err as Error).message)}`)
    }
  }
  if (dep.kind === 'npm' && dep.npmPkg) {
    log(`npm: installing -g ${dep.npmPkg} ...`)
    try {
      await runner('npm', ['install', '-g', dep.npmPkg], log)
      return
    } catch (err) {
      throw new Error(`npm install failed: ${oneLine((err as Error).message)}`)
    }
  }
  if (dep.key === 'bun') {
    log('bun: falling back to install script ...')
    try {
      await runner('powershell', ['-NoProfile', '-Command', 'irm bun.sh/install.ps1 | iex'], log)
      return
    } catch (err) {
      throw new Error(`bun install failed: ${oneLine((err as Error).message)}`)
    }
  }
  if (dep.key === 'npx') {
    throw new Error('npx ships with Node.js — install Node first')
  }
  throw new Error(`no automatic installer for ${dep.binary} on ${os}`)
}
