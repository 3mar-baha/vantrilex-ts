import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Keyring, MemoryKeyStore } from '../src/engine/voice/keyring'

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (s: string) => Buffer.from(`enc:${s}`),
    decryptString: (b: Buffer) => {
      const text = b.toString('utf8')
      if (!text.startsWith('enc:')) {
        throw new Error('decrypt failed: bad payload')
      }
      return text.slice(4)
    }
  }
}))

import { createSecureStore } from '../electron/secure-store'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

describe('persistent key counters', () => {
  it('continues from the highest stored suffix after restart', () => {
    const store = new MemoryKeyStore()
    store.setSecret('fish_audio:1', 'A')
    store.setSecret('fish_audio:7', 'B')
    const kr = new Keyring(store)
    expect(kr.addKey('fish_audio', 'C')).toBe('fish_audio:8')
    expect(kr.keyCount('fish_audio')).toBe(3)
  })
})

describe('secure store mutex and error distinction', () => {
  it('serializes rapid writes without losing keys', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtx-vault-'))
    dirs.push(dir)
    const store = createSecureStore(dir)
    for (let i = 0; i < 10; i++) {
      store.setSecret(`groq:${i + 1}`, `K${i + 1}`)
    }
    expect(store.listIds('groq').length).toBe(10)
    expect(store.getSecret('groq:5')).toBe('K5')
  })

  it('distinguishes missing store from locked vault in logs', () => {
    const logs: string[] = []
    const dir = mkdtempSync(join(tmpdir(), 'vtx-vault-m-'))
    dirs.push(dir)
    const fresh = createSecureStore(dir, (m) => logs.push(m))
    expect(fresh.getSecret('groq:1')).toBeNull()
    expect(logs.some((m) => m.includes('STORE_MISSING'))).toBe(true)
    fresh.setSecret('groq:1', 'K1')
    expect(fresh.getSecret('groq:1')).toBe('K1')
    writeFileSync(join(dir, 'voice-keys.json'), JSON.stringify({ 'groq:9': Buffer.from('not-enc').toString('base64') }), 'utf8')
    expect(fresh.getSecret('groq:9')).toBeNull()
    expect(logs.some((m) => m.includes('VAULT_LOCKED'))).toBe(true)
  })
})
