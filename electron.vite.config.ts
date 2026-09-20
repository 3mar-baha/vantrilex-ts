import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/main.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/preload.ts') }
      }
    }
  },
  renderer: {
    plugins: [react()],
    root: 'src/ui',
    // Relative base is mandatory: the packaged app loads over file://
    // (and from inside app.asar), where absolute /assets/... URLs 404.
    base: './',
    build: {
      // Absolute outDir: relative outDirs resolve against CWD and leak
      // outside the workspace (seen: O:\out\renderer).
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/ui/index.html') }
      }
    }
  }
})
