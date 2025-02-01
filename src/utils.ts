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
