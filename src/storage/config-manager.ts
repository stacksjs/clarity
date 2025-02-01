import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface Config {
  level?: 'debug' | 'info' | 'warning' | 'error'
  defaultName?: string
  verbose?: boolean
  json?: boolean
  timestamp?: boolean
  [key: string]: any
}

export class ConfigManager {
  private configDir: string
  private configFile: string
  private config: Config = {}

  constructor() {
    this.configDir = join(homedir(), '.clarity')
    this.configFile = join(this.configDir, 'config.json')
  }

  async initialize(): Promise<void> {
    await mkdir(this.configDir, { recursive: true })
    try {
      const data = await readFile(this.configFile, 'utf-8')
      this.config = JSON.parse(data)
    }
    catch {
      this.config = {
        level: 'info',
        defaultName: 'app',
        verbose: false,
        json: false,
        timestamp: true,
      }
      await this.save()
    }
  }

  private async save(): Promise<void> {
    await writeFile(this.configFile, JSON.stringify(this.config, null, 2), 'utf-8')
  }

  async get(key: string): Promise<any> {
    return this.config[key]
  }

  async set(key: string, value: any): Promise<void> {
    this.config[key] = value
    await this.save()
  }

  async list(): Promise<Config> {
    return { ...this.config }
  }
}

export const configManager: ConfigManager = new ConfigManager()
