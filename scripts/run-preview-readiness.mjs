#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const steps = [
  {
    label: 'Deployment env validation',
    command: ['npm', 'run', 'deploy:check']
  },
  {
    label: 'Type checking',
    command: ['npm', 'run', 'typecheck']
  },
  {
    label: 'Test suite',
    command: ['npm', 'test']
  },
  {
    label: 'Production build',
    command: ['npm', 'run', 'build']
  }
]

function runStep(step) {
  console.log('')
  console.log(`==> ${step.label}`)
  console.log(`$ ${step.command.join(' ')}`)

  const result = spawnSync(step.command[0], step.command.slice(1), {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function main() {
  console.log('PolarGPT preview readiness check')

  for (const step of steps) {
    runStep(step)
  }

  console.log('')
  console.log('All preview readiness checks passed.')
}

main()
