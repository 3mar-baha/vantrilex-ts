import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { setupTray } from './tray'
import { checkForUpdates } from './updater'

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
  const stub = async () => ({ ok: false, error: 'engine not implemented (Phase 1+)' })
  const channels = [
    'foundry:detect',
    'foundry:provision',
    'runner:launch',
    'voice:speak',
    'voice:transcribe',
    'mobile:pair',
    'mobile:approve',
    'doctor:probes'
  ]
  for (const channel of channels) {
    ipcMain.handle(channel, stub)
  }
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
