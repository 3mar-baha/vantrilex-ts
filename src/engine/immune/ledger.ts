import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface ImmunologyEntry {
  id: string
  category: string
  symptom: string
  cause: string
  solution: string
  cmd: string
}

let cache: ImmunologyEntry[] | null = null
let parseError: string | null = null

export function defaultLedgerPath(): string {
  return resolve(process.cwd(), 'data', 'immunology_ledger.json')
}

export function loadLedger(ledgerPath: string = defaultLedgerPath()): ImmunologyEntry[] {
  if (cache) {
    return cache
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(ledgerPath, 'utf8'))
    if (!Array.isArray(parsed)) {
      throw new Error('ledger root is not an array')
    }
    cache = parsed as ImmunologyEntry[]
  } catch (err) {
    parseError = `${ledgerPath}: ${(err as Error).message}`
    cache = []
  }
  return cache
}

export function ledgerError(): string | null {
  return parseError
}

export function resetLedgerCache(): void {
  cache = null
  parseError = null
}

export function ledgerCategories(entries: ImmunologyEntry[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of entries) {
    if (!seen.has(e.category)) {
      seen.add(e.category)
      out.push(e.category)
    }
  }
  return out
}

export function immunologySummary(entries: ImmunologyEntry[]): string {
  if (entries.length === 0) {
    return ''
  }
  const lines: string[] = [
    '',
    `## Immune Ledger (${entries.length} entries)`,
    '',
    'Battle-tested fixes for repetitive failure modes. Consult before debugging.',
    ''
  ]
  let last = ''
  for (const e of entries) {
    if (e.category !== last) {
      lines.push(`### ${e.category}`, '')
      last = e.category
    }
    const cmd = e.cmd.trim() === '' ? '' : ` (\`${e.cmd}\`)`
    lines.push(`- **${e.id}**: ${e.symptom} → ${e.solution}${cmd}`)
  }
  return lines.join('\n') + '\n'
}
