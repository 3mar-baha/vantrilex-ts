import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VantrilexApi } from '../electron/channels'
import { App } from '../src/ui/App'

function mockBridge(overrides: Partial<VantrilexApi> = {}): VantrilexApi {
  return {
    detect: async () => ({ projectCase: 1, language: 'None yet', stack: 'Greenfield', action: 'Found it.' }),
    provision: async () => ({ created: ['docs/01.md', 'docs/02.md'], errors: [] }),
    launch: async () => ({ pid: 123 }),
    ttsSpeak: async () => ({ audioBase64: 'QUJD', format: 'mp3' as const, cached: false }),
    sttTranscribe: async () => ({ text: 'hi' }),
    keyringStatus: async () => ({ fishAudio: { present: true, count: 1 }, groq: { present: false, count: 0 } }),
    keyringSet: async () => ({ fishAudio: { present: true, count: 1 }, groq: { present: false, count: 0 } }),
    mobileStatus: async () => ({
      state: 'Disconnected',
      relayUrl: 'http://127.0.0.1:8787',
      sessionId: null,
      pairedDevices: 0,
      pendingApprovals: 0
    }),
    mobileQrGenerate: async () => ({ svg: '<svg></svg>', dataUri: 'data:image/png;base64,QR', expiresAt: 0 }),
    mobileApprovalRespond: async () => ({ ok: true }),
    mobileScan: async () => ({ state: 'Paired' }),
    mobileConnect: async () => ({ state: 'Connected' }),
    mobileApprovalRequest: async () => ({ id: 'apr-1' }),
    mobileApprovalForward: async () => ({ ok: true }),
    onFoundryProgress: () => () => undefined,
    probes: async () => [
      { key: 'opencode', found: true, version: '1.0.0' },
      { key: 'claude', found: false, version: '' },
      { key: 'codex', found: true, version: '' }
    ],
    sessionsList: async () => [
      { id: 's-1', workspace: 'C:/proj', runner: 'opencode', timestamp: '2026-09-19T00:00:01Z', status: 'exited' }
    ],
    sessionsDelete: async () => ({ ok: true }),
    ...overrides
  }
}

beforeEach(() => {
  Object.defineProperty(window, 'vantrilex', {
    value: mockBridge(),
    configurable: true,
    writable: true
  })
})

describe('guided wizard flow through IPC', () => {
  it('mode → workspace → detect → runner → provisioning → handover', async () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('mode-guided'))
    fireEvent.change(screen.getByTestId('workspace-input'), { target: { value: 'C:/proj' } })
    fireEvent.click(screen.getByTestId('workspace-detect'))
    await waitFor(() => {
      expect(screen.getByTestId('case-card')).toBeTruthy()
    })
    expect(screen.getByTestId('case-card').textContent).toContain('Case 1 Fresh')
    fireEvent.click(screen.getByTestId('case-confirm'))
    await waitFor(() => {
      expect(screen.getByTestId('runner-stage')).toBeTruthy()
    })
    expect(screen.getByTestId('runner-opencode').textContent).toContain('Installed · 1.0.0')
    expect(screen.getByTestId('runner-claude').textContent).toContain('Not found')
    fireEvent.click(screen.getByTestId('runner-opencode'))
    fireEvent.click(screen.getByTestId('runner-continue'))
    await waitFor(() => {
      expect(screen.getByTestId('provisioning-stage')).toBeTruthy()
    })
    expect(screen.getByTestId('progress-label').textContent).toContain('2 of 2')
    fireEvent.click(screen.getByTestId('provisioning-continue'))
    await waitFor(() => {
      expect(screen.getByTestId('handover-sessions')).toBeTruthy()
    })
    expect(screen.getByTestId('handover-runner').textContent).toBe('opencode')
    fireEvent.click(screen.getByTestId('handover-resume-s-1'))
    expect(screen.getByTestId('handover-resume').textContent).toContain('s-1')
  })

  it('classic mode skips the detect card requirement', async () => {
    const detect = vi.fn(async () => ({ projectCase: 3, language: 'Go', stack: 'Go modules', action: 'x' }))
    Object.defineProperty(window, 'vantrilex', { value: mockBridge({ detect }), configurable: true, writable: true })
    render(<App />)
    fireEvent.click(screen.getByTestId('mode-classic'))
    fireEvent.change(screen.getByTestId('workspace-input'), { target: { value: 'C:/proj' } })
    fireEvent.click(screen.getByTestId('workspace-detect'))
    await waitFor(() => {
      expect(screen.getByTestId('case-card')).toBeTruthy()
    })
    expect(detect).toHaveBeenCalledWith('C:/proj')
  })
})
