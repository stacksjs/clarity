import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  target: 'bun',
  plugins: [dts()],
})

// Build the CLI
await Bun.build({
  entrypoints: ['bin/cli.ts'],
  target: 'bun',
  outdir: './dist/bin',
  plugins: [dts()],
})

await Bun.build({
  entrypoints: ['src/browser.ts'],
  outdir: './dist',
  target: 'browser',
  plugins: [dts()],
})
