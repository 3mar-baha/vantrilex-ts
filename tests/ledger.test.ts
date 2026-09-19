import { describe, expect, it } from 'vitest'
import {
  immunologySummary,
  ledgerCategories,
  ledgerError,
  loadLedger
} from '../src/engine/immune/ledger'

describe('catalog and immunology ledger parsing', () => {
  it('loads 60 curated entries across core categories', () => {
    const entries = loadLedger()
    expect(ledgerError()).toBeNull()
    expect(entries.length).toBe(60)
    const ids = new Set(entries.map((e) => e.id))
    expect(ids.size).toBe(entries.length)
    for (const e of entries) {
      expect(e.id && e.category && e.symptom && e.cause && e.solution).toBeTruthy()
      expect(e.solution).not.toContain('TODO')
    }
    for (const want of ['windows-paths', 'ports', 'encoding', 'venv', 'go-modules']) {
      expect(ledgerCategories(entries)).toContain(want)
    }
  })

  it('renders an injectable summary', () => {
    const summary = immunologySummary(loadLedger())
    expect(summary).toContain('## Immune Ledger (60 entries)')
    expect(summary).toContain('EADDRINUSE')
  })
})
