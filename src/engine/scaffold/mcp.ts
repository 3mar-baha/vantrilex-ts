import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { RegistryItem } from '../catalog/registry'
import { lookPath } from '../doctor/deps'

export function sanitize(name: string): string {
  const lowered = name.toLowerCase().trim()
  let out = ''
  for (const ch of lowered) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch === '-' || ch === '_') {
      out += ch
    } else if (ch === ' ' || ch === '/' || ch === '.') {
      out += '-'
    }
  }
  out = out.replace(/^-+|-+$/g, '')
  while (out.includes('--')) {
    out = out.split('--').join('-')
  }
  return out === '' ? 'asset' : out
}

export function remoteMCPURL(install: string): string {
  const s = install.trim()
  if (s.startsWith('https://') || s.startsWith('http://')) {
    return s.split(/\s+/, 1)[0]
  }
  return ''
}

export async function bunAvailable(look: (binary: string) => Promise<string | null> = (b) => lookPath(b)): Promise<boolean> {
  return (await look('bun')) !== null
}

export function accelerateMCPCommand(cmd: string, hasBun: boolean): string {
  if (cmd !== 'npx') {
    return cmd
  }
  return hasBun ? 'bunx' : cmd
}

type JsonMap = Record<string, unknown>

function readJsonMap(path: string): JsonMap {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as JsonMap
    }
  } catch {
    /* fall through to empty map */
  }
  return {}
}

function writeJsonFile(path: string, value: JsonMap): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export interface McpResult {
  created: string[]
}

export async function injectMCP(
  workspace: string,
  mcps: RegistryItem[],
  hasBun?: boolean
): Promise<McpResult> {
  const created: string[] = []
  const bun = hasBun ?? (await bunAvailable())

  const ojPath = join(workspace, 'opencode.json')
  const oj = readJsonMap(ojPath)
  const mcpMap = (oj['mcp'] as JsonMap | undefined) ?? {}
  for (const m of mcps) {
    const key = sanitize(m.name)
    if (key in mcpMap) {
      continue
    }
    const url = remoteMCPURL(m.install)
    if (url !== '') {
      mcpMap[key] = { type: 'remote', url, enabled: true }
      continue
    }
    const parts = m.install.trim().split(/\s+/).filter(Boolean)
    const cmd = accelerateMCPCommand(parts.length > 0 ? parts[0] : 'npx', bun)
    mcpMap[key] = { command: cmd, args: parts.slice(1), type: 'local', enabled: true }
  }
  oj['mcp'] = mcpMap
  writeJsonFile(ojPath, oj)
  created.push('opencode.json')

  const mjPath = join(workspace, '.mcp.json')
  const mj = readJsonMap(mjPath)
  const servers = (mj['mcpServers'] as JsonMap | undefined) ?? {}
  for (const m of mcps) {
    const key = sanitize(m.name)
    if (key in servers) {
      continue
    }
    const url = remoteMCPURL(m.install)
    if (url !== '') {
      servers[key] = { url }
      continue
    }
    const parts = m.install.trim().split(/\s+/).filter(Boolean)
    const cmd = accelerateMCPCommand(parts.length > 0 ? parts[0] : 'npx', bun)
    servers[key] = { command: cmd, args: parts.slice(1) }
  }
  mj['mcpServers'] = servers
  writeJsonFile(mjPath, mj)
  created.push('.mcp.json')

  return { created }
}
