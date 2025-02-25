import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  target: 'bun',
  plugins: [dts()],
})

await Bun.build({
  entrypoints: ['src/browser.ts'],
  outdir: './dist',
  target: 'browser',
  plugins: [dts()],
})
