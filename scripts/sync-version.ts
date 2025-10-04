import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Synchronizes versions from the monorepo root to subpackages
 * @param {boolean} checkOnly - If true, only checks if versions match without updating
 * @returns {boolean} - True if versions are already in sync or were synced successfully
 */
const syncVersion = (checkOnly: boolean = false): boolean => {
  let allInSync = true

  const rootPackagePath = join(process.cwd(), 'package.json')
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf-8'))
  const rootVersion = rootPackage.version

  const packagesToSync = [
    {
      name: 'VS Code Extension',
      path: join(
        process.cwd(),
        'projects/campfire-vscode-extension/package.json'
      )
    },
    {
      name: 'Campfire App',
      path: join(process.cwd(), 'apps/campfire/package.json')
    }
  ]

  for (const pkg of packagesToSync) {
    try {
      const packageJson = JSON.parse(readFileSync(pkg.path, 'utf-8'))

      const versionsMatch = packageJson.version === rootVersion

      if (checkOnly) {
        if (!versionsMatch) {
          console.error(
            `Version mismatch: Root (${rootVersion}) vs ${pkg.name} (${packageJson.version})`
          )
          allInSync = false
        } else {
          console.log(`${pkg.name} version matches root: ${rootVersion}`)
        }
      } else if (!versionsMatch) {
        packageJson.version = rootVersion

        writeFileSync(pkg.path, JSON.stringify(packageJson, null, 2) + '\n')
        console.log(`Updated ${pkg.name} version to ${rootVersion}`)
      } else {
        console.log(`${pkg.name} version already matches root (${rootVersion})`)
      }
    } catch (error) {
      console.error(`Error processing ${pkg.name}:`, error)
      allInSync = false
    }
  }

  return allInSync
}

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')

const success = syncVersion(checkOnly)
if (!success) {
  process.exit(1)
}
