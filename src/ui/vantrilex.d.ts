import type { VantrilexApi } from '../../electron/channels'

declare global {
  interface Window {
    vantrilex: VantrilexApi
  }
}

export {}
