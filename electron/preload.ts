import { contextBridge, ipcRenderer } from 'electron'
import { createApi } from './channels'

contextBridge.exposeInMainWorld('vantrilex', createApi((channel, ...args) => ipcRenderer.invoke(channel, ...args)))
