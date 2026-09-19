import { describe, expect, it } from 'vitest'
import { loadRegistries, searchRegistry, selectedCount, totalCount } from '../src/engine/catalog/registry'

const set = loadRegistries()

describe('registry capacities', () => {
  it('meets category floors', () => {
    expect(set.errors).toEqual([])
    expect(set.mcp.length).toBeGreaterThanOrEqual(850)
    expect(set.plugins.length).toBeGreaterThanOrEqual(12)
    expect(set.skills.length).toBeGreaterThanOrEqual(1400)
    expect(set.hooks.length).toBeGreaterThanOrEqual(18)
    expect(set.agents.length).toBeGreaterThanOrEqual(250)
  })

  it('reports exact verified counts', () => {
    expect(set.mcp.length).toBe(902)
    expect(set.plugins.length).toBe(12)
    expect(set.skills.length).toBe(1485)
    expect(set.hooks.length).toBe(18)
    expect(set.agents.length).toBe(282)
    expect(totalCount(set)).toBe(2699)
  })
})

describe('registry defaults', () => {
  it('preselects the 16 default names', () => {
    const all = [...set.agents, ...set.skills, ...set.plugins, ...set.hooks, ...set.mcp]
    for (const name of [
      'architect', 'find-skills', 'skill-creator', 'ponytail', 'ask-matt',
      'commit-commands', 'code-review', 'typescript-lsp', 'pre-compact',
      'session-start', 'block-dev-servers-outside-tmux-ensures-you-can-access-logs',
      'sequential-thinking', 'filesystem', 'fetch', 'memory', 'openrouter'
    ]) {
      const hit = all.find((it) => it.name === name && it.selected)
      expect(hit, `default ${name} not preselected`).toBeTruthy()
    }
    // code-review exists in both skills and plugins, so both select it.
    expect(selectedCount(all)).toBe(17)
  })
})

describe('registry search', () => {
  it('token-AND matches and misses', () => {
    expect(searchRegistry(set.mcp, 'filesystem').length).toBeGreaterThan(0)
    expect(searchRegistry(set.agents, 'zzz-no-such-asset')).toEqual([])
    expect(searchRegistry(set.mcp, '')).toBe(set.mcp)
  })

  it('records load errors instead of failing silently', () => {
    const bad = loadRegistries('/nonexistent-dir-xyz')
    expect(bad.errors.length).toBeGreaterThan(0)
    expect(bad.mcp).toEqual([])
  })
})
