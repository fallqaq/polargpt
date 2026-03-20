#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REQUIRED_KEYS = [
  'ADMIN_PASSWORD_HASH',
  'SESSION_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'GEMINI_API_KEY'
]

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const values = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    values[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }

  return values
}

function readLocalEnv() {
  const envPath = resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    return null
  }

  return parseEnvFile(envPath)
}

function runGitCommand(command) {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim()
  }
  catch {
    return ''
  }
}

function main() {
  const env = readLocalEnv()
  const branch = runGitCommand('git branch --show-current') || '(unknown)'
  const origin = runGitCommand('git remote get-url origin')
  const lastCommit = runGitCommand('git log --oneline -1')

  console.log('polarGPT preview doctor')
  console.log('')
  console.log(`Current branch: ${branch}`)
  console.log(`Origin remote: ${origin || 'missing'}`)
  console.log(`Last commit: ${lastCommit || 'missing'}`)
  console.log('')

  if (!env) {
    console.log('Blockers:')
    console.log('- Missing local .env file.')
    console.log('')
    console.log('Next step:')
    console.log('- Create .env from .env.example and fill the required values.')
    process.exitCode = 1
    return
  }

  const missingKeys = REQUIRED_KEYS.filter((key) => !env[key])
  const readyKeys = REQUIRED_KEYS.filter((key) => env[key])

  console.log('Local environment:')
  console.log(`- Ready values: ${readyKeys.length}/${REQUIRED_KEYS.length}`)
  console.log(`- APP_BASE_URL: ${env.APP_BASE_URL || 'missing'}`)
  console.log(`- GEMINI_MODEL: ${env.GEMINI_MODEL || 'gemini-2.5-flash (default)'}`)
  console.log('')

  const blockers = []

  if (!origin) {
    blockers.push('GitHub remote is not configured yet.')
  }

  for (const key of missingKeys) {
    blockers.push(`Missing .env value: ${key}`)
  }

  if (blockers.length > 0) {
    console.log('Blockers:')

    for (const blocker of blockers) {
      console.log(`- ${blocker}`)
    }

    console.log('')
    console.log('Recommended next steps:')

    if (!env.ADMIN_PASSWORD_HASH) {
      console.log('- Run: npm run hash:admin -- "your-admin-password"')
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) {
      console.log('- Create the Supabase Preview project and copy SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY into .env.')
    }

    if (!env.GEMINI_API_KEY) {
      console.log('- Paste your Google AI API key into GEMINI_API_KEY in .env.')
    }

    if (!origin) {
      console.log('- Create an empty GitHub repo named polargpt, then run:')
      console.log('  git remote add origin https://github.com/<your-github-username>/polargpt.git')
      console.log('  git push -u origin main')
    }

    console.log('')
    console.log('After that, rerun: npm run preview:doctor')
    process.exitCode = 1
    return
  }

  console.log('No local blockers found.')
  console.log('')
  console.log('Next steps:')
  console.log('- Run: npm run preview:ready')
  console.log('- Import the GitHub repo into Vercel.')
  console.log('- Add Preview environment variables in Vercel.')
  console.log('- Create and push a non-main branch to trigger a Preview deployment.')
}

main()
