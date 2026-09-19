import { describe, expect, it } from 'vitest'
import { Keyring, MemoryKeyStore, ROTATION_AFTER_REQUESTS } from '../src/engine/voice/keyring'

function keyringWith(provider: 'fish_audio' | 'groq', secrets: string[]): Keyring {
  const kr = new Keyring(new MemoryKeyStore())
  for (const s of secrets) {
    kr.addKey(provider, s)
  }
  return kr
}

describe('10-request rotation invariant', () => {
  it('uses one key 10 times then rolls over on request 11', () => {
    const kr = keyringWith('fish_audio', ['A', 'B'])
    const seen: string[] = []
    for (let i = 0; i < 22; i++) {
      seen.push(kr.nextKey('fish_audio'))
    }
    expect(seen.slice(0, 10)).toEqual(Array(10).fill('A'))
    expect(seen.slice(10, 20)).toEqual(Array(10).fill('B'))
    expect(seen.slice(20, 22)).toEqual(['A', 'A'])
  })

  it('single-key pool stays on the same key', () => {
    const kr = keyringWith('groq', ['ONLY'])
    for (let i = 0; i < 25; i++) {
      expect(kr.nextKey('groq')).toBe('ONLY')
    }
  })

  it('throws on an empty pool', () => {
    const kr = new Keyring(new MemoryKeyStore())
    expect(() => kr.nextKey('groq')).toThrow('no groq key configured')
  })

  it('matches the documented constant', () => {
    expect(ROTATION_AFTER_REQUESTS).toBe(10)
  })
})

describe('storage, deletion, presence', () => {
  it('adds, counts, removes, and reports presence without leaking secrets', () => {
    const kr = new Keyring(new MemoryKeyStore())
    expect(kr.status()).toEqual({
      fishAudio: { present: false, count: 0 },
      groq: { present: false, count: 0 }
    })
    expect(() => kr.addKey('fish_audio', '   ')).toThrow('refusing empty key')
    const id = kr.addKey('fish_audio', 'SECRET-1')
    kr.addKey('groq', 'SECRET-2')
    expect(kr.status()).toEqual({
      fishAudio: { present: true, count: 1 },
      groq: { present: true, count: 1 }
    })
    expect(JSON.stringify(kr.status())).not.toContain('SECRET')
    expect(kr.removeKey('fish_audio', 'fish_audio:999')).toBe(false)
    expect(kr.removeKey('groq', id)).toBe(false)
    expect(kr.removeKey('fish_audio', id)).toBe(true)
    expect(kr.status().fishAudio).toEqual({ present: false, count: 0 })
    expect(() => kr.nextKey('fish_audio')).toThrow()
  })
})
