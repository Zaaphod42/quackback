import { describe, it, expect } from 'vitest'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/shared/i18n'

// Derive the catalog registry from the JSON files on disk rather than a
// hand-maintained import list — adding a locale is then just dropping its
// `xx.json` next to en.json and adding it to SUPPORTED_LOCALES, with no edit
// here. The `*.json` glob stays one level deep, so it never picks up the
// compiled output. (Eager import is fine: this is test-only and never reaches
// the app bundle, where `loadMessages` keeps catalogs lazily code-split.)
const modules = import.meta.glob('../*.json', { eager: true, import: 'default' })
const catalogs: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(modules).map(([path, catalog]) => [
    /([^/]+)\.json$/.exec(path)?.[1] ?? path,
    catalog as Record<string, string>,
  ])
)

const en = catalogs[DEFAULT_LOCALE]
const enKeys = Object.keys(en)
const enKeySet = new Set(enKeys)
const localesToCheck = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE)

// The languages of the Diafane portal: they must define EVERY key of en.json.
// The other catalogs come from upstream and may lag behind English: a key they
// lack falls back to the English `defaultMessage` by design (see `onIntlError`).
const COMPLETE_LOCALES = ['en', 'fr', 'de', 'es', 'it', 'nl']
const completeLocalesToCheck = localesToCheck.filter((l) => COMPLETE_LOCALES.includes(l))
const laggingLocales = localesToCheck.filter((l) => !COMPLETE_LOCALES.includes(l))
// Number of en.json keys the lagging catalogs do not translate yet (the
// message ids that were added to English for the Diafane languages only).
// It may only go down. A new English key makes it go up: translate it into the
// lagging catalogs, or raise this number on purpose.
const LAGGING_GAP_MAX = 211

// Collect the top-level ICU argument names in a message: `{name}` -> "name",
// `{count, plural, ...}` -> "count". Branch keywords (plural/one/other) and the
// `#` inside a branch are not arguments, so they are intentionally excluded.
function icuArgNames(message: string): Set<string> {
  const names = new Set<string>()
  const re = /\{\s*([a-zA-Z_][\w]*)\b/g
  let match: RegExpExecArray | null
  while ((match = re.exec(message)) !== null) names.add(match[1])
  return names
}

describe('locale catalogs', () => {
  // Catches both a supported locale with no file AND an orphan `xx.json` that
  // was never wired into SUPPORTED_LOCALES (so it would never load at runtime).
  it('has exactly one catalog file per supported locale', () => {
    expect(new Set(Object.keys(catalogs))).toEqual(new Set(SUPPORTED_LOCALES))
  })

  // A key present in en.json but absent from a locale falls back to the English
  // defaultMessage at runtime, surfacing untranslated strings to the user.
  it.each(completeLocalesToCheck)('%s defines every key present in en.json', (locale) => {
    const localeKeys = new Set(Object.keys(catalogs[locale]))
    const missing = enKeys.filter((key) => !localeKeys.has(key))
    expect(missing, `${locale}.json is missing ${missing.length} key(s)`).toEqual([])
  })

  // The lagging catalogs may miss the newest keys, but never more than the
  // known gap: everything else stays translated.
  it.each(laggingLocales)('%s misses at most the known gap of en.json keys', (locale) => {
    const localeKeys = new Set(Object.keys(catalogs[locale]))
    const missing = enKeys.filter((key) => !localeKeys.has(key))
    expect(
      missing.length,
      `${locale}.json misses ${missing.length} key(s), more than the ${LAGGING_GAP_MAX} accepted. ` +
        'Translate the new keys, or raise LAGGING_GAP_MAX on purpose.'
    ).toBeLessThanOrEqual(LAGGING_GAP_MAX)
  })

  // Extra keys are dead weight (and usually a sign a key was renamed in en.json
  // without updating the locale), so keep every catalog in lockstep with en.
  it.each(localesToCheck)('%s defines no keys absent from en.json', (locale) => {
    const extra = Object.keys(catalogs[locale]).filter((key) => !enKeySet.has(key))
    expect(extra, `${locale}.json has ${extra.length} stale key(s)`).toEqual([])
  })

  // A translation that drops, renames, or invents an ICU placeholder either
  // renders a literal `{name}` to the user or throws when react-intl formats
  // the message. Every locale must use exactly the placeholders en.json does.
  it.each(localesToCheck)('%s preserves every ICU placeholder from en.json', (locale) => {
    const catalog = catalogs[locale]
    const mismatches = enKeys
      .filter((key) => key in catalog)
      .map((key) => ({
        key,
        en: [...icuArgNames(en[key])].sort(),
        locale: [...icuArgNames(catalog[key])].sort(),
      }))
      .filter(({ en: a, locale: b }) => a.length !== b.length || a.some((n, i) => n !== b[i]))
    expect(mismatches, `${locale}.json has ${mismatches.length} placeholder mismatch(es)`).toEqual(
      []
    )
  })
})
