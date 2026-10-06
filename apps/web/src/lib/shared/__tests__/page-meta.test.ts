import { describe, it, expect } from 'vitest'
import { pageMeta } from '../page-meta'
import { SUPPORTED_LOCALES } from '../i18n'

const DIAFANE_LOCALES = ['en', 'fr', 'de', 'es', 'it', 'nl'] as const

describe('pageMeta', () => {
  it('gives the English texts by default', () => {
    expect(pageMeta().gateTitle('Acme')).toBe('Sign in · Acme')
    expect(pageMeta(null).portalDescription('Acme')).toBe(
      'Share feedback, vote on feature requests, and track the Acme roadmap.'
    )
    expect(pageMeta('en').rootDescription).toBe(
      'Help and ideas for Diafane, the stained glass design software.'
    )
  })

  it.each([
    ['fr', 'Connexion · Acme'],
    ['de', 'Anmelden · Acme'],
    ['es', 'Iniciar sesión · Acme'],
    ['it', 'Accedi · Acme'],
    ['nl', 'Aanmelden · Acme'],
  ] as const)('titles the private-portal sign-in screen in %s', (locale, title) => {
    expect(pageMeta(locale).gateTitle('Acme')).toBe(title)
  })

  it('describes the portal in the language of the visitor, with the workspace name', () => {
    expect(pageMeta('it').portalDescription('Diafane')).toContain('roadmap di Diafane')
    expect(pageMeta('nl').portalDescription('Diafane')).toContain('roadmap van Diafane')
    expect(pageMeta('fr').portalDescription('Diafane')).toContain('feuille de route de Diafane')
  })

  it('reads the English text for the languages without a translation', () => {
    for (const locale of SUPPORTED_LOCALES.filter(
      (l) => !(DIAFANE_LOCALES as readonly string[]).includes(l)
    )) {
      expect(pageMeta(locale).gateTitle('Acme'), locale).toBe('Sign in · Acme')
      expect(pageMeta(locale).rootDescription, locale).toBe(pageMeta('en').rootDescription)
    }
  })

  it('has no em dash and no empty text in any language', () => {
    for (const locale of DIAFANE_LOCALES) {
      const meta = pageMeta(locale)
      for (const text of [meta.rootDescription, meta.gateTitle('X'), meta.portalDescription('X')]) {
        expect(text.trim(), locale).not.toBe('')
        expect(text, locale).not.toContain('—')
      }
    }
  })
})
