import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { createApi, type FoundryProgress } from './channels'

contextBridge.exposeInMainWorld(
  'vantrilex',
  createApi(
    (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    (channel, cb: (payload: FoundryProgress) => void) => {
      const listener = (_event: IpcRendererEvent, payload: FoundryProgress) => cb(payload)
      ipcRenderer.on(channel, listener)
      return () => {
        ipcRenderer.removeListener(channel, listener)
      }
    }
  )
)
