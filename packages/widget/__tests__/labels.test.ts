// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { widgetLabels } from '../src/core/labels'
import { createSDK } from '../src/core/sdk'

const ORIGIN = 'https://feedback.acme.com'

function setBrowserLanguages(languages: string[]) {
  Object.defineProperty(navigator, 'languages', { value: languages, configurable: true })
  Object.defineProperty(navigator, 'language', { value: languages[0], configurable: true })
}

describe('widgetLabels', () => {
  afterEach(() => setBrowserLanguages(['en-US']))

  it('returns English by default and for unsupported languages', () => {
    setBrowserLanguages(['en-US'])
    expect(widgetLabels().open).toBe('Open feedback widget')
    expect(widgetLabels().close).toBe('Close feedback widget')
    expect(widgetLabels().frame).toBe('Feedback Widget')
    expect(widgetLabels('ja').open).toBe('Open feedback widget')
    expect(widgetLabels('zh-CN').frame).toBe('Feedback Widget')
  })

  it.each([
    ['fr', 'Ouvrir le widget de feedback', 'Fermer le widget de feedback', 'Widget de feedback'],
    ['de', 'Feedback-Widget öffnen', 'Feedback-Widget schließen', 'Feedback-Widget'],
    ['es', 'Abrir widget de feedback', 'Cerrar widget de feedback', 'Widget de feedback'],
    ['it', 'Apri il widget di feedback', 'Chiudi il widget di feedback', 'Widget di feedback'],
    ['nl', 'Feedbackwidget openen', 'Feedbackwidget sluiten', 'Feedbackwidget'],
  ])('translates the labels for %s', (locale, open, close, frame) => {
    expect(widgetLabels(locale)).toEqual({ open, close, frame })
  })

  it('ignores the region and the case of the locale', () => {
    expect(widgetLabels('nl-BE').open).toBe('Feedbackwidget openen')
    expect(widgetLabels('IT-it').open).toBe('Apri il widget di feedback')
    expect(widgetLabels('fr_CA').close).toBe('Fermer le widget de feedback')
  })

  it('falls back to the browser language when no locale is given', () => {
    setBrowserLanguages(['it-IT', 'en'])
    expect(widgetLabels().open).toBe('Apri il widget di feedback')
  })

  it('lets an explicit locale win over the browser language', () => {
    setBrowserLanguages(['it-IT'])
    expect(widgetLabels('nl').open).toBe('Feedbackwidget openen')
  })
})

describe('sdk labels', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ theme: {} }) }))
    )
  })
  afterEach(() => {
    vi.restoreAllMocks()
    setBrowserLanguages(['en-US'])
  })

  it('names the launcher and the iframe in the init locale', () => {
    const sdk = createSDK()
    sdk.dispatch('init', { instanceUrl: ORIGIN, locale: 'nl' })
    expect(document.querySelector('button[aria-label="Feedbackwidget openen"]')).not.toBeNull()
    expect(document.querySelector('iframe[title="Feedbackwidget"]')).not.toBeNull()
  })

  it('switches the launcher name when the panel opens and closes', () => {
    const sdk = createSDK()
    sdk.dispatch('init', { instanceUrl: ORIGIN, locale: 'it' })
    const btn = document.querySelector('button') as HTMLButtonElement
    expect(btn.getAttribute('aria-label')).toBe('Apri il widget di feedback')
    sdk.dispatch('open')
    expect(btn.getAttribute('aria-label')).toBe('Chiudi il widget di feedback')
    sdk.dispatch('close')
    expect(btn.getAttribute('aria-label')).toBe('Apri il widget di feedback')
  })

  it('uses the browser language when no locale is given', () => {
    setBrowserLanguages(['fr-FR'])
    const sdk = createSDK()
    sdk.dispatch('init', { instanceUrl: ORIGIN })
    expect(
      document.querySelector('button[aria-label="Ouvrir le widget de feedback"]')
    ).not.toBeNull()
    expect(document.querySelector('iframe[title="Widget de feedback"]')).not.toBeNull()
  })
})
