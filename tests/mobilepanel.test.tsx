import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import type { VantrilexApi } from '../electron/channels'
import { MobilePanel } from '../src/ui/stages/MobilePanel'

function apiWith(status: { state: string; relayUrl: string; sessionId: string | null; pairedDevices: number; pendingApprovals: number }): VantrilexApi {
  return {
    detect: vi.fn(),
    provision: vi.fn(),
    launch: vi.fn(),
    ttsSpeak: vi.fn(),
    sttTranscribe: vi.fn(),
    keyringStatus: vi.fn(),
    keyringSet: vi.fn(),
    mobileStatus: vi.fn(async () => status),
    mobileQrGenerate: vi.fn(async () => ({
      svg: '<svg></svg>',
      dataUri: 'data:image/png;base64,QR',
      expiresAt: Date.now() + 60000
    })),
    mobileApprovalRespond: vi.fn(async () => ({ ok: true })),
    probes: vi.fn(),
    sessionsList: vi.fn(),
    sessionsDelete: vi.fn()
  } as unknown as VantrilexApi
}

describe('MobilePanel pairing and status', () => {
  it('shows state, device, and pending approval pills', async () => {
    const api = apiWith({
      state: 'Connected',
      relayUrl: 'http://127.0.0.1:8787',
      sessionId: 'sess-1',
      pairedDevices: 1,
      pendingApprovals: 2
    })
    render(<MobilePanel api={api} />)
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeTruthy()
    })
    expect(screen.getByText('1 device')).toBeTruthy()
    expect(screen.getByText('2 approvals pending')).toBeTruthy()
  })

  it('generates and renders the QR code', async () => {
    const api = apiWith({
      state: 'Disconnected',
      relayUrl: 'http://127.0.0.1:8787',
      sessionId: null,
      pairedDevices: 0,
      pendingApprovals: 0
    })
    render(<MobilePanel api={api} />)
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeTruthy()
    })
    fireEvent.click(screen.getByTestId('mobile-generate'))
    await waitFor(() => {
      expect(api.mobileQrGenerate).toHaveBeenCalledTimes(1)
    })
    const img = screen.getByTestId('mobile-qr') as HTMLImageElement
    expect(img.src).toContain('data:image/png;base64,QR')
    expect(screen.getByTestId('mobile-message').textContent).toContain('expires')
  })

  it('surfaces relay errors without secrets', async () => {
    const api = apiWith({
      state: 'Disconnected',
      relayUrl: 'http://127.0.0.1:8787',
      sessionId: null,
      pairedDevices: 0,
      pendingApprovals: 0
    })
    api.mobileQrGenerate = vi.fn(async () => {
      throw new Error('relay unreachable')
    })
    render(<MobilePanel api={api} />)
    fireEvent.click(screen.getByTestId('mobile-generate'))
    await waitFor(() => {
      expect(screen.getByTestId('mobile-message').textContent).toContain('relay unreachable')
    })
  })
})
