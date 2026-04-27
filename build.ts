import { dts } from 'bun-plugin-dtsx'

// Mark `bunfig` as external. Without this, Bun's bundler inlines bunfig's
// dist into clarity — and bunfig itself bundles a (now stale) snapshot of
// clarity recursively, complete with `var config = await loadConfig2()`
// at module top level. That re-introduced TLA was the root cause of every
// hang (`@stacksjs/stx`, `@stacksjs/bunpress`, `ts-broadcasting`, etc.) —
// downstream consumers got two copies of clarity, the inner one frozen at
// pre-fix code. Treating bunfig as a runtime dep keeps clarity's dist
// genuinely sync and lets every importer share a single clarity instance.
await Bun.build({
  entrypoints: ['src/index.ts', 'bin/cli.ts'],
  outdir: './dist',
  target: 'bun',
  external: ['bunfig'],
  plugins: [dts()],
})

await Bun.build({
  entrypoints: ['src/browser.ts'],
  outdir: './dist',
  target: 'browser',
  external: ['bunfig'],
  plugins: [dts()],
})
