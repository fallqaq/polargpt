import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const shellToolbarPath = resolve(process.cwd(), 'app/components/ShellToolbar.vue')
const shellToolbarSource = readFileSync(shellToolbarPath, 'utf8')

describe('ShellToolbar regression', () => {
  it('keeps the account menu visible outside the toolbar panel bounds', () => {
    expect(shellToolbarSource).toMatch(/\.toolbar\s*\{[\s\S]*overflow:\s*visible;/)
    expect(shellToolbarSource).toMatch(/\.toolbar__menu\s*\{[\s\S]*z-index:\s*3;/)
  })

  it('keeps the account menu accessible from keyboard and assistive tech', () => {
    expect(shellToolbarSource).toContain('aria-haspopup="menu"')
    expect(shellToolbarSource).toContain('@keydown.esc.stop.prevent="closeMenu"')
  })
})
