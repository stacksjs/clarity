#!/usr/bin/env bun

import { mkdir, readFile, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Reads the nearest package.json and returns the package name.
 * @param rootDir Directory to start searching from (defaults to process.cwd())
 */
async function getPackageName(rootDir: string = process.cwd()): Promise<string | undefined> {
  try {
    const pkgPath = join(rootDir, 'package.json')
    const pkgJson = await readFile(pkgPath, 'utf8')
    const pkg = JSON.parse(pkgJson)
    return pkg.name
  }
  catch (err) {
    console.error(`[ERROR] Failed to get package name: ${err}`)
    // Optionally, walk up directories if not found, or just return undefined
    return undefined
  }
}

async function getBinNames(rootDir: string = process.cwd()): Promise<string[] | undefined> {
  try {
    const pkgPath = join(rootDir, 'package.json')
    const pkgJson = await readFile(pkgPath, 'utf8')
    const pkg = JSON.parse(pkgJson)
    if (!pkg.bin)
      return undefined
    if (typeof pkg.bin === 'string') {
      // If bin is a string, the bin name is the package name
      return [pkg.name]
    }
    if (typeof pkg.bin === 'object') {
      // If bin is an object, the keys are the bin names
      return Object.keys(pkg.bin)
    }
    return undefined
  }
  catch (err) {
    console.error(`[ERROR] Failed to get bin names: ${err}`)
    return undefined
  }
}

/*
* Transforms the <project>/node_modules/bun-git-hooks to <project>
*/
async function getProjectRootDirectoryFromNodeModules(projectPath: string): Promise<string | undefined> {
  function _arraysAreEqual(a1: any[], a2: any[]) {
    return JSON.stringify(a1) === JSON.stringify(a2)
  }

  const packageName = await getPackageName()
  if (packageName === undefined) {
    console.error('[ERROR] Failed to get package name')
    return undefined
  }

  const binNames = await getBinNames()
  if (binNames === undefined) {
    console.error('[ERROR] Failed to get bin names')
    return undefined
  }

  const projDir = projectPath.split(/[\\/]/) // <- would split both on '/' and '\'

  const indexOfStoreDir = projDir.indexOf('.store')
  if (indexOfStoreDir > -1) {
    return projDir.slice(0, indexOfStoreDir - 1).join('/')
  }

  // Handle .bin case for any bin name
  if (
    projDir.length > 3
    && projDir[projDir.length - 3] === 'node_modules'
    && projDir[projDir.length - 2] === '.bin'
    && binNames.includes(projDir[projDir.length - 1])
  ) {
    return projDir.slice(0, -3).join('/')
  }

  // Existing node_modules check
  if (projDir.length > 2
    && _arraysAreEqual(projDir.slice(-2), ['node_modules', packageName])) {
    return projDir.slice(0, -2).join('/')
  }

  return undefined
}

/**
 * Creates the pre-commit from command in config by default
 */
async function postinstall() {
  let projectDirectory

  /* When script is run after install, the process.cwd() would be like <project_folder>/node_modules/simple-git-hooks
     Here we try to get the original project directory by going upwards by 2 levels
     If we were not able to get new directory we assume, we are already in the project root */
  const parsedProjectDirectory = await getProjectRootDirectoryFromNodeModules(process.cwd())
  if (parsedProjectDirectory !== undefined) {
    projectDirectory = parsedProjectDirectory
  }
  else {
    projectDirectory = process.cwd()
  }

  // Link the binary
  const binDir = join(projectDirectory, 'node_modules', '.bin')
  await mkdir(binDir, { recursive: true })

  const sourcePath = join(process.cwd(), 'dist', 'bin', 'cli.js')

  const binNames = await getBinNames()
  if (binNames === undefined) {
    console.error('[ERROR] Failed to get bin names')
    return undefined
  }

  for (const binName of binNames) {
    const targetPath = join(binDir, binName)
    try {
      await symlink(sourcePath, targetPath, 'file')
    }
    catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        console.error(`[ERROR] Failed to link binary: ${err}`)
      }
    }
  }
}

postinstall()
