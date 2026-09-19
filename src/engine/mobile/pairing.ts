import { randomBytes } from 'node:crypto'
import QRCode from 'qrcode'

export type PairingState = 'Disconnected' | 'AwaitingScan' | 'Paired' | 'Connected'

export const PAIRING_TIMEOUT_MS = 5 * 60 * 1000

export interface QrPayload {
  v: 1
  relay: string
  session: string
  token: string
  exp: number
}

export function newToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function newSessionId(): string {
  return `sess_${randomBytes(12).toString('hex')}`
}

export function qrPayload(relayUrl: string, sessionId: string, token: string, expiresAt: number): QrPayload {
  return { v: 1, relay: relayUrl, session: sessionId, token, exp: expiresAt }
}

export function encodeQrPayload(payload: QrPayload): string {
  return JSON.stringify(payload)
}

export function decodeQrPayload(raw: string): QrPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('pairing payload is not JSON')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('pairing payload malformed')
  }
  const p = parsed as Record<string, unknown>
  if (p['v'] !== 1 || typeof p['relay'] !== 'string' || typeof p['session'] !== 'string' || typeof p['token'] !== 'string' || typeof p['exp'] !== 'number') {
    throw new Error('pairing payload malformed')
  }
  try {
    const url = new URL(p['relay'] as string)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('relay must be http(s)')
    }
  } catch (err) {
    throw new Error(`relay endpoint invalid: ${(err as Error).message}`)
  }
  return { v: 1, relay: p['relay'] as string, session: p['session'] as string, token: p['token'] as string, exp: p['exp'] as number }
}

export async function qrSvg(payload: QrPayload): Promise<string> {
  return QRCode.toString(encodeQrPayload(payload), { type: 'svg', margin: 2, width: 256 })
}

export async function qrDataUri(payload: QrPayload): Promise<string> {
  return QRCode.toDataURL(encodeQrPayload(payload), { margin: 2, width: 256 })
}

export class PairingSession {
  private _state: PairingState = 'Disconnected'
  private _payload: QrPayload | null = null

  constructor(
    private readonly relayUrl: string,
    private readonly now: () => number = () => Date.now()
  ) {}

  get state(): PairingState {
    this.prune()
    return this._state
  }

  get payload(): QrPayload | null {
    return this._payload
  }

  begin(timeoutMs: number = PAIRING_TIMEOUT_MS): QrPayload {
    const started = this.now()
    this._payload = qrPayload(this.relayUrl, newSessionId(), newToken(), started + timeoutMs)
    this._state = 'AwaitingScan'
    return this._payload
  }

  markScanned(): void {
    this.prune()
    if (this._state !== 'AwaitingScan') {
      throw new Error(`cannot scan in state ${this._state}`)
    }
    this._state = 'Paired'
  }

  connect(): void {
    this.prune()
    if (this._state !== 'Paired') {
      throw new Error(`cannot connect in state ${this._state}`)
    }
    this._state = 'Connected'
  }

  disconnect(): void {
    this._state = 'Disconnected'
    this._payload = null
  }

  isExpired(now: number = this.now()): boolean {
    return this._payload !== null && now >= this._payload.exp
  }

  private prune(): void {
    if (this._state !== 'Disconnected' && this.isExpired()) {
      this.disconnect()
    }
  }
}
