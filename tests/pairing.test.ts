import { describe, expect, it } from 'vitest'
import {
  decodeQrPayload,
  encodeQrPayload,
  newSessionId,
  newToken,
  PairingSession,
  qrDataUri,
  qrSvg
} from '../src/engine/mobile/pairing'

describe('QR payload format, tokens, endpoint encoding', () => {
  it('emits unique cryptographic tokens and session ids', () => {
    expect(newToken()).not.toBe(newToken())
    expect(newToken().length).toBeGreaterThanOrEqual(32)
    expect(newSessionId()).not.toBe(newSessionId())
    expect(newSessionId().startsWith('sess_')).toBe(true)
  })

  it('round-trips payloads and rejects malformed ones', () => {
    const payload = {
      v: 1 as const,
      relay: 'http://127.0.0.1:8787',
      session: 'sess_abc',
      token: newToken(),
      exp: Date.now() + 60000
    }
    expect(decodeQrPayload(encodeQrPayload(payload))).toEqual(payload)
    expect(() => decodeQrPayload('not json')).toThrow('not JSON')
    expect(() => decodeQrPayload('{"v":2}')).toThrow('malformed')
    expect(() =>
      decodeQrPayload(JSON.stringify({ v: 1, relay: 'ftp://x', session: 's', token: 't', exp: 1 }))
    ).toThrow('relay endpoint invalid')
  })

  it('renders scannable SVG and data URIs', async () => {
    const payload = {
      v: 1 as const,
      relay: 'http://127.0.0.1:8787',
      session: 'sess_abc',
      token: 'tok',
      exp: Date.now() + 60000
    }
    const svg = await qrSvg(payload)
    expect(svg).toContain('<svg')
    const uri = await qrDataUri(payload)
    expect(uri.startsWith('data:image/png;base64,')).toBe(true)
  })
})

describe('pairing state transitions, timeout, disconnect', () => {
  it('walks Disconnected → AwaitingScan → Paired → Connected', () => {
    const now = 1000
    const s = new PairingSession('http://127.0.0.1:8787', () => now)
    expect(s.state).toBe('Disconnected')
    const payload = s.begin(60000)
    expect(s.state).toBe('AwaitingScan')
    expect(payload.exp).toBe(61000)
    expect(() => s.connect()).toThrow('cannot connect')
    s.markScanned()
    expect(s.state).toBe('Paired')
    s.connect()
    expect(s.state).toBe('Connected')
    s.disconnect()
    expect(s.state).toBe('Disconnected')
    expect(s.payload).toBeNull()
  })

  it('expires back to Disconnected and rejects stale scans', () => {
    let now = 0
    const s = new PairingSession('http://127.0.0.1:8787', () => now)
    s.begin(1000)
    now = 1001
    expect(s.state).toBe('Disconnected')
    expect(() => s.markScanned()).toThrow()
  })
})
