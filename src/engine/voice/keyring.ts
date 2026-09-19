export type VoiceProvider = 'fish_audio' | 'groq'

export const ROTATION_AFTER_REQUESTS = 10

export interface KeyStore {
  listIds(provider: VoiceProvider): string[]
  getSecret(id: string): string | null
  setSecret(id: string, secret: string): void
  removeSecret(id: string): void
}

export class MemoryKeyStore implements KeyStore {
  private secrets = new Map<string, string>()

  listIds(provider: VoiceProvider): string[] {
    const prefix = `${provider}:`
    return [...this.secrets.keys()]
      .filter((id) => id.startsWith(prefix))
      .sort()
  }

  getSecret(id: string): string | null {
    return this.secrets.get(id) ?? null
  }

  setSecret(id: string, secret: string): void {
    this.secrets.set(id, secret)
  }

  removeSecret(id: string): void {
    this.secrets.delete(id)
  }
}

export interface ProviderStatus {
  present: boolean
  count: number
}

export interface KeyringStatus {
  fishAudio: ProviderStatus
  groq: ProviderStatus
}

interface Cursor {
  index: number
  uses: number
}

export class Keyring {
  private cursors = new Map<VoiceProvider, Cursor>()
  private counters = new Map<VoiceProvider, number>()

  constructor(private readonly store: KeyStore) {}

  addKey(provider: VoiceProvider, secret: string): string {
    const trimmed = secret.trim()
    if (trimmed === '') {
      throw new Error(`refusing empty key for ${provider}`)
    }
    const n = (this.counters.get(provider) ?? 0) + 1
    this.counters.set(provider, n)
    const id = `${provider}:${n}`
    this.store.setSecret(id, trimmed)
    return id
  }

  removeKey(provider: VoiceProvider, id: string): boolean {
    if (!id.startsWith(`${provider}:`)) {
      return false
    }
    const ids = this.store.listIds(provider)
    if (!ids.includes(id)) {
      return false
    }
    this.store.removeSecret(id)
    const cursor = this.cursors.get(provider)
    if (cursor) {
      cursor.index = 0
      cursor.uses = 0
    }
    return true
  }

  keyCount(provider: VoiceProvider): number {
    return this.store.listIds(provider).length
  }

  status(): KeyringStatus {
    const fish = this.keyCount('fish_audio')
    const groq = this.keyCount('groq')
    return {
      fishAudio: { present: fish > 0, count: fish },
      groq: { present: groq > 0, count: groq }
    }
  }

  nextKey(provider: VoiceProvider): string {
    const ids = this.store.listIds(provider)
    if (ids.length === 0) {
      throw new Error(`no ${provider} key configured`)
    }
    const cursor = this.cursors.get(provider) ?? { index: 0, uses: 0 }
    cursor.index = cursor.index % ids.length
    const id = ids[cursor.index]
    const secret = this.store.getSecret(id)
    if (secret === null || secret === '') {
      throw new Error(`key ${id} unreadable`)
    }
    cursor.uses += 1
    if (cursor.uses >= ROTATION_AFTER_REQUESTS) {
      cursor.index = (cursor.index + 1) % ids.length
      cursor.uses = 0
    }
    this.cursors.set(provider, cursor)
    return secret
  }
}
