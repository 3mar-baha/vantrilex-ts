import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { setupTray } from './tray'
import { checkForUpdates } from './updater'
import { checkAll } from '../src/engine/doctor/deps'
import { deleteSession, loadSessions, recordSession } from '../src/engine/runner/sessions'
import { launchAgent, type RunnerId } from '../src/engine/runner/spawn'
import { Keyring, MemoryKeyStore } from '../src/engine/voice/keyring'
import { GroqStt } from '../src/engine/voice/stt'
import { FishTts } from '../src/engine/voice/tts'
import { ApprovalQueue } from '../src/engine/mobile/push'
import { DEFAULT_RELAY_URL, HappyRelay } from '../src/engine/mobile/relay'
import { PairingSession, qrDataUri, qrSvg } from '../src/engine/mobile/pairing'
import { detectProjectCase } from '../src/engine/foundry/detect'
import { scaffoldDocs } from '../src/engine/foundry/docs'
import { provisionCoreSkills } from '../src/engine/foundry/skills'
import { immunologySummary, loadLedger } from '../src/engine/immune/ledger'
import { applyFoundryGuard } from '../src/engine/scaffold/provision'
import { createSecureStore } from './secure-store'
import { clampBuffer, clampText, validateId, validateWorkspace, workspaceBase } from './validate'

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
  ipcMain.handle('foundry:detect', (_event, workspace: unknown) => {
    const dir = validateWorkspace(workspace)
    const details = detectProjectCase(dir)
    return {
      projectCase: details.projectCase,
      language: details.language,
      stack: details.stack,
      action: details.action
    }
  })

  ipcMain.handle('foundry:provision', async (event, workspace: unknown, projectCase: unknown) => {
    const dir = validateWorkspace(workspace)
    if (typeof projectCase !== 'number' || ![1, 2, 3].includes(projectCase)) {
      throw new Error('projectCase must be 1, 2, or 3')
    }
    const errors: string[] = []
    const created: string[] = []
    const total = 28 + 7 + 1
    let done = 0
    const emit = (file: string) => {
      done += 1
      event.sender.send('foundry:progress', { done, total, file })
    }
    try {
      const docs = scaffoldDocs(dir, workspaceBase(dir), { immuneSummary: immunologySummary(loadLedger()) })
      for (const f of docs.created) {
        created.push(f)
        emit(f)
      }
    } catch (err) {
      errors.push((err as Error).message)
    }
    try {
      const skills = provisionCoreSkills(dir)
      for (const f of skills.created) {
        created.push(f)
        emit(f)
      }
    } catch (err) {
      errors.push((err as Error).message)
    }
    try {
      const guard = applyFoundryGuard(dir)
      for (const f of guard.created) {
        created.push(f)
        emit(f)
      }
    } catch (err) {
      errors.push((err as Error).message)
    }
    return { created, errors }
  })

  ipcMain.handle('doctor:probes', async () => {
    const statuses = await checkAll()
    return statuses.map((s) => ({ key: s.dep.key, found: s.found, version: s.version }))
  })

  ipcMain.handle('runner:launch', (_event, runner: unknown, workspace: unknown, resume?: unknown) => {
    if (runner !== 'opencode' && runner !== 'claude' && runner !== 'codex') {
      throw new Error(`unknown runner: ${String(runner)}`)
    }
    const dir = validateWorkspace(workspace)
    const resumeId = typeof resume === 'string' ? resume : ''
    recordSession({ workspace: dir, runner: runner as RunnerId })
    const child = launchAgent(runner as RunnerId, { workspace: dir, resumeId })
    return { pid: child.pid ?? null }
  })

  ipcMain.handle('runner:sessions:list', () => loadSessions())

  ipcMain.handle('runner:sessions:delete', (_event, id: unknown) => ({ ok: deleteSession(validateId(id, 'session id')) }))

  ipcMain.handle('voice:keyring:status', () => voice().keyring.status())

  ipcMain.handle('voice:keyring:set', (_event, provider: unknown, secret: unknown) => {
    if (provider !== 'fish_audio' && provider !== 'groq') {
      throw new Error(`unknown voice provider: ${String(provider)}`)
    }
    if (typeof secret !== 'string' || secret.trim() === '') {
      throw new Error('refusing empty key')
    }
    const v = voice()
    v.keyring.addKey(provider, secret)
    return v.keyring.status()
  })

  ipcMain.handle('voice:tts:speak', async (_event, text: unknown) => {
    const res = await voice().tts.speak(clampText(text))
    return {
      audioBase64: Buffer.from(res.audio).toString('base64'),
      format: res.format,
      cached: res.cached
    }
  })

  ipcMain.handle('voice:stt:transcribe', async (_event, audioBase64: unknown, filename?: unknown) => {
    if (typeof audioBase64 !== 'string' || audioBase64 === '') {
      throw new Error('audio must be a non-empty base64 string')
    }
    const bytes = clampBuffer(new Uint8Array(Buffer.from(audioBase64, 'base64')))
    const res = await voice().stt.transcribe(bytes, typeof filename === 'string' && filename !== '' ? filename : 'input.mp3')
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

  ipcMain.handle('mobile:approval:respond', (_event, id: unknown, decision: unknown) => {
    return { ok: mobile().approvals.respond(validateId(id, 'approval id'), decision ? 'approved' : 'rejected') }
  })

  ipcMain.handle('mobile:scan', () => {
    mobile().pairing.markScanned()
    return { state: mobile().pairing.state }
  })

  ipcMain.handle('mobile:connect', () => {
    mobile().pairing.connect()
    return { state: mobile().pairing.state }
  })

  ipcMain.handle(
    'mobile:approval:request',
    (_event, sessionId: unknown, kind: unknown, summary: unknown) => {
      const validKind = kind === 'bash' || kind === 'write' || kind === 'edit' ? kind : 'other'
      const req = mobile().approvals.request(
        validateId(sessionId, 'session id'),
        validKind,
        clampText(summary, 2000)
      )
      return { id: req.id }
    }
  )

  ipcMain.handle(
    'mobile:approval:forward',
    async (_event, id: unknown, token: unknown) => {
      const approved = mobile().approvals
      const cleanId = validateId(id, 'approval id')
      const cleanToken = validateId(token, 'relay token')
      const ok = await approved.forward(mobile().relay, cleanId, cleanToken)
      return { ok }
    }
  )
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
