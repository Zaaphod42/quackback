import { describe, it, expect } from 'vitest'
import { createIntl, createIntlCache } from 'react-intl'
import en from '../en.json'
import fr from '../fr.json'
import de from '../de.json'
import es from '../es.json'
import it_ from '../it.json'
import nl from '../nl.json'
import { SUPPORTED_LOCALES } from '@/lib/shared/i18n'

/**
 * Validation of the six languages of the Diafane portal (en, fr, de, es, it,
 * nl), on top of the generic parity test in `locale-parity.test.ts`. The other
 * catalogs come from upstream and may lag behind English; these six are
 * written for Diafane and must be COMPLETE and well formed:
 *
 *  - the key set is IDENTICAL to en.json (nothing missing, nothing stale);
 *  - every message is valid ICU and formats through react-intl, singular AND
 *    plural, without an error or a stray brace (an apostrophe glued to `{` is
 *    the classic way to break a message silently);
 *  - the placeholders (including the plural arguments) are the English ones;
 *  - nothing was left in English (a copy of the English text is only accepted
 *    for short product words such as "Feedback" or "Roadmap");
 *  - the register chosen for each language holds: spacing of the French
 *    punctuation, no "tu" in French or "du" in German, no "tu/tuo/Lei" in
 *    Italian, no "je/jij/jouw" in Dutch, and no em dash anywhere.
 */

type Catalog = Record<string, string>

const CATALOGS = { fr, de, es, it: it_, nl } as Record<'fr' | 'de' | 'es' | 'it' | 'nl', Catalog>
const LOCALES = Object.keys(CATALOGS) as Array<keyof typeof CATALOGS>
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

// Whole-word match that understands accented letters (the plain \b of
// JavaScript treats "Ê" as a non-letter, so "Êtes" would match "tes").
function hasWord(text: string, words: string[]): boolean {
  const alternatives = words.map((w) => w.replace(/'/g, "['’]")).join('|')
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternatives})(?![\\p{L}\\p{N}_])`, 'iu').test(text)
}

const SAMPLE_VALUES = (names: string[], count: number) =>
  Object.fromEntries(
    names.map((name) => [name, name === 'count' || name === 'seconds' ? count : `‹${name}›`])
  )

describe.each(LOCALES)('%s catalog', (locale) => {
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

describe('English catalog', () => {
  it('has no em dash', () => {
    expect(EN_KEYS.filter((key) => EN[key].includes('—'))).toEqual([])
  })
})

describe('French register and typography', () => {
  const NBSP = ' '

  // Espace insécable avant « : ; ! ? » et à l'intérieur des guillemets français.
  it('puts a no-break space before : ; ! ? and inside guillemets', () => {
    const offenders = EN_KEYS.filter((key) => {
      const value = fr[key as keyof typeof fr] as string
      return /\S [?!:;]/.test(value) || /« | »/.test(value)
    })
    expect(offenders.map((key) => `${key}: ${JSON.stringify(fr[key as keyof typeof fr])}`)).toEqual(
      []
    )
  })

  it('actually uses the no-break space where the punctuation requires it', () => {
    expect(fr['widget.launcher.subtitle']).toBe(`Comment pouvons-nous vous aider${NBSP}?`)
    expect(fr['widget.chat.csat.thanks']).toBe(`Merci pour votre feedback${NBSP}!`)
    expect(fr['portal.postDetail.deleteDialog.description']).toContain(`«${NBSP}{title}${NBSP}»`)
  })

  it('addresses the user with "vous", never "tu"', () => {
    const offenders = EN_KEYS.filter((key) =>
      hasWord(fr[key as keyof typeof fr] as string, ['tu', 'ton', 'ta', 'tes', 'toi', "t'"])
    )
    expect(offenders).toEqual([])
  })
})

describe('German register', () => {
  it('addresses the user with "Sie", never "du"', () => {
    const offenders = EN_KEYS.filter((key) =>
      hasWord(de[key as keyof typeof de] as string, [
        'du',
        'dein',
        'deine',
        'deinen',
        'deinem',
        'deiner',
        'dir',
        'dich',
      ])
    )
    expect(offenders).toEqual([])
  })
})

describe('Spanish register', () => {
  // Diafane writes to its Spanish users with "usted", everywhere: no "tú", no
  // informal imperative ("Inicia", "Escribe", "Introduce"...), no "tu/tus".
  const INFORMAL = [
    'tú',
    'tu',
    'tus',
    'ti',
    'te',
    'tienes',
    'puedes',
    'quieres',
    'eres',
    'estás',
    'has',
    'inicia',
    'escribe',
    'introduce',
    'crea',
    'elige',
    'selecciona',
    'prueba',
    'busca',
    'vuelve',
    'comparte',
    'añade',
    'usa',
    'pide',
    'revisa',
    'restablece',
    'establece',
    'mantente',
    'personaliza',
    'gestiona',
    'consulta',
    'encuentra',
    'recibe',
    'continúa',
    'envíanos',
    'escríbenos',
    'inténtalo',
    'sé',
    'vota',
    'deja',
    'cierra',
    'regístrate',
    'suscríbete',
    'guarda',
    'verifica',
    'confirma',
  ]
  // Words that are the same in both registers when they are not an order:
  // "{workspace} usa el inicio de sesión único" (it uses), "no se encuentra".
  const THIRD_PERSON: Record<string, string[]> = {
    'portal.auth.sso.usesSSONamed': ['usa'],
    'portal.auth.sso.usesSSO': ['usa'],
    'portal.errorPage.notFound.titleGold': ['encuentra'],
  }

  it('never uses "tú" or the informal imperative', () => {
    const offenders = EN_KEYS.filter((key) => {
      const words = INFORMAL.filter((w) => !THIRD_PERSON[key]?.includes(w))
      return hasWord(es[key as keyof typeof es] as string, words)
    })
    expect(offenders.map((key) => `${key}: ${es[key as keyof typeof es]}`)).toEqual([])
  })

  it('does not attach "te", "nos" or "me" to an informal imperative', () => {
    // "Escríbenos", "Envíanos", "Inténtalo": the usted forms are "Escríbanos"...
    const offenders = EN_KEYS.filter((key) =>
      /\b(\p{L}*(?:ábelo|íbenos|íanos|éntalo|éntanos|ánate|íbete))\b/iu.test(
        es[key as keyof typeof es] as string
      )
    )
    expect(offenders).toEqual([])
  })

  it('writes the main sentences with "usted"', () => {
    expect(es['widget.launcher.subtitle']).toBe('¿En qué podemos ayudarle?')
    expect(es['portal.auth.forgot.title']).toBe('Restablezca su contraseña')
    expect(es['portal.support.signIn.title']).toBe('Inicie sesión para ver sus conversaciones')
    expect(es['widget.chat.startPrompt']).toBe('Envíenos un mensaje y le responderemos.')
  })
})

describe('Italian register', () => {
  // The interface never says "tu" and never uses the courtesy "Lei": buttons
  // are imperatives without possessive, sentences are impersonal.
  const FORBIDDEN = [
    'tu',
    'tuo',
    'tua',
    'tuoi',
    'tue',
    'ti',
    'te',
    'Lei',
    'hai',
    'puoi',
    'vuoi',
    'devi',
    'sei',
  ]

  it('never addresses the user in the second person or with the courtesy form', () => {
    const offenders = EN_KEYS.filter((key) => hasWord(CATALOGS.it[key], FORBIDDEN))
    expect(offenders.map((key) => `${key}: ${CATALOGS.it[key]}`)).toEqual([])
  })

  it('writes the main buttons as bare imperatives', () => {
    const it = CATALOGS.it
    expect(it['portal.header.auth.logIn']).toBe('Accedi')
    expect(it['portal.header.auth.signOut']).toBe('Esci')
    expect(it['portal.postDetail.edit.save']).toBe('Salva')
    expect(it['portal.feedback.header.submit']).toBe('Invia')
    expect(it['widget.home.form.cancel']).toBe('Annulla')
    expect(it['widget.chat.send']).toBe('Invia')
  })
})

describe('Dutch register', () => {
  // "u/uw" only: never "je/jij/jouw".
  const FORBIDDEN = ['je', 'jij', 'jouw', 'jou', 'jullie', 'jouwe']

  it('never uses the informal second person', () => {
    const offenders = EN_KEYS.filter((key) => hasWord(CATALOGS.nl[key], FORBIDDEN))
    expect(offenders.map((key) => `${key}: ${CATALOGS.nl[key]}`)).toEqual([])
  })

  it('writes the main buttons as plain infinitives', () => {
    const nlCatalog = CATALOGS.nl
    expect(nlCatalog['portal.header.auth.logIn']).toBe('Aanmelden')
    expect(nlCatalog['portal.header.auth.signOut']).toBe('Afmelden')
    expect(nlCatalog['portal.postDetail.edit.save']).toBe('Opslaan')
    expect(nlCatalog['portal.feedback.header.submit']).toBe('Verzenden')
    expect(nlCatalog['widget.home.form.cancel']).toBe('Annuleren')
    expect(nlCatalog['widget.chat.send']).toBe('Verzenden')
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

  // "Guides" is also the French word: it stays identical there.
  const SAME_AS_ENGLISH: Partial<Record<(typeof LOCALES)[number], string[]>> = {
    fr: ['portal.header.nav.guides'],
  }

  it.each(LOCALES)('%s translates them', (locale) => {
    for (const key of KEYS) {
      if (SAME_AS_ENGLISH[locale]?.includes(key)) continue
      expect(CATALOGS[locale][key], key).not.toBe(EN[key])
    }
  })

  it('uses the words of the Diafane application itself', () => {
    expect(CATALOGS.it['portal.header.surface']).toBe('Aiuto e idee')
    expect(CATALOGS.nl['portal.header.surface']).toBe('Hulp en ideeën')
    expect(CATALOGS.it['portal.header.nav.guides']).toBe('Guide')
    expect(CATALOGS.nl['portal.header.nav.guides']).toBe('Handleidingen')
  })
})
