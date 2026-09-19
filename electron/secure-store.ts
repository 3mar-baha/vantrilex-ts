import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { KeyStore, VoiceProvider } from '../src/engine/voice/keyring'

function storePath(userDataDir: string): string {
  return join(userDataDir, 'voice-keys.json')
}

function readAll(path: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
  } catch {
    /* fall through to empty map */
  }
  return {}
}

export function createSecureStore(userDataDir: string): KeyStore {
  const path = storePath(userDataDir)
  return {
    listIds(provider: VoiceProvider): string[] {
      if (!existsSync(path)) {
        return []
      }
      const prefix = `${provider}:`
      return Object.keys(readAll(path))
        .filter((id) => id.startsWith(prefix))
        .sort()
    },
    getSecret(id: string): string | null {
      const encrypted = readAll(path)[id]
      if (!encrypted) {
        return null
      }
      try {
        return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
      } catch {
        return null
      }
    },
    setSecret(id: string, secret: string): void {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('OS credential vault unavailable')
      }
      const all = existsSync(path) ? readAll(path) : {}
      all[id] = safeStorage.encryptString(secret).toString('base64')
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(all), { encoding: 'utf8', mode: 0o600 })
    },
    removeSecret(id: string): void {
      const all = readAll(path)
      delete all[id]
      writeFileSync(path, JSON.stringify(all), { encoding: 'utf8', mode: 0o600 })
    }
  }
}
