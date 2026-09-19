import { describe, expect, it, vi } from 'vitest'
import {
  checkAll,
  DEPS,
  installCommands,
  installOne,
  lookPath,
  missingAny,
  missingRequired
} from '../src/engine/doctor/deps'

describe('dependency probe detection', () => {
  it('registers all 8 probes including bun', () => {
    expect(DEPS.length).toBe(8)
    const bun = DEPS.find((d) => d.key === 'bun')
    expect(bun).toMatchObject({ binary: 'bun', wingetId: 'Oven-sh.Bun', optional: true })
  })

  it('detects node on the test host', async () => {
    const hit = await lookPath('node')
    expect(hit).not.toBeNull()
  })

  it('misses a nonsense binary', async () => {
    expect(await lookPath('vantrilex-no-such-bin-xyz')).toBeNull()
  })

  it('checkAll returns one status per dep', async () => {
    const all = await checkAll()
    expect(all.length).toBe(DEPS.length)
    const byKey = new Map(all.map((s) => [s.dep.key, s]))
    expect(byKey.get('node')?.found).toBe(true)
  })

  it('splits required from optional misses', () => {
    const fake = DEPS.map((dep) => ({ dep, found: false, version: '', error: 'x' }))
    expect(missingAny(fake).length).toBe(8)
    expect(missingRequired(fake).every((s) => !s.dep.optional)).toBe(true)
    expect(missingRequired(fake).length).toBeLessThan(8)
  })
})

describe('install command generation', () => {
  it('emits winget, npm, and bun fallback plans', () => {
    const bun = DEPS.find((d) => d.key === 'bun')
    if (!bun) {
      throw new Error('bun dep missing')
    }
    expect(installCommands(bun, 'win32')).toEqual([
      'winget install -e --id Oven-sh.Bun',
      'powershell -NoProfile -Command "irm bun.sh/install.ps1 | iex"'
    ])
    const claude = DEPS.find((d) => d.key === 'claude')
    if (!claude) {
      throw new Error('claude dep missing')
    }
    expect(installCommands(claude, 'win32')).toEqual(['npm install -g @anthropic-ai/claude-code'])
  })

  it('installOne no-ops when already present and errors without installer', async () => {
    const node = DEPS.find((d) => d.key === 'node')
    if (!node) {
      throw new Error('node dep missing')
    }
    const runner = vi.fn(async () => ({ stdout: 'ok' }))
    await installOne(node, () => undefined, 'win32', runner)
    expect(runner).not.toHaveBeenCalled()
    await expect(
      installOne({ key: 'npx', label: 'n', binary: 'vantrilex-no-such-bin-xyz', versionArg: '--version' }, () => undefined, 'linux', runner)
    ).rejects.toThrow('install Node first')
  })

  it('installOne falls back from winget to the bun script', async () => {
    const bun = DEPS.find((d) => d.key === 'bun')
    if (!bun) {
      throw new Error('bun dep missing')
    }
    const calls: string[][] = []
    const runner = vi.fn(async (file: string, args: string[]) => {
      calls.push([file, ...args])
      if (file === 'winget') {
        throw new Error('winget exploded')
      }
      return { stdout: 'ok' }
    })
    await installOne({ ...bun, binary: 'vantrilex-no-such-bun-xyz' }, () => undefined, 'win32', runner)
    expect(calls[0][0]).toBe('winget')
    expect(calls[1][0]).toBe('powershell')
  })
})
