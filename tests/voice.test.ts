import { describe, expect, it, vi } from 'vitest'
import { Keyring, MemoryKeyStore } from '../src/engine/voice/keyring'
import { FishTts, FISH_TTS_MODEL, FISH_TTS_URL } from '../src/engine/voice/tts'
import { GroqStt, GROQ_STT_URL, GROQ_WHISPER_MODEL, normalizeTranscript } from '../src/engine/voice/stt'

function keyringWithFish(...secrets: string[]): Keyring {
  const kr = new Keyring(new MemoryKeyStore())
  for (const s of secrets) {
    kr.addKey('fish_audio', s)
  }
  return kr
}

function okAudio(body: string): Response {
  return new Response(new TextEncoder().encode(body), {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg' }
  })
}

function errJson(status: number, message: string): Response {
  return new Response(JSON.stringify({ status, message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('fish audio TTS payload and errors', () => {
  it('posts the documented shape with model header and bearer key', async () => {
    const seenCall: { url: unknown; init: unknown } = { url: null, init: null }
    const fetchFn = vi.fn(async (url: unknown, init: unknown): Promise<Response> => {
      seenCall.url = url
      seenCall.init = init
      return okAudio('AUDIO-BYTES')
    })
    const tts = new FishTts(keyringWithFish('K1'), fetchFn)
    const res = await tts.speak('Hello there')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(seenCall.url).toBe(FISH_TTS_URL)
    const headers = (seenCall.init as { headers: Record<string, string> }).headers
    expect(headers['Authorization']).toBe('Bearer K1')
    expect(headers['model']).toBe(FISH_TTS_MODEL)
    expect(headers['Content-Type']).toBe('application/json')
    const body = JSON.parse((seenCall.init as { body: string }).body) as Record<string, unknown>
    expect(body['text']).toBe('Hello there')
    expect(body['format']).toBe('mp3')
    expect(new TextDecoder().decode(res.audio)).toBe('AUDIO-BYTES')
    expect(res.format).toBe('mp3')
    expect(res.cached).toBe(false)
  })

  it('caches clips and rejects empty text', async () => {
    const fetchFn = vi.fn(async () => okAudio('CLIP'))
    const tts = new FishTts(keyringWithFish('K1'), fetchFn)
    await tts.speak('repeat me')
    const res = await tts.speak('repeat me')
    expect(res.cached).toBe(true)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(tts.cacheSize()).toBe(1)
    await expect(tts.speak('   ')).rejects.toThrow('refusing empty TTS text')
  })

  it('rotates keys across the pool and maps 401/402/503', async () => {
    const seen: string[] = []
    const fetchFn = vi.fn(async (input: string, init?: RequestInit): Promise<Response> => {
      expect(input).toBe(FISH_TTS_URL)
      seen.push(((init?.headers ?? {}) as Record<string, string>)['Authorization'] ?? '')
      return okAudio(`clip-${seen.length}`)
    })
    const tts = new FishTts(keyringWithFish('K1', 'K2'), fetchFn)
    for (let i = 0; i < 11; i++) {
      await tts.speak(`utterance ${i}`)
    }
    expect(seen.slice(0, 10).every((h) => h === 'Bearer K1')).toBe(true)
    expect(seen[10]).toBe('Bearer K2')

    const tts401 = new FishTts(keyringWithFish('K9'), vi.fn(async () => errJson(401, 'bad key')))
    await expect(tts401.speak('x')).rejects.toThrow('unauthorized (401): bad key')
    const tts402 = new FishTts(keyringWithFish('K9'), vi.fn(async () => errJson(402, 'broke')))
    await expect(tts402.speak('x')).rejects.toThrow('quota exhausted (402)')
    const tts503 = new FishTts(keyringWithFish('K9'), vi.fn(async () => errJson(503, 'busy')))
    await expect(tts503.speak('x')).rejects.toThrow('overloaded (503)')
  })
})

describe('groq whisper transcription', () => {
  it('posts multipart audio and normalizes text', async () => {
    const seen: { body: unknown } = { body: null }
    const fetchFn = vi.fn(async (input: string, init?: RequestInit): Promise<Response> => {
      expect(input).toBe(GROQ_STT_URL)
      seen.body = init?.body ?? null
      return new Response(JSON.stringify({ text: '  hello   world \n' }), { status: 200 })
    })
    const kr = new Keyring(new MemoryKeyStore())
    kr.addKey('groq', 'G1')
    const stt = new GroqStt(kr, fetchFn)
    const res = await stt.transcribe(new Uint8Array([1, 2, 3]), 'note.mp3')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe(GROQ_STT_URL)
    expect((init?.headers as Record<string, string>)['Authorization']).toBe('Bearer G1')
    expect((seen.body as FormData).get('model')).toBe(GROQ_WHISPER_MODEL)
    expect(res.text).toBe('hello world')
    expect(normalizeTranscript('  a  b\nc ')).toBe('a b c')
  })

  it('rejects empty audio and maps 401/429', async () => {
    const kr = new Keyring(new MemoryKeyStore())
    kr.addKey('groq', 'G1')
    const stt = new GroqStt(kr, vi.fn(async () => errJson(401, 'nope')))
    await expect(stt.transcribe(new Uint8Array([9]))).rejects.toThrow('unauthorized (401)')
    const empty = new GroqStt(kr, vi.fn(async () => okAudio('x')))
    await expect(empty.transcribe(new Uint8Array([]))).rejects.toThrow('refusing empty STT audio')
    const limited = new GroqStt(kr, vi.fn(async () => errJson(429, 'slow down')))
    await expect(limited.transcribe(new Uint8Array([9]))).rejects.toThrow('rate limited (429)')
  })
})



