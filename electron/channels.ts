export type IpcChannel =
  | 'foundry:detect'
  | 'foundry:provision'
  | 'runner:launch'
  | 'voice:tts:speak'
  | 'voice:stt:transcribe'
  | 'voice:keyring:status'
  | 'voice:keyring:set'
  | 'mobile:pair'
  | 'mobile:approve'
  | 'doctor:probes'
  | 'runner:sessions:list'
  | 'runner:sessions:delete'
  | 'voice:tts:speak'
  | 'voice:stt:transcribe'
  | 'voice:keyring:status'
  | 'voice:keyring:set'

export const IPC_CHANNELS: IpcChannel[] = [
  'foundry:detect',
  'foundry:provision',
  'runner:launch',
  'voice:tts:speak',
  'voice:stt:transcribe',
  'voice:keyring:status',
  'voice:keyring:set',
  'mobile:pair',
  'mobile:approve',
  'doctor:probes',
  'runner:sessions:list',
  'runner:sessions:delete'
]

export interface DetectResult {
  projectCase: number
  language: string
  stack: string
  action: string
}

export interface ProvisionResult {
  created: string[]
  errors: string[]
}

export interface LaunchResult {
  pid: number | null
}

export interface SessionView {
  id: string
  workspace: string
  runner: string
  timestamp: string
  status: string
}

export interface TtsResult {
  audioBase64: string
  format: 'mp3'
  cached: boolean
}

export interface KeyringStatusView {
  fishAudio: { present: boolean; count: number }
  groq: { present: boolean; count: number }
}

export interface PairResult {
  qrPayload: string
}

export interface ProbeStatus {
  key: string
  found: boolean
  version: string
}

export type InvokeFn = (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>

export interface VantrilexApi {
  detect: (workspace: string) => Promise<DetectResult>
  provision: (workspace: string, projectCase: number) => Promise<ProvisionResult>
  launch: (runner: string, workspace: string, resume?: string) => Promise<LaunchResult>
  ttsSpeak: (text: string) => Promise<TtsResult>
  sttTranscribe: (audioBase64: string, filename?: string) => Promise<{ text: string }>
  keyringStatus: () => Promise<KeyringStatusView>
  keyringSet: (provider: 'fish_audio' | 'groq', secret: string) => Promise<KeyringStatusView>
  pair: () => Promise<PairResult>
  approve: (id: string, decision: boolean) => Promise<{ ok: boolean }>
  probes: () => Promise<ProbeStatus[]>
  sessionsList: () => Promise<SessionView[]>
  sessionsDelete: (id: string) => Promise<{ ok: boolean }>
}

export function createApi(invoke: InvokeFn): VantrilexApi {
  return {
    detect: (workspace) => invoke('foundry:detect', workspace) as Promise<DetectResult>,
    provision: (workspace, projectCase) =>
      invoke('foundry:provision', workspace, projectCase) as Promise<ProvisionResult>,
    launch: (runner, workspace, resume) =>
      invoke('runner:launch', runner, workspace, resume) as Promise<LaunchResult>,
  ttsSpeak: (text) => invoke('voice:tts:speak', text) as Promise<TtsResult>,
  sttTranscribe: (audioBase64, filename) =>
    invoke('voice:stt:transcribe', audioBase64, filename) as Promise<{ text: string }>,
  keyringStatus: () => invoke('voice:keyring:status') as Promise<KeyringStatusView>,
  keyringSet: (provider, secret) =>
    invoke('voice:keyring:set', provider, secret) as Promise<KeyringStatusView>,
  pair: () => invoke('mobile:pair') as Promise<PairResult>,
  approve: (id, decision) => invoke('mobile:approve', id, decision) as Promise<{ ok: boolean }>,
  probes: () => invoke('doctor:probes') as Promise<ProbeStatus[]>,
  sessionsList: () => invoke('runner:sessions:list') as Promise<SessionView[]>,
  sessionsDelete: (id) => invoke('runner:sessions:delete', id) as Promise<{ ok: boolean }>
  }
}
