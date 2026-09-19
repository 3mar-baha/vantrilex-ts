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
    speak: async () => ({ audioId: 'a', cached: false }),
    transcribe: async () => ({ text: 'hi' }),
    pair: async () => ({ qrPayload: 'qr' }),
    approve: async () => ({ ok: true }),
    probes: async () => [
      { key: 'opencode', found: true, version: '1.0.0' },
      { key: 'claude', found: false, version: '' },
      { key: 'codex', found: true, version: '' }
    ],
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
    expect(screen.getByTestId('handover-stage')).toBeTruthy()
    expect(screen.getByTestId('handover-runner').textContent).toBe('opencode')
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
