#!/usr/bin/env node

import bcrypt from 'bcryptjs'

/**
 * Generates a bcrypt hash for the single-admin password used by polarGPT.
 * The script only accepts a CLI argument so it stays shell-friendly for CI and
 * deployment environments.
 */
async function main() {
  const password = process.argv[2]

  if (!password) {
    console.error('Usage: npm run hash:admin -- "your-password"')
    process.exitCode = 1
    return
  }

  const hash = await bcrypt.hash(password, 12)
  console.log(hash)
}

main().catch((error) => {
  console.error('Failed to hash admin password:', error)
  process.exitCode = 1
})
