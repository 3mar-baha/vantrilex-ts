import { App, Menu, nativeImage, Tray } from 'electron'

let tray: Tray | null = null

export function setupTray(app: App, getWindow: () => { show: () => void } | null): void {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('Vantrilex Workbench')
  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Vantrilex',
      click: () => {
        getWindow()?.show()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
}
