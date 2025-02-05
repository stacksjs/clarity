declare global {
  interface Navigator {
    product: string
  }
}

export function isBrowserProcess(): boolean {
  return typeof window !== 'undefined'
}

export async function isServerProcess(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true
  }

  const process = await import('node:process')

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
