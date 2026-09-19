import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CHECKPOINT_TEMPLATE,
  hasCheckpoint,
  primeCheckpoint
} from '../src/engine/foundry/checkpoint'
import { primeCheckpoint as primeViaHistory } from '../src/engine/runner/history'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

describe('canonical checkpoint source of truth', () => {
  it('primes the canonical template once and keeps existing files', () => {
    const ws = mkdtempSync(join(tmpdir(), 'vtx-ckpt-'))
    dirs.push(ws)
    expect(primeCheckpoint(ws)).toBe(true)
    const body = readFileSync(join(ws, 'docs', '10-CHECKPOINT.md'), 'utf8')
    expect(body).toBe(CHECKPOINT_TEMPLATE)
    expect(body).toContain('<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->')
    expect(body).toContain('### Active plan')
    expect(hasCheckpoint(ws)).toBe(true)
    expect(primeCheckpoint(ws)).toBe(false)
  })

  it('history delegates to the same canonical implementation', () => {
    const ws = mkdtempSync(join(tmpdir(), 'vtx-ckpt-h-'))
    dirs.push(ws)
    expect(primeViaHistory(ws)).toBe(true)
    expect(readFileSync(join(ws, 'docs', '10-CHECKPOINT.md'), 'utf8')).toBe(CHECKPOINT_TEMPLATE)
  })
})
