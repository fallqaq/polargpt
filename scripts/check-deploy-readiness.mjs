#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REQUIRED_KEYS = [
  'ADMIN_PASSWORD_HASH',
  'SESSION_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'APP_BASE_URL'
]

const OPTIONAL_DEFAULTS = {
  GEMINI_MODEL: 'gemini-2.5-flash'
}

function printUsage() {
  console.log('Usage: npm run deploy:check -- [path-to-env-file]')
}

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

function readEnvironment() {
  const envFileArgument = process.argv[2]

  if (envFileArgument === '--help' || envFileArgument === '-h') {
    printUsage()
    process.exit(0)
  }

  const sources = [process.env]

  if (envFileArgument) {
    const absolutePath = resolve(process.cwd(), envFileArgument)

    if (!existsSync(absolutePath)) {
      console.error(`Environment file not found: ${absolutePath}`)
      process.exit(1)
    }

    sources.unshift(parseEnvFile(absolutePath))
  }
  else {
    const defaultEnvPath = resolve(process.cwd(), '.env')

    if (existsSync(defaultEnvPath)) {
      sources.unshift(parseEnvFile(defaultEnvPath))
    }
  }

  return Object.assign({}, ...sources)
}

function validateUrl(value, key) {
  try {
    const url = new URL(value)

    if ((key === 'APP_BASE_URL' || key === 'SUPABASE_URL')
      && url.hostname !== 'localhost'
      && url.protocol !== 'https:') {
      return `${key} must use https outside localhost.`
    }

    return null
  }
  catch {
    return `${key} must be a valid absolute URL.`
  }
}

function validateEnvironment(env) {
  const errors = []
  const warnings = []

  for (const key of REQUIRED_KEYS) {
    if (!env[key]) {
      errors.push(`Missing required variable: ${key}`)
    }
  }

  if (env.ADMIN_PASSWORD_HASH && !/^\$2[aby]\$\d{2}\$/.test(env.ADMIN_PASSWORD_HASH)) {
    errors.push('ADMIN_PASSWORD_HASH must be a bcrypt hash. Generate one with `npm run hash:admin -- "password"`.')
  }

  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET should be at least 32 characters long.')
  }

  if (env.SUPABASE_URL) {
    const urlError = validateUrl(env.SUPABASE_URL, 'SUPABASE_URL')

    if (urlError) {
      errors.push(urlError)
    }
  }

  if (env.APP_BASE_URL) {
    const urlError = validateUrl(env.APP_BASE_URL, 'APP_BASE_URL')

    if (urlError) {
      errors.push(urlError)
    }
  }

  if (!env.GEMINI_MODEL) {
    warnings.push(`GEMINI_MODEL is not set. The app will default to ${OPTIONAL_DEFAULTS.GEMINI_MODEL}.`)
  }

  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10)

  if (nodeMajor !== 24) {
    warnings.push(`Current Node version is ${process.version}; production target is Node 24.x.`)
  }

  return { errors, warnings }
}

function main() {
  const env = readEnvironment()
  const { errors, warnings } = validateEnvironment(env)

  console.log('polarGPT deployment readiness check')
  console.log('')

  if (warnings.length > 0) {
    console.log('Warnings:')

    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }

    console.log('')
  }

  if (errors.length > 0) {
    console.error('Errors:')

    for (const error of errors) {
      console.error(`- ${error}`)
    }

    process.exitCode = 1
    return
  }

  console.log('All required deployment settings are present.')
}

main()
