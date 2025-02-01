import type { ClarityConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: ClarityConfig = {
  verbose: true,
}

// @ts-expect-error there is a current dtsx issue
// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig({
  name: 'clarity',
  defaultConfig,
})
