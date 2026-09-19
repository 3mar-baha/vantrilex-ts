import { normalize, resolve } from 'node:path'

export const MAX_TEXT_CHARS = 20000
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024

export function validateWorkspace(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('workspace must be a non-empty path')
  }
  const normalized = normalize(raw.trim())
  if (normalized === '' || normalized === '.') {
    throw new Error('workspace must be a non-empty path')
  }
  return normalized
}

export function validateId(raw: unknown, what = 'id'): string {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(`${what} must be a non-empty string`)
  }
  return raw.trim()
}

export function clampText(raw: unknown, max: number = MAX_TEXT_CHARS): string {
  const text = String(raw ?? '').trim()
  if (text === '') {
    throw new Error('text must be non-empty')
  }
  return text.length > max ? text.slice(0, max) : text
}

export function clampBuffer(bytes: Uint8Array, max: number = MAX_AUDIO_BYTES): Uint8Array {
  if (bytes.length === 0) {
    throw new Error('audio must be non-empty')
  }
  if (bytes.length > max) {
    throw new Error(`audio exceeds ${max} bytes`)
  }
  return bytes
}

export function workspaceBase(workspace: string): string {
  return resolve(workspace).split(/[/\\]/).filter(Boolean).pop() ?? 'project'
}
