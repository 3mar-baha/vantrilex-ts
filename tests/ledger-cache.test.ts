import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadLedger, resetLedgerCache } from '../src/engine/immune/ledger'

const dirs: string[] = []
afterEach(() => {
  resetLedgerCache()
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

describe('ledger path-keyed cache', () => {
  it('loads distinct files per normalized path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtx-ledger-'))
    dirs.push(dir)
    const a = join(dir, 'a.json')
    const b = join(dir, 'b.json')
    writeFileSync(a, JSON.stringify([{ id: 'x-1', category: 'c', symptom: 's', cause: 'c', solution: 's', cmd: '' }]), 'utf8')
    writeFileSync(b, JSON.stringify([
      { id: 'y-1', category: 'c', symptom: 's', cause: 'c', solution: 's', cmd: '' },
      { id: 'y-2', category: 'c', symptom: 's', cause: 'c', solution: 's', cmd: '' }
    ]), 'utf8')
    expect(loadLedger(a).length).toBe(1)
    expect(loadLedger(b).length).toBe(2)
    expect(loadLedger(a).length).toBe(1)
  })
})
