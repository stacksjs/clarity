import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

interface ExportTarget {
  import?: string
  types?: string
}

interface PackageManifest {
  exports: Record<string, ExportTarget>
  module?: string
  types?: string
}

describe('published package', () => {
  it('points every declared entry to a built artifact', async () => {
    await import('../build')

    const manifest = await Bun.file(resolve(import.meta.dir, '../package.json')).json() as PackageManifest
    const targets = [
      manifest.module,
      manifest.types,
      ...Object.entries(manifest.exports)
        .filter(([subpath]) => !subpath.includes('*'))
        .flatMap(([, target]) => [target.import, target.types]),
    ].filter((target): target is string => Boolean(target))

    for (const target of targets)
      expect(existsSync(resolve(import.meta.dir, '..', target)), target).toBeTrue()

    const library = await import('@stacksjs/clarity')
    expect(library.Logger).toBeFunction()
  })
})
