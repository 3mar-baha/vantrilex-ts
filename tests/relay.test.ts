import { describe, expect, it, vi } from 'vitest'
import { ApprovalQueue } from '../src/engine/mobile/push'
import { HappyRelay, normalizeRelayUrl } from '../src/engine/mobile/relay'

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('relay endpoint encoding and approval dispatch', () => {
  it('normalizes relay URLs and rejects non-http', () => {
    expect(normalizeRelayUrl('http://127.0.0.1:8787/')).toBe('http://127.0.0.1:8787')
    expect(() => normalizeRelayUrl('ftp://x')).toThrow('http(s)')
    expect(() => normalizeRelayUrl('not a url')).toThrow('invalid')
  })

  it('posts push and approval requests with bearer auth', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetchFn = vi.fn(async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push({ url: input, init: init ?? {} })
      if (input.endsWith('/v1/approvals')) {
        return okJson({ approvalId: 'r-1' })
      }
      return okJson({})
    })
    const relay = new HappyRelay({ serverUrl: 'http://127.0.0.1:8787/' }, fetchFn)
    expect(relay.serverUrl).toBe('http://127.0.0.1:8787')
    await relay.push('sess-1', 'TOK', 'Agent done', 'Review please')
    await relay.requestApproval('sess-1', 'TOK', 'bash', 'npm test')
    expect(calls.length).toBe(2)
    const headers = calls[0].init.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer TOK')
    expect(calls[1].url).toBe('http://127.0.0.1:8787/v1/approvals')
  })

  it('polls decisions and surfaces relay errors', async () => {
    const relay = new HappyRelay(
      {},
      (async () => okJson({ decision: 'approved' })) as (input: string, init?: RequestInit) => Promise<Response>
    )
    expect(await relay.pollDecision('r-1', 'TOK')).toBe('approved')
    const bad = new HappyRelay({}, (async () => new Response('nope', { status: 500 })) as (
      input: string,
      init?: RequestInit
    ) => Promise<Response>)
    await expect(bad.pollDecision('r-1', 'TOK')).rejects.toThrow('failed (500)')
    const pending = new HappyRelay({}, (async () => okJson({})) as (
      input: string,
      init?: RequestInit
    ) => Promise<Response>)
    expect(await pending.awaitDecision('r-1', 'TOK', { intervalMs: 1, timeoutMs: 5 })).toBe('pending')
  })
})

describe('approval queue dispatch and response', () => {
  it('requests, forwards, and resolves decisions', async () => {
    const q = new ApprovalQueue()
    const req = q.request('sess-1', 'bash', 'npm test')
    expect(q.pending().length).toBe(1)
    expect(q.respond('missing', 'approved')).toBe(false)
    const fetchFn = vi.fn(async (): Promise<Response> => okJson({ approvalId: 'r-9' }))
    const relay = new HappyRelay({}, fetchFn)
    expect(await q.forward(relay, req.id, 'TOK')).toBe(true)
    expect(await q.awaitRemoteDecision(relay, req.id, 'TOK', { intervalMs: 1, timeoutMs: 50 })).toBe('pending')
    expect(q.respond(req.id, 'rejected')).toBe(true)
    expect(q.respond(req.id, 'approved')).toBe(false)
    expect(q.pending()).toEqual([])
    expect(q.get(req.id)?.decision).toBe('rejected')
  })
})
