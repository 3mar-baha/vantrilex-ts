import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { setupTray } from './tray'
import { checkForUpdates } from './updater'
import { checkAll } from '../src/engine/doctor/deps'
import { deleteSession, loadSessions, recordSession } from '../src/engine/runner/sessions'
import { launchAgent, type RunnerId } from '../src/engine/runner/spawn'

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
  const stub = async () => ({ ok: false, error: 'engine not implemented (Phase 5+)' })
  for (const channel of [
    'foundry:detect',
    'foundry:provision',
    'voice:speak',
    'voice:transcribe',
    'mobile:pair',
    'mobile:approve'
  ]) {
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
