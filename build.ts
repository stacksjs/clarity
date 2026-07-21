import { dts } from 'bun-plugin-dtsx'
import { rm } from 'node:fs/promises'

await rm('./dist', { recursive: true, force: true })

await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  format: 'esm',
  plugins: [dts()],
  splitting: true,
  target: 'node',
})

await Bun.build({
  entrypoints: ['bin/cli.ts'],
  outdir: './dist/bin',
  format: 'esm',
  target: 'node',
})

await Bun.build({
  entrypoints: ['src/browser.ts'],
  outdir: './dist',
  target: 'browser',
  plugins: [dts()],
})
