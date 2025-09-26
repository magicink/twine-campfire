import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Synchronizes the version from the monorepo root to the VS Code extension
 * @param {boolean} checkOnly - If true, only checks if versions match without updating
 * @returns {boolean} - True if versions are already in sync or were synced successfully
 */
const syncVersion = (checkOnly: boolean = false): boolean => {
  // Read monorepo root version (the source of truth)
  const rootPackagePath = join(process.cwd(), 'package.json')
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf-8'))

  // Read extension package.json
  const extensionPackagePath = join(
    process.cwd(),
    'projects/campfire-vscode-extension/package.json'
  )
  const extensionPackage = JSON.parse(
    readFileSync(extensionPackagePath, 'utf-8')
  )

  // Check if versions match
  const versionsMatch = rootPackage.version === extensionPackage.version

  // In check-only mode, just return whether versions match
  if (checkOnly) {
    if (!versionsMatch) {
      console.error(
        `Version mismatch: Root (${rootPackage.version}) vs Extension (${extensionPackage.version})`
      )
      return false
    }
    console.log(`Versions are in sync: ${rootPackage.version}`)
    return true
  }

  // If versions already match, no need to update
  if (versionsMatch) {
    console.log(
      `VS Code extension version already matches root version (${rootPackage.version})`
    )
    return true
  }

  // Update version
  extensionPackage.version = rootPackage.version

  // Write back
  writeFileSync(
    extensionPackagePath,
    JSON.stringify(extensionPackage, null, 2) + '\n'
  )

  console.log(`Updated VS Code extension version to ${rootPackage.version}`)
  return true
}

// Parse command line arguments to determine mode
const args = process.argv.slice(2)
const checkOnly = args.includes('--check')

// Run the sync function and exit with appropriate code
const success = syncVersion(checkOnly)
if (!success) {
  process.exit(1)
}
