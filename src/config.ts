import type { ClarityConfig } from './types'
import { loadConfig } from 'bunfig'

const defaultRotationConfig: ClarityConfig['rotation'] = {
  frequency: 'daily',
  maxSize: 10 * 1024 * 1024,
  maxFiles: 5,
  compress: false,
  rotateHour: 0,
  rotateMinute: 0,
  rotateDayOfWeek: 0,
  rotateDayOfMonth: 1,
  encrypt: false,
}

export const defaultConfig: ClarityConfig = {
  level: 'info',
  defaultName: 'app',
  timestamp: true,
  colors: true,
  format: 'text',
  maxLogSize: 10 * 1024 * 1024,
  logDatePattern: 'YYYY-MM-DD',
  logDirectory: '',
  rotation: defaultRotationConfig,
  verbose: false,
}

// @ts-expect-error there is a current dtsx issue
// eslint-disable-next-line antfu/no-top-level-await
export const config: ClarityConfig = await loadConfig({
  name: 'clarity',
  defaultConfig,
})
