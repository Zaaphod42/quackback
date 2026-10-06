import { describe, it, expect } from 'vitest'
import { createIntl, createIntlCache } from 'react-intl'
import en from '../en.json'
import it_ from '../it.json'
import nl from '../nl.json'
import { SUPPORTED_LOCALES } from '@/lib/shared/i18n'

/**
 * Validation of the Italian and Dutch catalogs, on top of the generic parity
 * test in `locale-parity.test.ts` (which covers every supported locale for keys
 * and placeholder names). This file adds what only matters for catalogs written
 * by hand from the English one:
 *
 *  - the key set is IDENTICAL to en.json (nothing missing, nothing stale);
 *  - every message is valid ICU and formats through react-intl, singular AND
 *    plural, without an error or a stray brace (an apostrophe glued to `{` is
 *    the classic way to break a message silently);
 *  - the placeholders (including the plural arguments) are the English ones;
 *  - nothing was left in English (a copy of the English text is only accepted
 *    for short product words such as "Feedback" or "Roadmap");
 *  - the register chosen for each language holds: no "tu/tuo/Lei" in Italian,
 *    no "je/jij/jouw" in Dutch, and no em dash anywhere.
 */

type Catalog = Record<string, string>

const CATALOGS: Record<'it' | 'nl', Catalog> = { it: it_, nl }
const EN = en as Catalog
const EN_KEYS = Object.keys(EN)

// Top-level ICU argument names: `{name}` -> "name", `{count, plural, ...}` ->
// "count". Branch keywords (one/other) and `#` are not arguments.
function icuArgNames(message: string): string[] {
  const names = new Set<string>()
  const re = /\{\s*([a-zA-Z_]\w*)\b/g
  let match: RegExpExecArray | null
  while ((match = re.exec(message)) !== null) names.add(match[1])
  // Branch selectors inside a plural (`one {`, `other {`) look like arguments
  // to the regex above: drop the ICU keywords.
  for (const keyword of ['one', 'other', 'zero', 'two', 'few', 'many']) names.delete(keyword)
  return [...names].sort()
}

// A short, product-level word may stay identical to English in a translation
// ("Feedback", "Team", "Roadmap", "Admin", "Home", "Tag"...).
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const SAMPLE_VALUES = (names: string[], count: number) =>
  Object.fromEntries(
    names.map((name) => [name, name === 'count' || name === 'seconds' ? count : `‹${name}›`])
  )

describe.each(['it', 'nl'] as const)('%s catalog', (locale) => {
  const catalog = CATALOGS[locale]

  it('is registered in the supported locales', () => {
    expect(SUPPORTED_LOCALES).toContain(locale)
  })

  it('has exactly the same keys as en.json', () => {
    const keys = Object.keys(catalog)
    expect(
      EN_KEYS.filter((k) => !(k in catalog)),
      'missing keys'
    ).toEqual([])
    expect(
      keys.filter((k) => !(k in EN)),
      'stale keys'
    ).toEqual([])
    expect(keys.length).toBe(EN_KEYS.length)
  })

  it('has no empty or non-string value', () => {
    const bad = Object.entries(catalog).filter(
      ([, value]) => typeof value !== 'string' || value.trim() === ''
    )
    expect(bad).toEqual([])
  })

  it('uses exactly the placeholders of the English message', () => {
    const mismatches = EN_KEYS.map((key) => ({
      key,
      en: icuArgNames(EN[key]),
      locale: icuArgNames(catalog[key]),
    })).filter(({ en: a, locale: b }) => a.join('|') !== b.join('|'))
    expect(mismatches).toEqual([])
  })

  it('keeps the plural structure of the English message', () => {
    const plural = EN_KEYS.filter((key) => EN[key].includes(', plural,'))
    expect(plural.length).toBeGreaterThan(0)
    for (const key of plural) {
      expect(catalog[key], key).toMatch(
        /\{count, plural, one \{[^}]*#[^}]*\} other \{[^}]*#[^}]*\}\}/
      )
    }
  })

  it('formats every message through react-intl without error or stray brace', () => {
    const errors: string[] = []
    const intl = createIntl(
      { locale, messages: catalog, onError: (e) => errors.push(`${e.code}: ${e.message}`) },
      createIntlCache()
    )
    for (const key of EN_KEYS) {
      for (const count of [1, 3]) {
        const out = intl.formatMessage(
          { id: key, defaultMessage: EN[key] },
          SAMPLE_VALUES(icuArgNames(catalog[key]), count)
        )
        expect(typeof out, key).toBe('string')
        expect(out.trim(), key).not.toBe('')
        expect(out, `${key} leaves a raw brace`).not.toMatch(/[{}]/)
      }
    }
    expect(errors).toEqual([])
  })

  it('leaves no long message in English', () => {
    const untranslated = EN_KEYS.filter((key) => catalog[key] === EN[key] && wordCount(EN[key]) > 2)
    expect(untranslated).toEqual([])
  })

  it('has no em dash', () => {
    expect(EN_KEYS.filter((key) => catalog[key].includes('—'))).toEqual([])
  })

  it('keeps leading and trailing spaces where English has them', () => {
    // `portal.auth.invite.invitedBy` is appended to another sentence.
    for (const key of EN_KEYS) {
      expect(catalog[key].startsWith(' '), key).toBe(EN[key].startsWith(' '))
      expect(catalog[key].endsWith(' '), key).toBe(EN[key].endsWith(' '))
    }
  })
})

describe('Italian register', () => {
  // The interface never says "tu" and never uses the courtesy "Lei": buttons
  // are imperatives without possessive, sentences are impersonal.
  const FORBIDDEN = /\b(tu|tuo|tua|tuoi|tue|ti|te|Lei|hai|puoi|vuoi|devi|sei)\b/i

  it('never addresses the user in the second person or with the courtesy form', () => {
    const offenders = EN_KEYS.filter((key) => FORBIDDEN.test(CATALOGS.it[key]))
    expect(offenders.map((key) => `${key}: ${CATALOGS.it[key]}`)).toEqual([])
  })

  it('writes the main buttons as bare imperatives', () => {
    const it = CATALOGS.it
    expect(it['portal.header.auth.logIn']).toBe('Accedi')
    expect(it['portal.header.auth.signOut']).toBe('Esci')
    expect(it['portal.postDetail.edit.save']).toBe('Salva')
    expect(it['portal.feedback.header.submit']).toBe('Invia')
    expect(it['widget.home.form.cancel']).toBe('Annulla')
  })
})

describe('Dutch register', () => {
  // "u/uw" only: never "je/jij/jouw".
  const FORBIDDEN = /\b(je|jij|jouw|jou|jullie|jouwe)\b/i

  it('never uses the informal second person', () => {
    const offenders = EN_KEYS.filter((key) => FORBIDDEN.test(CATALOGS.nl[key]))
    expect(offenders.map((key) => `${key}: ${CATALOGS.nl[key]}`)).toEqual([])
  })

  it('writes the main buttons as plain infinitives', () => {
    const nlCatalog = CATALOGS.nl
    expect(nlCatalog['portal.header.auth.logIn']).toBe('Aanmelden')
    expect(nlCatalog['portal.header.auth.signOut']).toBe('Afmelden')
    expect(nlCatalog['portal.postDetail.edit.save']).toBe('Opslaan')
    expect(nlCatalog['portal.feedback.header.submit']).toBe('Verzenden')
    expect(nlCatalog['widget.home.form.cancel']).toBe('Annuleren')
  })
})

describe('Diafane additions to the portal', () => {
  // The keys the fork added for the Diafane header, the support tab and the
  // error pages must be translated, not copied from English.
  const KEYS = [
    'portal.header.nav.guides',
    'portal.header.surface',
    'portal.header.diafane.app',
    'portal.header.diafane.discover',
    'portal.support.subtitle',
    'portal.errorPage.notFound.lead',
    'portal.errorPage.links.guides',
    'portal.errorPage.links.contact',
  ]

  it.each(['it', 'nl'] as const)('%s translates them', (locale) => {
    for (const key of KEYS) expect(CATALOGS[locale][key], key).not.toBe(EN[key])
  })

  it('uses the words of the Diafane application itself', () => {
    expect(CATALOGS.it['portal.header.surface']).toBe('Aiuto e idee')
    expect(CATALOGS.nl['portal.header.surface']).toBe('Hulp en ideeën')
    expect(CATALOGS.it['portal.header.nav.guides']).toBe('Guide')
    expect(CATALOGS.nl['portal.header.nav.guides']).toBe('Handleidingen')
  })
})
