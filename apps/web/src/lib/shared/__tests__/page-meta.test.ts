import { describe, it, expect } from 'vitest'
import { pageMeta, matchLocale } from '../page-meta'
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

describe('pageMeta: ideas list, roadmap and idea pages', () => {
  it('titles the ideas list and describes it in the visitor language', () => {
    expect(pageMeta('en').feedbackTitle('Diafane')).toBe('Feedback - Diafane')
    expect(pageMeta('nl').feedbackDescription('Diafane')).toContain(
      'functieverzoeken in voor Diafane'
    )
    expect(pageMeta('it').feedbackDescription('Diafane')).toContain('funzioni per Diafane')
    expect(pageMeta('fr').feedbackDescription('Diafane')).toContain(
      'Proposez des fonctionnalités pour Diafane'
    )
  })

  it('titles and describes the roadmap', () => {
    expect(pageMeta('en').roadmapTitle('Diafane')).toBe('Roadmap - Diafane')
    expect(pageMeta('fr').roadmapTitle('Diafane')).toBe('Feuille de route - Diafane')
    expect(pageMeta('es').roadmapDescription('Diafane')).toContain('en qué está trabajando Diafane')
  })

  it('describes an idea with its title and its category', () => {
    expect(pageMeta('en').postDescription('More colors', 'Ideas')).toBe(
      'More colors. Vote and comment on this Ideas post.'
    )
    expect(pageMeta('it').postDescription('Più colori', 'Idee')).toBe(
      'Più colori. Votare e commentare questo post di Idee.'
    )
    expect(pageMeta('nl').postDescription('Meer kleuren', 'Ideeën')).toContain('Meer kleuren.')
  })

  it('has every text in every Diafane language, without an em dash', () => {
    for (const locale of DIAFANE_LOCALES) {
      const meta = pageMeta(locale)
      for (const text of [
        meta.feedbackTitle('X'),
        meta.feedbackDescription('X'),
        meta.roadmapTitle('X'),
        meta.roadmapDescription('X'),
        meta.postDescription('T', 'B'),
      ]) {
        expect(text.trim(), locale).not.toBe('')
        expect(text, locale).not.toContain('\u2014')
      }
    }
  })
})

describe('matchLocale', () => {
  it('reads the locale that the root route put in the router context', () => {
    expect(matchLocale({ context: { acceptLanguageLocale: 'it' } })).toBe('it')
  })

  it('returns undefined when there is nothing to read', () => {
    expect(matchLocale(undefined)).toBeUndefined()
    expect(matchLocale(null)).toBeUndefined()
    expect(matchLocale({})).toBeUndefined()
    expect(matchLocale({ context: {} })).toBeUndefined()
  })
})
