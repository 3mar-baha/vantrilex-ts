export type IpcChannel =
  | 'foundry:detect'
  | 'foundry:provision'
  | 'runner:launch'
  | 'voice:speak'
  | 'voice:transcribe'
  | 'mobile:pair'
  | 'mobile:approve'
  | 'doctor:probes'

export const IPC_CHANNELS: IpcChannel[] = [
  'foundry:detect',
  'foundry:provision',
  'runner:launch',
  'voice:speak',
  'voice:transcribe',
  'mobile:pair',
  'mobile:approve',
  'doctor:probes'
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
  pid: number
}

export interface SpeakResult {
  audioId: string
  cached: boolean
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
  speak: (text: string) => Promise<SpeakResult>
  transcribe: (audioId: string) => Promise<{ text: string }>
  pair: () => Promise<PairResult>
  approve: (id: string, decision: boolean) => Promise<{ ok: boolean }>
  probes: () => Promise<ProbeStatus[]>
}

export function createApi(invoke: InvokeFn): VantrilexApi {
  return {
    detect: (workspace) => invoke('foundry:detect', workspace) as Promise<DetectResult>,
    provision: (workspace, projectCase) =>
      invoke('foundry:provision', workspace, projectCase) as Promise<ProvisionResult>,
    launch: (runner, workspace, resume) =>
      invoke('runner:launch', runner, workspace, resume) as Promise<LaunchResult>,
    speak: (text) => invoke('voice:speak', text) as Promise<SpeakResult>,
    transcribe: (audioId) => invoke('voice:transcribe', audioId) as Promise<{ text: string }>,
  pair: () => invoke('mobile:pair') as Promise<PairResult>,
  approve: (id, decision) => invoke('mobile:approve', id, decision) as Promise<{ ok: boolean }>,
  probes: () => invoke('doctor:probes') as Promise<ProbeStatus[]>
  }
}
