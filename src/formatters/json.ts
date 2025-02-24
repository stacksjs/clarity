import type { Formatter, LogEntry } from '../types'
import process from 'node:process'
import { isServerProcess } from '../utils'

export class JsonFormatter implements Formatter {
  async format(entry: LogEntry): Promise<string> {
    const isServer = await isServerProcess()
    const metadata = await this.getMetadata(isServer)

    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      name: entry.name,
      message: entry.message,
      metadata,
    })
  }

  private async getMetadata(isServer: boolean) {
    if (isServer) {
      const { hostname } = await import('node:os')
      return {
        pid: process.pid,
        hostname: hostname(),
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        version: process.version,
      }
    }

    return {
      userAgent: navigator.userAgent,
      hostname: window.location.hostname || 'browser',
      environment: process.env.NODE_ENV || process.env.BUN_ENV || 'development',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      language: navigator.language,
    }
  }
}
