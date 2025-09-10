import process from 'node:process'

declare global {
  interface Navigator {
    product: string
  }
}

export function isBrowserProcess(): boolean {
  // Always return false in test environment
  if (process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test') {
    return false
  }

  return typeof window !== 'undefined'
}

export async function isServerProcess(): Promise<boolean> {
  // Always return true in test environment
  if (process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test') {
    return true
  }

  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true
  }

  if (typeof process !== 'undefined') {
    // Electron (https://www.electronjs.org/docs/latest/api/process#processtype-readonly)
    const type = (process as any).type
    if (type === 'renderer' || type === 'worker') {
      return false
    }

    return !!(
      process.versions
      && (process.versions.node || process.versions.bun)
    )
  }

  return false
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size)
    chunks.push(array.slice(i, i + size))
  return chunks
}

/**
 * Detect if running under Ghostty terminal.
 */
export function isGhostty(): boolean {
  try {
    return process.env.TERM_PROGRAM === 'Ghostty'
  }
  catch {
    return false
  }
}

/**
 * Whether OSC 8 hyperlinks are supported, using a conservative heuristic.
 * Allows opt-in via FORCE_OSC8=1 and disables via NO_OSC8=1.
 */
export function supportsOsc8(): boolean {
  if (process.env.NO_OSC8 === '1')
    return false
  if (process.env.FORCE_OSC8 === '1')
    return true

  // Known implementations: Ghostty, iTerm2, modern VSCode terminal, foot, kitty
  const termProgram = process.env.TERM_PROGRAM || ''
  if (termProgram === 'Ghostty' || termProgram === 'iTerm.app' || termProgram === 'WezTerm' || termProgram === 'vscode')
    return true

  // Fallback to TTY presence as a weak signal
  const hasTTY = (typeof process.stderr !== 'undefined' && (process.stderr as any).isTTY)
    || (typeof process.stdout !== 'undefined' && (process.stdout as any).isTTY)
  return !!hasTTY
}

/**
 * Create an OSC 8 hyperlink sequence.
 * Format: ESC ] 8 ; params ; url ST text ESC ] 8 ;; ST
 */
export function makeOsc8Link(text: string, url: string): string {
  const ESC = '\u001B]'
  const ST = '\u0007'
  // Empty params segment (";") for default behavior
  return `${ESC}8;;${url}${ST}${text}${ESC}8;;${ST}`
}
