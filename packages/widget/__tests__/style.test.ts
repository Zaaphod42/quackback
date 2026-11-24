// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest'
import { ensureStyles, removeStyles } from '../src/core/style'

afterEach(() => removeStyles())

describe('widget styles', () => {
  // Sur un telephone le panneau occupe tout l'ecran. `100vh` est la GRANDE fenetre de Safari : les boutons du bas
  // du panneau passaient sous la barre d'outils. `100dvh` est la zone reellement visible, `100vh` reste le repli.
  it('le panneau mobile suit la zone visible (100dvh), avec 100vh en repli', () => {
    ensureStyles('right')
    const css = document.getElementById('quackback-widget-styles')?.textContent ?? ''
    const mobile = css.slice(css.indexOf('@media(max-width:639px)'))
    expect(mobile).toContain('height:100vh;height:100dvh;')
    expect(mobile.indexOf('height:100vh')).toBeLessThan(mobile.indexOf('height:100dvh'))
  })
})
