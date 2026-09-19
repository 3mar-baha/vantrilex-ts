import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { setupTray } from './tray'
import { checkForUpdates } from './updater'
import { checkAll } from '../src/engine/doctor/deps'
import { deleteSession, loadSessions, recordSession } from '../src/engine/runner/sessions'
import { launchAgent, type RunnerId } from '../src/engine/runner/spawn'
import { Keyring, MemoryKeyStore, type VoiceProvider } from '../src/engine/voice/keyring'
import { GroqStt } from '../src/engine/voice/stt'
import { FishTts } from '../src/engine/voice/tts'
import { ApprovalQueue } from '../src/engine/mobile/push'
import { DEFAULT_RELAY_URL, HappyRelay } from '../src/engine/mobile/relay'
import { PairingSession, qrDataUri, qrSvg } from '../src/engine/mobile/pairing'
import { createSecureStore } from './secure-store'

function createKeyring(): Keyring {
  try {
    return new Keyring(createSecureStore(app.getPath('userData')))
  } catch {
    return new Keyring(new MemoryKeyStore())
  }
}

let keyring: Keyring | null = null
let tts: FishTts | null = null
let stt: GroqStt | null = null

function voice(): { keyring: Keyring; tts: FishTts; stt: GroqStt } {
  if (!keyring || !tts || !stt) {
    keyring = createKeyring()
    tts = new FishTts(keyring)
    stt = new GroqStt(keyring)
  }
  return { keyring, tts, stt }
}

interface MobileContext {
  pairing: PairingSession
  approvals: ApprovalQueue
  relay: HappyRelay
}

let mobileCtx: MobileContext | null = null

function mobile(): MobileContext {
  if (!mobileCtx) {
    const relayUrl = process.env['HAPPY_SERVER_URL'] ?? DEFAULT_RELAY_URL
    mobileCtx = {
      pairing: new PairingSession(relayUrl),
      approvals: new ApprovalQueue(),
      relay: new HappyRelay({ serverUrl: relayUrl })
    }
  }
  return mobileCtx
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#faf9f5',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    void mainWindow.loadURL(devUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerChannels(): void {
  const stub = async () => ({ ok: false, error: 'engine not implemented (Phase 6+)' })
  for (const channel of ['foundry:detect', 'foundry:provision']) {
    ipcMain.handle(channel, stub)
  }

  ipcMain.handle('doctor:probes', async () => {
    const statuses = await checkAll()
    return statuses.map((s) => ({ key: s.dep.key, found: s.found, version: s.version }))
  })

  ipcMain.handle('runner:launch', (_event, runner: RunnerId, workspace: string, resume?: string) => {
    const resumeId = typeof resume === 'string' ? resume : ''
    recordSession({ workspace, runner })
    const child = launchAgent(runner, { workspace, resumeId })
    return { pid: child.pid ?? null }
  })

  ipcMain.handle('runner:sessions:list', () => loadSessions())

  ipcMain.handle('runner:sessions:delete', (_event, id: string) => ({ ok: deleteSession(id) }))

  ipcMain.handle('voice:keyring:status', () => voice().keyring.status())

  ipcMain.handle('voice:keyring:set', (_event, provider: VoiceProvider, secret: string) => {
    if (provider !== 'fish_audio' && provider !== 'groq') {
      throw new Error(`unknown voice provider: ${String(provider)}`)
    }
    const v = voice()
    v.keyring.addKey(provider, secret)
    return v.keyring.status()
  })

  ipcMain.handle('voice:tts:speak', async (_event, text: string) => {
    const res = await voice().tts.speak(String(text))
    return {
      audioBase64: Buffer.from(res.audio).toString('base64'),
      format: res.format,
      cached: res.cached
    }
  })

  ipcMain.handle('voice:stt:transcribe', async (_event, audioBase64: string, filename?: string) => {
    const bytes = new Uint8Array(Buffer.from(String(audioBase64), 'base64'))
    const res = await voice().stt.transcribe(bytes, typeof filename === 'string' ? filename : 'input.mp3')
    return { text: res.text }
  })

  ipcMain.handle('mobile:status', () => {
    const session = mobile()
    return {
      state: session.pairing.state,
      relayUrl: session.relay.serverUrl,
      sessionId: session.pairing.payload?.session ?? null,
      pairedDevices: session.pairing.state === 'Connected' || session.pairing.state === 'Paired' ? 1 : 0,
      pendingApprovals: session.approvals.pending().length
    }
  })

  ipcMain.handle('mobile:qr:generate', async () => {
    const session = mobile()
    const payload = session.pairing.begin()
    const [svg, dataUri] = await Promise.all([qrSvg(payload), qrDataUri(payload)])
    return { svg, dataUri, expiresAt: payload.exp }
  })

  ipcMain.handle('mobile:approval:respond', (_event, id: string, decision: boolean) => {
    return { ok: mobile().approvals.respond(id, decision ? 'approved' : 'rejected') }
  })
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.vantrilex.workbench')
  }
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
  registerChannels()
  createWindow()
  setupTray(app, () => mainWindow)
  void checkForUpdates()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
