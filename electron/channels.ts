export type IpcChannel =
  | 'foundry:detect'
  | 'foundry:provision'
  | 'runner:launch'
  | 'voice:tts:speak'
  | 'voice:stt:transcribe'
  | 'voice:keyring:status'
  | 'voice:keyring:set'
  | 'mobile:status'
  | 'mobile:qr:generate'
  | 'mobile:approval:respond'
  | 'mobile:scan'
  | 'mobile:connect'
  | 'mobile:approval:request'
  | 'mobile:approval:forward'
  | 'doctor:probes'
  | 'runner:sessions:list'
  | 'runner:sessions:delete'

export const IPC_CHANNELS: IpcChannel[] = [
  'foundry:detect',
  'foundry:provision',
  'runner:launch',
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

export interface MobileStatus {
  state: string
  relayUrl: string
  sessionId: string | null
  pairedDevices: number
  pendingApprovals: number
}

export interface QrResult {
  svg: string
  dataUri: string
  expiresAt: number
}

export interface FoundryProgress {
  done: number
  total: number
  file: string
}

export type FoundryProgressCallback = (progress: FoundryProgress) => void

export interface ProbeStatus {
  key: string
  found: boolean
  version: string
}

export type InvokeFn = (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>

export type SubscribeFn = (channel: string, cb: (payload: FoundryProgress) => void) => () => void

export interface VantrilexApi {
  detect: (workspace: string) => Promise<DetectResult>
  provision: (workspace: string, projectCase: number) => Promise<ProvisionResult>
  launch: (runner: string, workspace: string, resume?: string) => Promise<LaunchResult>
    ttsSpeak: (text: string) => Promise<TtsResult>
    sttTranscribe: (audioBase64: string, filename?: string) => Promise<{ text: string }>
    keyringStatus: () => Promise<KeyringStatusView>
  keyringSet: (provider: 'fish_audio' | 'groq', secret: string) => Promise<KeyringStatusView>
  mobileStatus: () => Promise<MobileStatus>
  mobileQrGenerate: () => Promise<QrResult>
  mobileApprovalRespond: (id: string, decision: boolean) => Promise<{ ok: boolean }>
  mobileScan: () => Promise<{ state: string }>
  mobileConnect: () => Promise<{ state: string }>
  mobileApprovalRequest: (sessionId: string, kind: string, summary: string) => Promise<{ id: string }>
  mobileApprovalForward: (id: string, token: string) => Promise<{ ok: boolean }>
  onFoundryProgress: (cb: FoundryProgressCallback) => () => void
  probes: () => Promise<ProbeStatus[]>
    sessionsList: () => Promise<SessionView[]>
    sessionsDelete: (id: string) => Promise<{ ok: boolean }>
}

export function createApi(invoke: InvokeFn, subscribe?: SubscribeFn): VantrilexApi {
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
    mobileStatus: () => invoke('mobile:status') as Promise<MobileStatus>,
    mobileQrGenerate: () => invoke('mobile:qr:generate') as Promise<QrResult>,
    mobileApprovalRespond: (id, decision) =>
      invoke('mobile:approval:respond', id, decision) as Promise<{ ok: boolean }>,
    mobileScan: () => invoke('mobile:scan') as Promise<{ state: string }>,
    mobileConnect: () => invoke('mobile:connect') as Promise<{ state: string }>,
    mobileApprovalRequest: (sessionId, kind, summary) =>
      invoke('mobile:approval:request', sessionId, kind, summary) as Promise<{ id: string }>,
    mobileApprovalForward: (id, token) =>
      invoke('mobile:approval:forward', id, token) as Promise<{ ok: boolean }>,
    onFoundryProgress: (cb) => (subscribe ? subscribe('foundry:progress', cb) : () => undefined),
    probes: () => invoke('doctor:probes') as Promise<ProbeStatus[]>,
    sessionsList: () => invoke('runner:sessions:list') as Promise<SessionView[]>,
    sessionsDelete: (id) => invoke('runner:sessions:delete', id) as Promise<{ ok: boolean }>
  }
}

