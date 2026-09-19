import { describe, expect, it, vi } from 'vitest'
import { createApi, IPC_CHANNELS, type IpcChannel } from '../electron/channels'

describe('IPC channel contract (docs/25-ELECTRON-IPC.md)', () => {
  it('exposes exactly the seventeen documented channels', () => {
    expect([...IPC_CHANNELS].sort()).toEqual(
      [
        'foundry:detect',
        'foundry:provision',
        'runner:launch',
        'runner:sessions:list',
        'runner:sessions:delete',
        'voice:tts:speak',
        'voice:stt:transcribe',
        'voice:keyring:status',
        'voice:keyring:set',
        'mobile:status',
        'mobile:qr:generate',
        'mobile:approval:respond',
        'mobile:scan',
        'mobile:connect',
        'mobile:approval:request',
        'mobile:approval:forward',
        'doctor:probes'
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
    await api.mobileStatus()
    await api.mobileQrGenerate()
    await api.mobileApprovalRespond('a1', true)
    await api.mobileScan()
    await api.mobileConnect()
    await api.mobileApprovalRequest('s1', 'bash', 'npm test')
    await api.mobileApprovalForward('a1', 'tok')
    await api.probes()
    await api.sessionsList()
    await api.sessionsDelete('s1')
    await api.ttsSpeak('hi')
    await api.sttTranscribe('YmFzZTY0', 'sample.mp3')
    await api.keyringStatus()
    await api.keyringSet('fish_audio', 'secret')
    const used: IpcChannel[] = seen.map((c) => c[0] as IpcChannel)
    expect([...used].sort()).toEqual([...IPC_CHANNELS].sort())
  })

  it('passes arguments through in order', async () => {
    const invoke = vi.fn(async () => ({ ok: true }))
    const api = createApi(invoke)
    await api.provision('C:/proj', 3)
    expect(invoke).toHaveBeenCalledWith('foundry:provision', 'C:/proj', 3)
    await api.mobileApprovalRespond('step-9', false)
    expect(invoke).toHaveBeenCalledWith('mobile:approval:respond', 'step-9', false)
  })
})
