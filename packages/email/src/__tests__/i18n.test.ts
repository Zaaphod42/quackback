import { describe, it, expect } from 'vitest'
import { render } from '@react-email/components'
import {
  EMAIL_LOCALES,
  EMAIL_MESSAGES,
  normalizeEmailLocale,
  statusLabel,
  t,
  type EmailKey,
} from '../i18n'
import { MagicLinkEmail } from '../templates/magic-link'
import { StatusChangeEmail } from '../templates/status-change'

const en = EMAIL_MESSAGES.en
const keys = Object.keys(en) as EmailKey[]
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('langue des e-mails', () => {
  it('normalise les étiquettes de langue, et retombe sur l’anglais', () => {
    expect(normalizeEmailLocale('fr-FR')).toBe('fr')
    expect(normalizeEmailLocale('IT_it')).toBe('it')
    expect(normalizeEmailLocale('zh-CN')).toBe('en')
    expect(normalizeEmailLocale('ar')).toBe('en')
    expect(normalizeEmailLocale(null)).toBe('en')
    expect(normalizeEmailLocale('')).toBe('en')
  })

  it.each(EMAIL_LOCALES)('%s définit toutes les clés de l’anglais, sans en inventer', (locale) => {
    const table = EMAIL_MESSAGES[locale]
    expect(Object.keys(table).sort()).toEqual([...keys].sort())
    for (const key of keys) expect(table[key].trim(), `${locale} ${key}`).not.toBe('')
  })

  it.each(EMAIL_LOCALES)('%s garde exactement les variables de l’anglais', (locale) => {
    const table = EMAIL_MESSAGES[locale]
    const bad = keys.filter(
      (key) => placeholders(table[key]).join() !== placeholders(en[key]).join()
    )
    expect(bad, `${locale} : variables différentes`).toEqual([])
  })

  it.each(EMAIL_LOCALES)('%s garde le gras ** des phrases qui en portent', (locale) => {
    const table = EMAIL_MESSAGES[locale]
    for (const key of keys) {
      expect((table[key].match(/\*\*/g) ?? []).length, `${locale} ${key}`).toBe(
        (en[key].match(/\*\*/g) ?? []).length
      )
    }
  })

  it('remplace les variables et prend l’anglais pour une langue inconnue', () => {
    expect(t('fr', 'welcome.subject', { workspace: 'Diafane' })).toBe('Bienvenue dans Diafane !')
    expect(t('ja', 'welcome.subject', { workspace: 'Diafane' })).toBe('Welcome to Diafane!')
    expect(t(undefined, 'magicLink.button')).toBe('Sign in')
  })

  it('traduit les statuts connus et laisse un statut inconnu lisible', () => {
    expect(statusLabel('fr', 'in_progress')).toBe('En cours')
    expect(statusLabel('de', 'Under Review')).toBe('In Prüfung')
    expect(statusLabel('fr', 'waiting_for_legal')).toBe('Waiting For Legal')
  })

  it('rend un e-mail dans la langue du destinataire', async () => {
    const html = await render(
      MagicLinkEmail({ signInUrl: 'https://x.test/a', code: '123456', locale: 'fr' })
    )
    expect(html).toContain('Connexion à Diafane')
    expect(html).toContain('Se connecter')
    expect(html).not.toContain('Sign in to Diafane')
  })

  it('rend le changement de statut en italien, statuts traduits', async () => {
    const html = await render(
      StatusChangeEmail({
        postTitle: 'Export DXF',
        postUrl: 'https://x.test/p',
        previousStatus: 'open',
        newStatus: 'planned',
        organizationName: 'Diafane',
        unsubscribeUrl: 'https://x.test/u',
        locale: 'it',
      })
    )
    expect(html).toContain('Pianificata')
    expect(html).toContain('Aperta')
    expect(html).toContain('Annulla l’iscrizione')
  })
})
