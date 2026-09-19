import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { RegistryItem } from '../src/engine/catalog/registry'
import { accelerateMCPCommand, injectMCP, remoteMCPURL, sanitize } from '../src/engine/scaffold/mcp'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'vtx-mcp-'))
  dirs.push(d)
  return d
}

function item(name: string, install: string): RegistryItem {
  return { name, description: `${name} desc`, tags: [], source: 'src', rawUrl: '', install, selected: false }
}

describe('mcp sanitize and remote classification', () => {
  it('sanitizes names and classifies remotes', () => {
    expect(sanitize('My Org/Cool Tool')).toBe('my-org-cool-tool')
    expect(sanitize('')).toBe('asset')
    expect(remoteMCPURL('npx foo')).toBe('')
    expect(remoteMCPURL('https://mcp.openrouter.ai/mcp ')).toBe('https://mcp.openrouter.ai/mcp')
  })

  it('accelerates npx to bunx only with bun present', () => {
    expect(accelerateMCPCommand('npx', true)).toBe('bunx')
    expect(accelerateMCPCommand('npx', false)).toBe('npx')
    expect(accelerateMCPCommand('docker', true)).toBe('docker')
  })
})

describe('mcp json injection', () => {
  it('writes local and remote entries to both configs', async () => {
    const ws = tempDir()
    const mcps = [
      item('fetch', 'npx -y @modelcontextprotocol/server-fetch'),
      item('openrouter', 'https://mcp.openrouter.ai/mcp')
    ]
    const { created } = await injectMCP(ws, mcps, false)
    expect(created).toEqual(['opencode.json', '.mcp.json'])
    const oj = JSON.parse(readFileSync(join(ws, 'opencode.json'), 'utf8')) as {
      mcp: Record<string, { command?: string; url?: string }>
    }
    expect(oj.mcp['fetch']).toMatchObject({ command: 'npx', type: 'local', enabled: true })
    expect(oj.mcp['openrouter']).toMatchObject({ type: 'remote', url: 'https://mcp.openrouter.ai/mcp' })
    const mj = JSON.parse(readFileSync(join(ws, '.mcp.json'), 'utf8')) as {
      mcpServers: Record<string, { command?: string; url?: string }>
    }
    expect(mj.mcpServers['fetch'].command).toBe('npx')
    expect(mj.mcpServers['openrouter'].url).toBe('https://mcp.openrouter.ai/mcp')
  })

  it('uses bunx when bun is available', async () => {
    const ws = tempDir()
    await injectMCP(ws, [item('fetch', 'npx -y @modelcontextprotocol/server-fetch')], true)
    const oj = JSON.parse(readFileSync(join(ws, 'opencode.json'), 'utf8')) as {
      mcp: Record<string, { command?: string; args?: string[] }>
    }
    expect(oj.mcp['fetch'].command).toBe('bunx')
    expect(oj.mcp['fetch'].args).toEqual(['-y', '@modelcontextprotocol/server-fetch'])
  })

  it('never overwrites existing entries', async () => {
    const ws = tempDir()
    await injectMCP(ws, [item('fetch', 'npx -y @modelcontextprotocol/server-fetch')], false)
    await injectMCP(ws, [item('fetch', 'npx -y evil-replacement')], true)
    const oj = JSON.parse(readFileSync(join(ws, 'opencode.json'), 'utf8')) as {
      mcp: Record<string, { command?: string }>
    }
    expect(oj.mcp['fetch'].command).toBe('npx')
  })
})
