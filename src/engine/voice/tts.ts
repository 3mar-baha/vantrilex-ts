import { createHash } from 'node:crypto'
import { Keyring } from './keyring'

export const FISH_TTS_URL = 'https://api.fish.audio/v1/tts'
export const FISH_TTS_MODEL = 's2.1-pro-free'
export const TTS_CACHE_LIMIT = 50

export interface TtsResult {
  audio: Uint8Array
  format: 'mp3'
  cached: boolean
}

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

function cacheKey(text: string): string {
  return createHash('sha256').update(`fish:${FISH_TTS_MODEL}:${text}`).digest('hex')
}

export class FishTts {
  private cache = new Map<string, Uint8Array>()

  constructor(
    private readonly keyring: Keyring,
    private readonly fetchFn: FetchFn = fetch
  ) {}

  cacheSize(): number {
    return this.cache.size
  }

  clearCache(): void {
    this.cache.clear()
  }

  async speak(text: string, timeoutMs = 60000): Promise<TtsResult> {
    const trimmed = text.trim()
    if (trimmed === '') {
      throw new Error('refusing empty TTS text')
    }
    const key = cacheKey(trimmed)
    const hit = this.cache.get(key)
    if (hit) {
      return { audio: hit, format: 'mp3', cached: true }
    }
    const apiKey = this.keyring.nextKey('fish_audio')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const resp = await this.fetchFn(FISH_TTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          model: FISH_TTS_MODEL
        },
        body: JSON.stringify({
          text: trimmed,
          format: 'mp3',
          normalize: true,
          chunk_length: 300,
          latency: 'normal'
        }),
        signal: controller.signal
      })
      if (!resp.ok) {
        throw new Error(await ttsError(resp.status, resp))
      }
      const audio = new Uint8Array(await resp.arrayBuffer())
      if (audio.length === 0) {
        throw new Error('fish audio returned empty audio')
      }
      if (this.cache.size >= TTS_CACHE_LIMIT) {
        const oldest = this.cache.keys().next()
        if (!oldest.done) {
          this.cache.delete(oldest.value)
        }
      }
      this.cache.set(key, audio)
      return { audio, format: 'mp3', cached: false }
    } finally {
      clearTimeout(timer)
    }
  }
}

async function ttsError(status: number, resp: Response): Promise<string> {
  let detail = ''
  try {
    const data = (await resp.json()) as { message?: string }
    if (typeof data.message === 'string' && data.message !== '') {
      detail = `: ${data.message}`
    }
  } catch {
    /* fall through to status-only message */
  }
  switch (status) {
    case 401:
      return `fish audio unauthorized (401)${detail}`
    case 402:
      return `fish audio quota exhausted (402)${detail}`
    case 503:
      return `fish audio overloaded (503)${detail}`
    default:
      return `fish audio request failed (${status})${detail}`
  }
}
