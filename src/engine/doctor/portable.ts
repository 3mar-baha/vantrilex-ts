import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { platform as osPlatform } from 'node:process'
import AdmZip from 'adm-zip'
import { lookPath } from './deps'

export const BUN_PORTABLE_URL = 'https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip'
const ZIP_CAP_BYTES = 64 * 1024 * 1024

export interface PortableDeps {
  platform?: string
  lookPath?: (binary: string) => Promise<string | null>
  fetchZip?: (url: string) => Promise<Buffer>
  extractExe?: (zipBuffer: Buffer, dir: string) => void
  binDir?: () => string
  getPath?: () => string
  setPath?: (path: string) => void
}

export function portableBinDir(home: string = homedir()): string {
  const dir = join(home, '.vantrilex', 'bin')
  mkdirSync(dir, { recursive: true })
  return dir
}

async function defaultFetchZip(url: string): Promise<Buffer> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)
  try {
    const resp = await fetch(url, { signal: controller.signal, redirect: 'follow' })
    if (!resp.ok) {
      throw new Error(`bun portable: http ${resp.status}`)
    }
    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.length > ZIP_CAP_BYTES) {
      throw new Error('bun portable: archive exceeds size cap')
    }
    return buf
  } finally {
    clearTimeout(timer)
  }
}

function defaultExtractExe(zipBuffer: Buffer, dir: string): void {
  // Write through a temp file: adm-zip detects Buffers with instanceof,
  // which fails across JS realms (bundlers, jsdom). Paths always work.
  const tmp = join(tmpdir(), `bun-portable-${Date.now()}-${Math.floor(Math.random() * 1e6)}.zip`)
  writeFileSync(tmp, zipBuffer)
  try {
    const zip = new AdmZip(tmp)
    const entry = zip
      .getEntries()
      .find((e) => e.entryName.toLowerCase().endsWith('/bun.exe') || e.entryName.toLowerCase() === 'bun.exe')
    if (!entry) {
      throw new Error('bun portable: bun.exe not found in archive')
    }
    writeFileSync(join(dir, 'bun.exe'), entry.getData(), { mode: 0o755 })
  } finally {
    rmSync(tmp, { force: true })
  }
}

export async function ensurePortableBun(deps: PortableDeps = {}): Promise<string> {
  const platform = deps.platform ?? osPlatform
  if (platform !== 'win32') {
    return ''
  }
  const look = deps.lookPath ?? ((b: string) => lookPath(b))
  if (await look('bun')) {
    return ''
  }
  let dir: string
  try {
    dir = deps.binDir ? deps.binDir() : portableBinDir()
  } catch {
    return ''
  }
  if (await look(join(dir, 'bun.exe'))) {
    prependPortablePath(dir, deps)
    return dir
  }
  try {
    const fetchZip = deps.fetchZip ?? defaultFetchZip
    const zipBuffer = await fetchZip(BUN_PORTABLE_URL)
    const extract = deps.extractExe ?? defaultExtractExe
    extract(zipBuffer, dir)
  } catch {
    return ''
  }
  prependPortablePath(dir, deps)
  return dir
}

export function prependPortablePath(dir: string, deps: PortableDeps = {}): void {
  const getPath = deps.getPath ?? (() => process.env.PATH ?? '')
  const setPath = deps.setPath ?? ((p: string) => {
    process.env.PATH = p
  })
  const current = getPath()
  if (current.toLowerCase().startsWith(dir.toLowerCase() + ';')) {
    return
  }
  setPath(`${dir}${delimiter}${current}`)
}
