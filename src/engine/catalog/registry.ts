import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export type RegistryKind = 'agents' | 'hooks' | 'mcp' | 'plugins' | 'skills'

export interface RegistryItem {
  name: string
  kind?: RegistryKind
  description: string
  tags: string[]
  source: string
  rawUrl: string
  install: string
  selected: boolean
}

interface McpEntry {
  name: string
  command: string
  args: string[] | null
  tags: string[]
  description: string
  sourceURL: string
  rawURL: string
}

interface PluginEntry {
  name: string
  marketplace: string
  description: string
  installRef: string
  rawURL: string
}

interface SkillEntry {
  name: string
  source: string
  description: string
  tags: string[]
  rawURL: string
}

interface HookEntry {
  name: string
  event: string
  description: string
  rawURL: string
}

interface AgentEntry {
  name: string
  role: string
  description: string
  tags: string[]
  rawURL: string
}

const DEFAULT_SELECTED: ReadonlySet<string> = new Set([
  'architect',
  'find-skills',
  'skill-creator',
  'ponytail',
  'ask-matt',
  'commit-commands',
  'code-review',
  'typescript-lsp',
  'pre-compact',
  'session-start',
  'block-dev-servers-outside-tmux-ensures-you-can-access-logs',
  'sequential-thinking',
  'filesystem',
  'fetch',
  'memory',
  'openrouter'
])

export function defaultDataDir(): string {
  return resolve(process.cwd(), 'data')
}

function loadJsonFile<T>(path: string, errors: string[]): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch (err) {
    errors.push(`${path}: ${(err as Error).message}`)
    return null
  }
}

export interface RegistrySet {
  agents: RegistryItem[]
  hooks: RegistryItem[]
  mcp: RegistryItem[]
  plugins: RegistryItem[]
  skills: RegistryItem[]
  errors: string[]
}

export function loadRegistries(dataDir: string = defaultDataDir()): RegistrySet {
  const errors: string[] = []
  const set: RegistrySet = { agents: [], hooks: [], mcp: [], plugins: [], skills: [], errors }

  const mcps = loadJsonFile<McpEntry[]>(join(dataDir, 'mcp_registry.json'), errors) ?? []
  for (const e of mcps) {
    set.mcp.push({
      name: e.name,
      kind: 'mcp',
      description: e.description,
      tags: e.tags ?? [],
      source: e.sourceURL,
      rawUrl: e.rawURL,
      install: `${e.command ?? ''} ${(e.args ?? []).join(' ')}`.trim(),
      selected: DEFAULT_SELECTED.has(e.name)
    })
  }

  const plugins = loadJsonFile<PluginEntry[]>(join(dataDir, 'plugins_registry.json'), errors) ?? []
  for (const e of plugins) {
    set.plugins.push({
      name: e.name,
      kind: 'plugins',
      description: e.description,
      tags: [e.marketplace],
      source: e.marketplace,
      rawUrl: e.rawURL,
      install: e.installRef,
      selected: DEFAULT_SELECTED.has(e.name)
    })
  }

  const skills = loadJsonFile<SkillEntry[]>(join(dataDir, 'skills_registry.json'), errors) ?? []
  for (const e of skills) {
    set.skills.push({
      name: e.name,
      kind: 'skills',
      description: e.description,
      tags: e.tags ?? [],
      source: e.source,
      rawUrl: e.rawURL,
      install: `${e.source}@${e.name}`,
      selected: DEFAULT_SELECTED.has(e.name)
    })
  }

  const hooks = loadJsonFile<HookEntry[]>(join(dataDir, 'hooks_registry.json'), errors) ?? []
  for (const e of hooks) {
    set.hooks.push({
      name: e.name,
      kind: 'hooks',
      description: e.description,
      tags: [e.event],
      source: e.event,
      rawUrl: e.rawURL,
      install: `${e.event}:${e.name}`,
      selected: DEFAULT_SELECTED.has(e.name)
    })
  }

  const agents = loadJsonFile<AgentEntry[]>(join(dataDir, 'agents_registry.json'), errors) ?? []
  for (const e of agents) {
    set.agents.push({
      name: e.name,
      kind: 'agents',
      description: e.description,
      tags: e.tags ?? [],
      source: e.role,
      rawUrl: e.rawURL,
      install: `${e.role}/${e.name}`,
      selected: DEFAULT_SELECTED.has(e.name)
    })
  }

  return set
}

export function searchRegistry(items: RegistryItem[], query: string): RegistryItem[] {
  const q = query.toLowerCase().trim()
  if (q === '') {
    return items
  }
  const tokens = q.split(/\s+/)
  return items.filter((it) => {
    const hay = `${it.name} ${it.description} ${it.tags.join(' ')} ${it.source}`.toLowerCase()
    return tokens.every((t) => hay.includes(t))
  })
}

export function selectedCount(items: RegistryItem[]): number {
  return items.filter((it) => it.selected).length
}

export function totalCount(set: RegistrySet): number {
  return set.agents.length + set.hooks.length + set.mcp.length + set.plugins.length + set.skills.length
}
