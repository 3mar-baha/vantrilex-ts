import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import type { VantrilexApi } from '../electron/channels'
import { VoicePanel } from '../src/ui/stages/VoicePanel'

function apiWith(status: { fishAudio: { present: boolean; count: number }; groq: { present: boolean; count: number } }): {
  api: VantrilexApi
  calls: Record<string, unknown[][]>
} {
  const calls: Record<string, unknown[][]> = {}
  const record = (name: string) =>
    (...args: unknown[]) => {
      calls[name] = [...(calls[name] ?? []), args]
      return Promise.resolve(undefined)
    }
  const api = {
    detect: record('detect'),
    provision: record('provision'),
    launch: record('launch'),
    ttsSpeak: vi.fn(async () => ({ audioBase64: 'QUJD', format: 'mp3' as const, cached: false })),
    sttTranscribe: vi.fn(async () => ({ text: 'hello world' })),
    keyringStatus: vi.fn(async () => status),
    keyringSet: vi.fn(async () => status),
    pair: record('pair'),
    approve: record('approve'),
    probes: record('probes'),
    sessionsList: record('sessionsList'),
    sessionsDelete: record('sessionsDelete')
  } as unknown as VantrilexApi
  return { api, calls }
}

describe('VoicePanel key config and round-trip test', () => {
  it('shows presence badges without secrets', async () => {
    const { api } = apiWith({ fishAudio: { present: true, count: 2 }, groq: { present: false, count: 0 } })
    render(<VoicePanel api={api} playAudio={() => undefined} />)
    await waitFor(() => {
      expect(screen.getByText('Fish Audio · 2 keys')).toBeTruthy()
    })
    expect(screen.getByText('Groq · no key')).toBeTruthy()
    expect(document.body.textContent).not.toContain('SECRET')
  })

  it('saves keys and tests TTS then STT', async () => {
    const { api } = apiWith({ fishAudio: { present: true, count: 1 }, groq: { present: true, count: 1 } })
    const played: string[] = []
    render(<VoicePanel api={api} playAudio={(b64) => played.push(b64)} />)
    fireEvent.change(screen.getByTestId('voice-fish-input'), { target: { value: '  FISH-1 ' } })
    fireEvent.click(screen.getByTestId('voice-fish-save'))
    await waitFor(() => {
      expect(api.keyringSet).toHaveBeenCalledWith('fish_audio', 'FISH-1')
    })
    expect(screen.getByTestId('voice-message').textContent).toContain('OS vault')
    fireEvent.click(screen.getByTestId('voice-test-tts'))
    await waitFor(() => {
      expect(api.ttsSpeak).toHaveBeenCalledWith('Welcome to Vantrilex. Your workspace is ready.')
    })
    expect(played).toEqual(['QUJD'])
    fireEvent.click(screen.getByTestId('voice-test-stt'))
    await waitFor(() => {
      expect(api.sttTranscribe).toHaveBeenCalledWith('QUJD', 'sample.mp3')
    })
    expect(screen.getByTestId('voice-message').textContent).toContain('Heard: hello world')
  })

  it('asks for audio before transcription', async () => {
    const { api } = apiWith({ fishAudio: { present: false, count: 0 }, groq: { present: true, count: 1 } })
    render(<VoicePanel api={api} playAudio={() => undefined} />)
    await waitFor(() => {
      expect(screen.getByText('Groq · 1 key')).toBeTruthy()
    })
    fireEvent.click(screen.getByTestId('voice-test-stt'))
    await waitFor(() => {
      expect(screen.getByTestId('voice-message').textContent).toContain('Speak a sample first')
    })
    expect(api.sttTranscribe).not.toHaveBeenCalled()
  })
})
