import { describe, expect, it, vi } from 'vitest'
import { createApi, IPC_CHANNELS, type IpcChannel } from '../electron/channels'

describe('IPC channel contract (docs/25-ELECTRON-IPC.md)', () => {
  it('exposes exactly the seven documented channels', () => {
    expect([...IPC_CHANNELS].sort()).toEqual(
      [
        'foundry:detect',
        'foundry:provision',
        'runner:launch',
        'voice:speak',
        'voice:transcribe',
        'mobile:pair',
        'mobile:approve'
      ].sort()
    )
  })

  it('routes every api method to its whitelisted channel', async () => {
    const seen: unknown[][] = []
    const invoke = vi.fn(async (...args: unknown[]): Promise<unknown> => {
      seen.push(args)
      return {}
    })
    const api = createApi(invoke)
    await api.detect('ws')
    await api.provision('ws', 1)
    await api.launch('opencode', 'ws')
    await api.speak('hi')
    await api.transcribe('a1')
    await api.pair()
    await api.approve('s1', true)
    const used: IpcChannel[] = seen.map((c) => c[0] as IpcChannel)
    expect([...used].sort()).toEqual([...IPC_CHANNELS].sort())
  })

  it('passes arguments through in order', async () => {
    const invoke = vi.fn(async () => ({ ok: true }))
    const api = createApi(invoke)
    await api.provision('C:/proj', 3)
    expect(invoke).toHaveBeenCalledWith('foundry:provision', 'C:/proj', 3)
    await api.approve('step-9', false)
    expect(invoke).toHaveBeenCalledWith('mobile:approve', 'step-9', false)
  })
})
