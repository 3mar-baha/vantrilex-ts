import { describe, expect, it } from 'vitest'
import {
  clampBuffer,
  clampText,
  MAX_AUDIO_BYTES,
  MAX_TEXT_CHARS,
  validateId,
  validateWorkspace,
  workspaceBase
} from '../electron/validate'

describe('main-side input sanitization', () => {
  it('accepts and normalizes workspace paths', () => {
    expect(validateWorkspace('C:/proj')).toBe('C:\\proj')
    expect(() => validateWorkspace('')).toThrow('non-empty path')
    expect(() => validateWorkspace('   ')).toThrow('non-empty path')
    expect(() => validateWorkspace(null)).toThrow('non-empty path')
    expect(() => validateWorkspace('.')).toThrow('non-empty path')
  })

  it('rejects blank ids', () => {
    expect(validateId('  abc  ')).toBe('abc')
    expect(() => validateId('', 'session id')).toThrow('session id must be a non-empty string')
    expect(() => validateId(42)).toThrow()
  })

  it('clamps text and audio buffers', () => {
    expect(clampText('  hi  ')).toBe('hi')
    expect(clampText('x'.repeat(MAX_TEXT_CHARS + 5)).length).toBe(MAX_TEXT_CHARS)
    expect(() => clampText('')).toThrow('non-empty')
    expect(clampBuffer(new Uint8Array([1])).length).toBe(1)
    expect(() => clampBuffer(new Uint8Array([]))).toThrow('non-empty')
    expect(() => clampBuffer(new Uint8Array(MAX_AUDIO_BYTES + 1))).toThrow('exceeds')
  })

  it('derives project base names', () => {
    expect(workspaceBase('C:/projects/demo')).toBe('demo')
    expect(workspaceBase('C:/projects/demo/')).toBe('demo')
  })
})
