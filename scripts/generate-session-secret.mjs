#!/usr/bin/env node

import { randomBytes } from 'node:crypto'

/**
 * Generates a strong base64url secret for the signed user session cookie.
 * The output is shell-safe and can be pasted directly into `SESSION_SECRET`.
 */
function main() {
  console.log(randomBytes(48).toString('base64url'))
}

main()
