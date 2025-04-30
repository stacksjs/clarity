#!/usr/bin/env bun
import process from 'node:process'
import { createCli } from '../src/cli/create-cli'

async function main() {
  try {
    const cli = await createCli()
    cli.parse(process.argv, { run: false })
    await cli.runMatchedCommand()
  }
  catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
