import { describe, expect, it, vi } from 'vitest'
import {
  buildCommand,
  hasAuthToken,
  launchAgent,
  launchEnv,
  resumeArgs,
  runnerBin,
  terminalLaunchCommand,
  type RunnerId
} from '../src/engine/runner/spawn'

describe('command building and argv for all runners', () => {
  it('resolves bins and rejects unknown runners', () => {
    expect(runnerBin('claude')).toBe('claude')
    expect(runnerBin('opencode')).toBe('opencode')
    expect(runnerBin('codex')).toBe('codex')
    expect(() => runnerBin('nope' as RunnerId)).toThrow('unknown runner')
  })

  it('builds fresh argv (continue semantics)', () => {
    expect(buildCommand('claude')).toEqual({ bin: 'claude', args: ['--continue'] })
    expect(buildCommand('opencode')).toEqual({ bin: 'opencode', args: ['--continue'] })
    expect(buildCommand('codex')).toEqual({ bin: 'codex', args: ['resume', '--last'] })
  })

  it('builds resume argv per runner contract', () => {
    expect(buildCommand('claude', 'abc')).toEqual({ bin: 'claude', args: ['--resume', 'abc'] })
    expect(buildCommand('opencode', 'abc')).toEqual({ bin: 'opencode', args: ['--session', 'abc'] })
    expect(buildCommand('codex', 'abc')).toEqual({ bin: 'codex', args: ['resume', 'abc'] })
    expect(resumeArgs('claude', '  ')).toEqual(['--continue'])
  })

  it('never places workspace or model flags in argv', () => {
    for (const id of ['opencode', 'claude', 'codex'] as RunnerId[]) {
      const { args } = buildCommand(id, 'r1')
      expect(args.some((a) => a.includes(':\\') || a.includes('--model') || a.includes('--effort'))).toBe(false)
    }
  })
})

describe('environment passthrough without hardcoded secrets', () => {
  it('inherits host auth tokens verbatim', () => {
    const env = launchEnv({ PATH: '/bin', ANTHROPIC_API_KEY: 'sk-x', OPENAI_API_KEY: 'sk-y', OTHER: 'z' })
    expect(env['ANTHROPIC_API_KEY']).toBe('sk-x')
    expect(env['OPENAI_API_KEY']).toBe('sk-y')
    expect(hasAuthToken(env)).toBe(true)
    expect(hasAuthToken({ PATH: '/bin' })).toBe(false)
  })

  it('spawns with cwd set to the workspace and inherited stdio', () => {
    const spawnFn = vi.fn(() => ({ pid: 4242 }) as unknown as ReturnType<typeof launchAgent>)
    launchAgent('opencode', { workspace: 'C:/proj', resumeId: 'r9', spawnFn })
    expect(spawnFn).toHaveBeenCalledWith(
      'opencode',
      ['--session', 'r9'],
      expect.objectContaining({ cwd: 'C:/proj', stdio: 'inherit', detached: false })
    )
  })

  it('builds a dedicated terminal command on request', () => {
    const t = terminalLaunchCommand('claude', 'abc')
    expect(t.command).toBe('powershell')
    expect(t.args.join(' ')).toContain('claude')
    expect(t.args.join(' ')).toContain('--resume')
  })
})
