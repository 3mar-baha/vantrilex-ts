import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyringStatusView, VantrilexApi } from '../../../electron/channels'
import { colors, radii, spacing, typography } from '../../design/tokens'
import { BadgePill } from '../components/BadgePill'
import { ButtonPrimary } from '../components/ButtonPrimary'
import { Card } from '../components/Card'

interface VoicePanelProps {
  api: VantrilexApi | null
  playAudio?: (audioBase64: string) => void
}

const SAMPLE_TEXT = 'Welcome to Vantrilex. Your workspace is ready.'

function defaultPlay(audioBase64: string): void {
  const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`)
  void audio.play()
}

export function VoicePanel({ api, playAudio = defaultPlay }: VoicePanelProps) {
  const [status, setStatus] = useState<KeyringStatusView | null>(null)
  const [fishKey, setFishKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const lastAudio = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    if (!api) {
      return
    }
    try {
      setStatus(await api.keyringStatus())
    } catch (err) {
      setMessage((err as Error).message)
    }
  }, [api])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveKey = async (provider: 'fish_audio' | 'groq', secret: string) => {
    if (!api || secret.trim() === '') {
      return
    }
    setBusy(true)
    try {
      setStatus(await api.keyringSet(provider, secret.trim()))
      if (provider === 'fish_audio') {
        setFishKey('')
      } else {
        setGroqKey('')
      }
      setMessage('Key saved to the OS vault.')
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const testTts = async () => {
    if (!api) {
      return
    }
    setBusy(true)
    try {
      const res = await api.ttsSpeak(SAMPLE_TEXT)
      lastAudio.current = res.audioBase64
      playAudio(res.audioBase64)
      setMessage(res.cached ? 'Spoke from cache.' : 'Spoke via Fish Audio.')
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const testStt = async () => {
    if (!api || !lastAudio.current) {
      setMessage('Speak a sample first, then test transcription.')
      return
    }
    setBusy(true)
    try {
      const res = await api.sttTranscribe(lastAudio.current, 'sample.mp3')
      setMessage(`Heard: ${res.text}`)
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    flex: 1,
    backgroundColor: colors.canvas,
    color: colors.ink,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    borderRadius: radii.md,
    border: `1px solid ${colors.hairline}`,
    padding: '10px 14px',
    height: 40
  }

  return (
    <section data-testid="voice-panel" style={{ marginTop: spacing.xl }}>
      <Card variant="light">
        <h2 style={{ ...typography.titleMd, margin: '0 0 8px' }}>Voice and keys</h2>
        <p style={{ ...typography.bodyMd, color: colors.body, margin: `0 0 ${spacing.md}px` }}>
          Fish Audio speaks, Groq Whisper listens. Keys live in the OS vault;
          this panel only ever shows presence, never secrets.
        </p>
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
          <BadgePill tone={status?.fishAudio.present ? 'success' : 'neutral'}>
            Fish Audio · {status ? (status.fishAudio.present ? `${status.fishAudio.count} key${status.fishAudio.count === 1 ? '' : 's'}` : 'no key') : '…'}
          </BadgePill>
          <BadgePill tone={status?.groq.present ? 'success' : 'neutral'}>
            Groq · {status ? (status.groq.present ? `${status.groq.count} key${status.groq.count === 1 ? '' : 's'}` : 'no key') : '…'}
          </BadgePill>
        </div>
        <div style={{ display: 'grid', gap: spacing.sm, marginBottom: spacing.md }}>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <input
              data-testid="voice-fish-input"
              type="password"
              value={fishKey}
              onChange={(e) => setFishKey(e.target.value)}
              placeholder="Fish Audio API key"
              autoComplete="off"
              style={inputStyle}
            />
            <ButtonPrimary data-testid="voice-fish-save" disabled={busy || fishKey.trim() === ''} onClick={() => void saveKey('fish_audio', fishKey)}>
              Save
            </ButtonPrimary>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <input
              data-testid="voice-groq-input"
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="Groq API key"
              autoComplete="off"
              style={inputStyle}
            />
            <ButtonPrimary data-testid="voice-groq-save" disabled={busy || groqKey.trim() === ''} onClick={() => void saveKey('groq', groqKey)}>
              Save
            </ButtonPrimary>
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <ButtonPrimary data-testid="voice-test-tts" disabled={busy || !status?.fishAudio.present} onClick={() => void testTts()}>
            Test speech
          </ButtonPrimary>
          <button
            data-testid="voice-test-stt"
            disabled={busy || !status?.groq.present}
            onClick={() => void testStt()}
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
            Test transcription
          </button>
        </div>
        {message !== '' && (
          <p data-testid="voice-message" style={{ ...typography.bodySm, color: colors.body, margin: `${spacing.sm}px 0 0` }}>
            {message}
          </p>
        )}
      </Card>
    </section>
  )
}
