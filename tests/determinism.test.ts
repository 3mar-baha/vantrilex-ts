import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { caseAction, caseName, detectProjectCase, ProjectCase } from '../src/engine/foundry/detect'
import { HappyRelay } from '../src/engine/mobile/relay'
import { ApprovalQueue } from '../src/engine/mobile/push'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('detection determinism and fallbacks', () => {
  it('picks solution files deterministically', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtx-sln-'))
    dirs.push(dir)
    writeFileSync(join(dir, 'z.sln'), 'x\n', 'utf8')
    writeFileSync(join(dir, 'a.sln'), 'x\n', 'utf8')
    for (let i = 0; i < 3; i++) {
      const d = detectProjectCase(dir)
      expect(d.projectCase).toBe(ProjectCase.Brownfield)
      expect(d.language).toBe('.NET')
      expect(d.stack).toBe('MSBuild')
    }
  })

  it('falls back on unknown cases', () => {
    expect(caseName(99 as ProjectCase)).toBe('Unknown case')
    expect(caseAction(99 as ProjectCase)).toContain('Re-run detection')
  })
})

describe('awaitDecision clock seam', () => {
  it('resolves without real timers', async () => {
    let now = 0
    const sleeps: number[] = []
    const fetchFn = vi.fn(async (): Promise<Response> => okJson({ decision: 'approved' }))
    const relay = new HappyRelay({}, fetchFn)
    const res = await relay.awaitDecision('r-1', 'TOK', {
      intervalMs: 2000,
      timeoutMs: 60000,
      now: () => now,
      sleep: async (ms: number) => {
        sleeps.push(ms)
        now += ms
      }
    })
    expect(res).toBe('approved')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(sleeps).toEqual([])
  })

  it('times out on the injected clock', async () => {
    let now = 0
    const fetchFn = vi.fn(async (): Promise<Response> => okJson({}))
    const relay = new HappyRelay({}, fetchFn)
    const res = await relay.awaitDecision('r-1', 'TOK', {
      intervalMs: 1000,
      timeoutMs: 2500,
      now: () => now,
      sleep: async (ms: number) => {
        now += ms
      }
    })
    expect(res).toBe('pending')
    // Poll happens before the timeout check, so the expiring iteration
    // still polls: t=0,1000,2000 poll, then t=3000 trips the timeout.
    expect(fetchFn).toHaveBeenCalledTimes(4)
  })

  it('propagates the seam through the queue', async () => {
    const q = new ApprovalQueue()
    const req = q.request('sess-1', 'bash', 'npm test')
    const fetchFn = vi.fn(async (): Promise<Response> => okJson({ approvalId: 'r-7' }))
    const relay = new HappyRelay({}, fetchFn)
    expect(await q.forward(relay, req.id, 'TOK')).toBe(true)
    const okFetch = vi.fn(async (): Promise<Response> => okJson({ decision: 'rejected' }))
    const relay2 = new HappyRelay({}, okFetch)
    expect(await q.awaitRemoteDecision(relay2, req.id, 'TOK', { intervalMs: 1, timeoutMs: 10 })).toBe('rejected')
    expect(q.get(req.id)?.decision).toBe('rejected')
  })
})
