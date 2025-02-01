import type { LogEntry } from '../types'
import { Buffer } from 'node:buffer'
import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

interface RotationConfig {
  maxSize: number // Maximum file size in bytes before rotation (default: 10MB)
  maxFiles: number // Maximum number of rotated files to keep (default: 5)
  compress: boolean // Whether to compress rotated files (default: true)
  datePattern: string // Date pattern for rotated files (default: YYYY-MM-DD)
}

export class LogRotator {
  private currentSize: number = 0
  private defaultConfig: RotationConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true,
    datePattern: 'YYYY-MM-DD',
  }

  constructor(
    private logDir: string,
    private currentLogFile: string,
    private config: Partial<RotationConfig> = {},
  ) {
    this.config = { ...this.defaultConfig, ...config }
  }

  async initialize(): Promise<void> {
    await mkdir(dirname(this.currentLogFile), { recursive: true })
    try {
      const stats = await stat(this.currentLogFile)
      this.currentSize = stats.size
    }
    catch {
      this.currentSize = 0
    }
  }

  async shouldRotate(): Promise<boolean> {
    try {
      const stats = await stat(this.currentLogFile)
      return stats.size >= this.config.maxSize
    }
    catch {
      return false
    }
  }

  async rotateFile(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0]
    const baseFilename = basename(this.currentLogFile, '.log')
    let index = 1

    // Find next available index for rotation
    while (true) {
      const rotatedFilename = join(
        this.logDir,
        `${baseFilename}.${timestamp}.${index}.log${this.config.compress ? '.gz' : ''}`,
      )
      try {
        await stat(rotatedFilename)
        index++
      }
      catch {
        // File doesn't exist, we can use this name
        break
      }
    }

    const rotatedFilename = join(
      this.logDir,
      `${baseFilename}.${timestamp}.${index}.log${this.config.compress ? '.gz' : ''}`,
    )

    // Read current log file
    const content = await readFile(this.currentLogFile)

    if (this.config.compress) {
      const { gzip } = await import('node:zlib')
      const { promisify } = await import('node:util')
      const gzipAsync = promisify(gzip)
      const compressed = await gzipAsync(content)
      await writeFile(rotatedFilename, compressed)
    }
    else {
      await rename(this.currentLogFile, rotatedFilename)
    }

    // Create new empty log file
    await writeFile(this.currentLogFile, '')
    this.currentSize = 0

    // Clean up old files if needed
    await this.cleanOldFiles()
  }

  private async cleanOldFiles(): Promise<void> {
    const files = await readdir(this.logDir)
    const baseFilename = basename(this.currentLogFile, '.log')
    const rotatedFiles = files
      .filter(file => file.startsWith(baseFilename) && file !== basename(this.currentLogFile))
      .map(file => ({
        name: file,
        path: join(this.logDir, file),
        timestamp: file.split('.')[1], // Extract date from filename
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)) // Sort by date, newest first

    // Remove excess files
    for (const file of rotatedFiles.slice(this.config.maxFiles - 1)) {
      try {
        await import('node:fs').then(fs => fs.promises.unlink(file.path))
      }
      catch (error) {
        console.error(`Failed to delete old log file ${file.path}:`, error)
      }
    }
  }

  async writeLog(entry: LogEntry): Promise<void> {
    const logString = `${JSON.stringify(entry)}\n`
    const size = Buffer.byteLength(logString)

    if (this.currentSize + size > this.config.maxSize) {
      await this.rotateFile()
    }

    await writeFile(this.currentLogFile, logString, { flag: 'a' })
    this.currentSize += size
  }

  async readLogs(options: {
    start?: Date
    end?: Date
    files?: number // Number of files to read back through
  } = {}): Promise<LogEntry[]> {
    const logs: LogEntry[] = []
    const files = await readdir(this.logDir)
    const baseFilename = basename(this.currentLogFile, '.log')

    // Get all log files sorted by date (newest first)
    const logFiles = files
      .filter(file => file.startsWith(baseFilename))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, options.files || this.config.maxFiles)

    for (const file of logFiles) {
      const filePath = join(this.logDir, file)
      let content: Buffer

      if (file.endsWith('.gz')) {
        const { gunzip } = await import('node:zlib')
        const { promisify } = await import('node:util')
        const gunzipAsync = promisify(gunzip)
        const compressed = await readFile(filePath)
        content = await gunzipAsync(compressed)
      }
      else {
        content = await readFile(filePath)
      }

      const entries = content
        .toString()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as LogEntry)
        .filter((entry) => {
          const timestamp = new Date(entry.timestamp)
          return (!options.start || timestamp >= options.start)
            && (!options.end || timestamp <= options.end)
        })

      logs.push(...entries)
    }

    return logs
  }
}
