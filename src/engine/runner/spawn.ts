import { spawn, type ChildProcess } from 'node:child_process'

export type RunnerId = 'opencode' | 'claude' | 'codex'

export const RUNNERS: ReadonlyArray<{ id: RunnerId; bin: string; name: string }> = [
  { id: 'opencode', bin: 'opencode', name: 'OpenCode' },
  { id: 'claude', bin: 'claude', name: 'Claude Code' },
  { id: 'codex', bin: 'codex', name: 'OpenAI Codex' }
]

export function runnerBin(id: RunnerId): string {
  const hit = RUNNERS.find((r) => r.id === id)
  if (!hit) {
    throw new Error(`unknown runner: ${id}`)
  }
  return hit.bin
}

export function resumeArgs(id: RunnerId, resumeId: string): string[] {
  if (resumeId.trim() !== '') {
    switch (id) {
      case 'claude':
        return ['--resume', resumeId]
      case 'opencode':
        return ['--session', resumeId]
      case 'codex':
        return ['resume', resumeId]
    }
  }
  switch (id) {
    case 'claude':
    case 'opencode':
      return ['--continue']
    case 'codex':
      return ['resume', '--last']
  }
}

export interface LaunchCommand {
  bin: string
  args: string[]
}

export function buildCommand(id: RunnerId, resumeId = ''): LaunchCommand {
  return { bin: runnerBin(id), args: resumeArgs(id, resumeId) }
}

export const AUTH_TOKEN_PREFIXES = ['ANTHROPIC_', 'OPENAI_', 'GEMINI_', 'GOOGLE_']

export function launchEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  // Inherit the host environment wholesale (Go parity): existing host auth
  // tokens (ANTHROPIC_*, OPENAI_*, ...) flow to the agent. Nothing is
  // hardcoded and nothing extra is injected; use hasAuthToken to probe.
  return { ...base }
}

export function hasAuthToken(env: NodeJS.ProcessEnv = process.env): boolean {
  return Object.keys(env).some((k) => AUTH_TOKEN_PREFIXES.some((p) => k.startsWith(p)))
}

export interface LaunchOptions {
  workspace: string
  resumeId?: string
  spawnFn?: (
    bin: string,
    args: string[],
    options: { cwd: string; env: NodeJS.ProcessEnv; stdio: 'inherit'; detached: boolean }
  ) => ChildProcess
}

export function launchAgent(id: RunnerId, options: LaunchOptions): ChildProcess {
  const { bin, args } = buildCommand(id, options.resumeId ?? '')
  const spawnFn =
    options.spawnFn ??
    ((b, a, o) => spawn(b, a, { cwd: o.cwd, env: o.env, stdio: o.stdio, detached: o.detached, shell: false }))
  return spawnFn(bin, args, { cwd: options.workspace, env: launchEnv(), stdio: 'inherit', detached: false })
}

export function terminalLaunchCommand(id: RunnerId, resumeId = ''): { command: string; args: string[] } {
  const { bin, args } = buildCommand(id, resumeId)
  return {
    command: 'powershell',
    args: ['-NoExit', '-Command', `& ${bin} ${args.map((a) => `'${a}'`).join(' ')}`]
  }
}
