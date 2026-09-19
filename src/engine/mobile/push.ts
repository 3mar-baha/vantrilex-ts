import { randomBytes } from 'node:crypto'
import { HappyRelay } from './relay'

export type ApprovalKind = 'bash' | 'write' | 'edit' | 'other'

export interface ApprovalRequest {
  id: string
  sessionId: string
  kind: ApprovalKind
  summary: string
  createdAt: string
  relayId: string | null
  decision: 'pending' | 'approved' | 'rejected'
}

export class ApprovalQueue {
  private readonly items = new Map<string, ApprovalRequest>()
  private counter = 0

  request(sessionId: string, kind: ApprovalKind, summary: string, now: () => string = () => new Date().toISOString()): ApprovalRequest {
    this.counter += 1
    const req: ApprovalRequest = {
      id: `apr-${now()}-${this.counter}-${randomBytes(4).toString('hex')}`,
      sessionId,
      kind,
      summary,
      createdAt: now(),
      relayId: null,
      decision: 'pending'
    }
    this.items.set(req.id, req)
    return req
  }

  pending(): ApprovalRequest[] {
    return [...this.items.values()].filter((r) => r.decision === 'pending')
  }

  get(id: string): ApprovalRequest | null {
    return this.items.get(id) ?? null
  }

  respond(id: string, decision: 'approved' | 'rejected'): boolean {
    const req = this.items.get(id)
    if (!req || req.decision !== 'pending') {
      return false
    }
    req.decision = decision
    return true
  }

  async forward(relay: HappyRelay, id: string, token: string): Promise<boolean> {
    const req = this.items.get(id)
    if (!req || req.decision !== 'pending') {
      return false
    }
    const receipt = await relay.requestApproval(req.sessionId, token, req.kind, req.summary)
    req.relayId = receipt.approvalId
    return true
  }

  async awaitRemoteDecision(
    relay: HappyRelay,
    id: string,
    token: string,
    options?: { intervalMs?: number; timeoutMs?: number; now?: () => number; sleep?: (ms: number) => Promise<void> }
  ): Promise<'approved' | 'rejected' | 'pending'> {
    const req = this.items.get(id)
    if (!req || !req.relayId) {
      return 'pending'
    }
    const decision = await relay.awaitDecision(req.relayId, token, options)
    if (decision !== 'pending') {
      req.decision = decision
    }
    return decision
  }
}
