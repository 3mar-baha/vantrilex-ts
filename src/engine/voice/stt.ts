import { Keyring } from './keyring'
import type { FetchFn } from './tts'

export const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
export const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo'

export interface SttResult {
  text: string
  model: string
}

export class GroqStt {
  constructor(
    private readonly keyring: Keyring,
    private readonly fetchFn: FetchFn = fetch
  ) {}

  async transcribe(audio: Uint8Array, filename = 'input.mp3', timeoutMs = 120000): Promise<SttResult> {
    if (audio.length === 0) {
      throw new Error('refusing empty STT audio')
    }
    const apiKey = this.keyring.nextKey('groq')
    const form = new FormData()
    form.append('file', new Blob([audio as Uint8Array<ArrayBuffer>], { type: 'audio/mpeg' }), filename)
    form.append('model', GROQ_WHISPER_MODEL)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const resp = await this.fetchFn(GROQ_STT_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal
      })
      if (!resp.ok) {
        throw new Error(await sttError(resp.status, resp))
      }
      const data = (await resp.json()) as { text?: unknown }
      if (typeof data.text !== 'string') {
        throw new Error('groq whisper returned no text')
      }
      return { text: normalizeTranscript(data.text), model: GROQ_WHISPER_MODEL }
    } finally {
      clearTimeout(timer)
    }
  }
}

export function normalizeTranscript(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

async function sttError(status: number, resp: Response): Promise<string> {
  let detail = ''
  try {
    const data = (await resp.json()) as { error?: { message?: string }; message?: string }
    const message = data.error?.message ?? data.message
    if (typeof message === 'string' && message !== '') {
      detail = `: ${message}`
    }
  } catch {
    /* fall through to status-only message */
  }
  switch (status) {
    case 401:
      return `groq unauthorized (401)${detail}`
    case 429:
      return `groq rate limited (429)${detail}`
    default:
      return `groq transcription failed (${status})${detail}`
  }
}
