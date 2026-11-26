import { describe, it, expect } from 'vitest'
import { documentLocale, htmlLangDir } from '../document-locale'

// The argument is the matched route-id chain (root -> leaf), as exposed by
// useRouterState's `matches`.
describe('documentLocale', () => {
  it('localizes any page under the portal layout', () => {
    expect(documentLocale(['__root__', '/_portal', '/_portal/'], 'it')).toBe('it')
    expect(documentLocale(['__root__', '/_portal', '/_portal/hc'], 'it')).toBe('it')
    expect(documentLocale(['__root__', '/_portal', '/_portal/roadmap/'], 'nl')).toBe('nl')
  })
  it('localizes the standalone auth and widget routes', () => {
    expect(documentLocale(['__root__', '/auth/reset-password'], 'it')).toBe('it')
    expect(documentLocale(['__root__', '/widget'], 'de')).toBe('de')
  })
  it('localizes the sign-in hand-off, sign-in completion, unsubscribe and invite pages', () => {
    expect(documentLocale(['__root__', '/auth/widget-handoff'], 'nl')).toBe('nl')
    expect(documentLocale(['__root__', '/auth/auth-complete'], 'it')).toBe('it')
    expect(documentLocale(['__root__', '/unsubscribe'], 'de')).toBe('de')
    expect(documentLocale(['__root__', '/portal-invite/$inviteId'], 'it')).toBe('it')
  })
  it('keeps untranslated auth utility pages on the default locale', () => {
    // These render hard-coded English with no IntlProvider — labeling them
    // `lang="ar" dir="rtl"` would misstate the language and flip the layout.
    expect(documentLocale(['__root__', '/auth/login'], 'de')).toBe('en')
    expect(documentLocale(['__root__', '/auth/signup'], 'it')).toBe('en')
    expect(documentLocale(['__root__', '/auth/two-factor'], 'de')).toBe('en')
  })
  it('keeps the admin app (incl. its English-first login) and system routes on the default', () => {
    // /admin/login renders an English heading + email stage on first paint, so
    // it stays English until that copy is localized.
    expect(documentLocale(['__root__', '/admin/login'], 'de')).toBe('en')
    expect(documentLocale(['__root__', '/admin/posts'], 'it')).toBe('en')
    expect(documentLocale(['__root__', '/onboarding'], 'de')).toBe('en')
    expect(documentLocale(['__root__', '/apps'], 'it')).toBe('en')
    expect(documentLocale(['__root__', '/verify-magic-link'], 'it')).toBe('en')
    expect(documentLocale(['__root__', '/complete-signup/$id'], 'it')).toBe('en')
  })
})

describe('htmlLangDir', () => {
  it('emits a canonical BCP-47 lang', () => {
    expect(htmlLangDir('en').lang).toBe('en')
    expect(htmlLangDir('it').lang).toBe('it')
    expect(htmlLangDir('nl').lang).toBe('nl')
  })
  it('sets dir from the locale', () => {
    expect(htmlLangDir('en').dir).toBe('ltr')
    expect(htmlLangDir('fr').dir).toBe('ltr')
    expect(htmlLangDir('de').dir).toBe('ltr')
  })
})
