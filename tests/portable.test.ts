// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import AdmZip from 'adm-zip'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensurePortableBun, portableBinDir, prependPortablePath } from '../src/engine/doctor/portable'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'vtx-portable-'))
  dirs.push(d)
  return d
}

function bunZip(): Buffer {
  const zip = new AdmZip()
  zip.addFile('bun-windows-x64/bun.exe', Buffer.from('fake-binary'))
  zip.addFile('bun-windows-x64/README', Buffer.from('docs'))
  return zip.toBuffer()
}

describe('portable bun directory layout and PATH prepend', () => {
  it('creates the bin dir path shape', () => {
    const dir = portableBinDir(tempDir())
    expect(dir.endsWith('.vantrilex')).toBe(false)
  })

  it('prepends once without duplicating', () => {
    const before = process.env.PATH ?? ''
    process.env.PATH = `C:\\portable-test-bin;${before}`
    prependPortablePath('C:\\portable-test-bin', {
      getPath: () => process.env.PATH ?? '',
      setPath: (p) => {
        process.env.PATH = p
      }
    })
    const count = (process.env.PATH?.split(';').filter((p) => p === 'C:\\portable-test-bin').length) ?? 0
    expect(count).toBe(1)
    process.env.PATH = before
  })
})

describe('portable bun provisioning', () => {
  it('no-ops off Windows', async () => {
    const dir = await ensurePortableBun({
      platform: 'linux',
      lookPath: async () => null
    })
    expect(dir).toBe('')
  })

  it('no-ops when bun is on PATH', async () => {
    const dir = await ensurePortableBun({
      platform: 'win32',
      lookPath: async () => 'C:\\bun\\bun.exe'
    })
    expect(dir).toBe('')
  })

  it('downloads, unpacks, and prepends on Windows when missing', async () => {
    const bin = tempDir()
    const seen: string[] = []
    const dir = await ensurePortableBun({
      platform: 'win32',
      lookPath: async () => null,
      fetchZip: async () => bunZip(),
      binDir: () => bin,
      getPath: () => '',
      setPath: (p) => {
        seen.push(p)
      }
    })
    expect(dir).toBe(bin)
    expect(seen[0].startsWith(bin)).toBe(true)
  })

  it('fails soft when the download errors', async () => {
    const failing = vi.fn(async () => {
      throw new Error('offline')
    })
    const dir = await ensurePortableBun({
      platform: 'win32',
      lookPath: async () => null,
      fetchZip: failing,
      binDir: () => tempDir()
    })
    expect(dir).toBe('')
    expect(failing).toHaveBeenCalled()
  })

  it('writes a runnable bun.exe from a crafted zip', async () => {
    const bin = tempDir()
    await ensurePortableBun({
      platform: 'win32',
      lookPath: async () => null,
      fetchZip: async () => bunZip(),
      binDir: () => bin
    })
    const { readFileSync } = await import('node:fs')
    expect(readFileSync(join(bin, 'bun.exe'), 'utf8')).toBe('fake-binary')
    writeFileSync(join(bin, 'marker.txt'), 'x')
    expect(readFileSync(join(bin, 'marker.txt'), 'utf8')).toBe('x')
  })
})
