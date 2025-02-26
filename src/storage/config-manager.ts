import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_FILE = join(homedir(), '.clarity', 'config.json')

export interface ConfigManager {
  initialize: () => Promise<void>
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<void>
  list: () => Promise<Record<string, any>>
  save: () => Promise<void>
}

class ConfigManagerImpl implements ConfigManager {
  private config: Record<string, any> = {}
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized)
      return

    try {
      const content = await readFile(CONFIG_FILE, 'utf8')
      this.config = JSON.parse(content)
    }
    catch {
      this.config = {}
    }

    this.initialized = true
  }

  async get(key: string): Promise<any> {
    await this.initialize()
    return this.config[key]
  }

  async set(key: string, value: any): Promise<void> {
    await this.initialize()
    this.config[key] = value
    await this.save()
  }

  async list(): Promise<Record<string, any>> {
    await this.initialize()
    return { ...this.config }
  }

  async save(): Promise<void> {
    await writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2))
  }
}

export const configManager: ConfigManager = new ConfigManagerImpl()
