export const DEFAULT_RELAY_URL = 'http://127.0.0.1:8787'

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

export interface RelayConfig {
  serverUrl: string
}

export function normalizeRelayUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error(`relay URL invalid: ${raw}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`relay URL must be http(s): ${raw}`)
  }
  return url.toString().replace(/\/+$/, '')
}

export interface ApprovalReceipt {
  approvalId: string
}

export type ApprovalDecision = 'approved' | 'rejected' | 'pending'

export class HappyRelay {
  readonly serverUrl: string

  constructor(
    config: { serverUrl?: string } = {},
    private readonly fetchFn: FetchFn = fetch
  ) {
    this.serverUrl = normalizeRelayUrl(config.serverUrl ?? DEFAULT_RELAY_URL)
  }

  private async post<T>(path: string, token: string, body: unknown, timeoutMs = 15000): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const resp = await this.fetchFn(`${this.serverUrl}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      if (!resp.ok) {
        throw new Error(`relay ${path} failed (${resp.status})`)
      }
      return (await resp.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  private async get<T>(path: string, token: string, timeoutMs = 15000): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const resp = await this.fetchFn(`${this.serverUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })
      if (!resp.ok) {
        throw new Error(`relay ${path} failed (${resp.status})`)
      }
      return (await resp.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  async push(sessionId: string, token: string, title: string, body: string): Promise<void> {
    await this.post<void>('/v1/push', token, { session: sessionId, title, body })
  }

  async requestApproval(
    sessionId: string,
    token: string,
    kind: string,
    summary: string
  ): Promise<ApprovalReceipt> {
    return this.post<ApprovalReceipt>('/v1/approvals', token, { session: sessionId, kind, summary })
  }

  async pollDecision(approvalId: string, token: string): Promise<ApprovalDecision> {
    const res = await this.get<{ decision?: unknown }>(
      `/v1/approvals/${encodeURIComponent(approvalId)}`,
      token
    )
    if (res.decision === 'approved' || res.decision === 'rejected') {
      return res.decision
    }
    return 'pending'
  }

  async awaitDecision(
    approvalId: string,
    token: string,
    options: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<ApprovalDecision> {
    const intervalMs = options.intervalMs ?? 2000
    const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000
    const started = Date.now()
    for (;;) {
      const decision = await this.pollDecision(approvalId, token)
      if (decision !== 'pending') {
        return decision
      }
      if (Date.now() - started >= timeoutMs) {
        return 'pending'
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
}
