import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { KeyStore, VoiceProvider } from '../src/engine/voice/keyring'

export type StoreLogger = (message: string) => void

export const VAULT_LOCKED = 'VAULT_LOCKED'
export const STORE_MISSING = 'STORE_MISSING'

function storePath(userDataDir: string): string {
  return join(userDataDir, 'voice-keys.json')
}

function readAll(path: string, log: StoreLogger): { entries: Record<string, string>; missing: boolean } {
  if (!existsSync(path)) {
    log(`${STORE_MISSING}: no vault file at ${path}; treating as empty`)
    return { entries: {}, missing: true }
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { entries: parsed as Record<string, string>, missing: false }
    }
  } catch (err) {
    log(`${VAULT_LOCKED}: vault file unreadable at ${path}: ${(err as Error).message}`)
  }
  return { entries: {}, missing: false }
}

function writeAll(path: string, entries: Record<string, string>): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(entries), { encoding: 'utf8', mode: 0o600 })
  renameSync(tmp, path)
}

export function createSecureStore(userDataDir: string, log: StoreLogger = () => undefined): KeyStore {
  // Concurrency note: all methods below are fully synchronous (no awaits),
  // so Node's single-threaded event loop cannot interleave two mutations —
  // each read-modify-write runs to completion atomically. Cross-process
  // safety comes from atomic tmp+rename writes (never torn files).
  const path = storePath(userDataDir)
  return {
    listIds(provider: VoiceProvider): string[] {
      const prefix = `${provider}:`
      return Object.keys(readAll(path, log).entries)
        .filter((id) => id.startsWith(prefix))
        .sort()
    },
    getSecret(id: string): string | null {
      const { entries, missing } = readAll(path, log)
      const encrypted = entries[id]
      if (!encrypted) {
        if (!missing) {
          log(`${STORE_MISSING}: no entry ${id} in vault file`)
        }
        return null
      }
      try {
        return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
      } catch (err) {
        log(`${VAULT_LOCKED}: entry ${id} undecryptable: ${(err as Error).message}`)
        return null
      }
    },
    setSecret(id: string, secret: string): void {
      if (!safeStorage.isEncryptionAvailable()) {
        log(`${VAULT_LOCKED}: encryption unavailable, refusing plaintext write for ${id}`)
        throw new Error('OS credential vault unavailable')
      }
      const { entries } = readAll(path, log)
      entries[id] = safeStorage.encryptString(secret).toString('base64')
      writeAll(path, entries)
    },
    removeSecret(id: string): void {
      const { entries } = readAll(path, log)
      delete entries[id]
      writeAll(path, entries)
    }
  }
}
