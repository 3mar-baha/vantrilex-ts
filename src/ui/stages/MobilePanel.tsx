import { useCallback, useEffect, useState } from 'react'
import type { MobileStatus, VantrilexApi } from '../../../electron/channels'
import { colors, radii, spacing, typography } from '../../design/tokens'
import { BadgePill } from '../components/BadgePill'
import { ButtonPrimary } from '../components/ButtonPrimary'
import { Card } from '../components/Card'

interface MobilePanelProps {
  api: VantrilexApi | null
}

function stateTone(state: string): 'success' | 'warning' | 'neutral' {
  if (state === 'Connected') {
    return 'success'
  }
  if (state === 'AwaitingScan' || state === 'Paired') {
    return 'warning'
  }
  return 'neutral'
}

export function MobilePanel({ api }: MobilePanelProps) {
  const [status, setStatus] = useState<MobileStatus | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!api) {
      return
    }
    try {
      setStatus(await api.mobileStatus())
    } catch (err) {
      setMessage((err as Error).message)
    }
  }, [api])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const generate = async () => {
    if (!api) {
      return
    }
    setBusy(true)
    try {
      const res = await api.mobileQrGenerate()
      setQr(res.dataUri)
      setMessage(`Code expires ${new Date(res.expiresAt).toLocaleTimeString()}.`)
      await refresh()
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const advance = async (kind: 'scan' | 'connect') => {
    if (!api) {
      return
    }
    setBusy(true)
    try {
      const res = kind === 'scan' ? await api.mobileScan() : await api.mobileConnect()
      setMessage(`Pairing state: ${res.state}.`)
      await refresh()
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section data-testid="mobile-panel" style={{ marginTop: spacing.xl }}>
      <Card variant="light">
        <h2 style={{ ...typography.titleMd, margin: '0 0 8px' }}>Mobile pairing</h2>
        <p style={{ ...typography.bodyMd, color: colors.body, margin: `0 0 ${spacing.md}px` }}>
          Scan the code with your phone to link it to this session through
          your self-hosted relay. Code and approvals never leave your relay.
        </p>
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
          <BadgePill tone={stateTone(status?.state ?? 'Disconnected')}>
            {status?.state ?? '…'}
          </BadgePill>
          {status && status.pairedDevices > 0 && (
            <BadgePill tone="success">{status.pairedDevices} device{status.pairedDevices === 1 ? '' : 's'}</BadgePill>
          )}
          {status && status.pendingApprovals > 0 && (
            <BadgePill tone="warning">{status.pendingApprovals} approval{status.pendingApprovals === 1 ? '' : 's'} pending</BadgePill>
          )}
        </div>
        {qr && (
          <img
            data-testid="mobile-qr"
            src={qr}
            alt="Pairing QR code"
            width={256}
            height={256}
            style={{ borderRadius: radii.md, marginBottom: spacing.md }}
          />
        )}
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <ButtonPrimary data-testid="mobile-generate" disabled={busy} onClick={() => void generate()}>
            {qr ? 'Refresh code' : 'Pair mobile'}
          </ButtonPrimary>
          <button
            data-testid="mobile-scan"
            disabled={busy}
            onClick={() => void advance('scan')}
            style={{
              backgroundColor: colors.surfaceDarkElevated,
              color: colors.onDark,
              borderRadius: radii.md,
              padding: '12px 20px',
              height: 40,
              border: 'none',
              cursor: 'pointer',
              fontFamily: typography.button.fontFamily,
              fontSize: typography.button.fontSize
            }}
          >
            Mark scanned
          </button>
          <button
            data-testid="mobile-connect"
            disabled={busy}
            onClick={() => void advance('connect')}
            style={{
              backgroundColor: colors.surfaceDarkElevated,
              color: colors.onDark,
              borderRadius: radii.md,
              padding: '12px 20px',
              height: 40,
              border: 'none',
              cursor: 'pointer',
              fontFamily: typography.button.fontFamily,
              fontSize: typography.button.fontSize
            }}
          >
            Connect
          </button>
        </div>
        {message !== '' && (
          <p data-testid="mobile-message" style={{ ...typography.bodySm, color: colors.body, margin: `${spacing.sm}px 0 0` }}>
            {message}
          </p>
        )}
      </Card>
    </section>
  )
}
