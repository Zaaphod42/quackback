import { describe, it, expect, vi, beforeEach } from 'vitest'

const findFirst = vi.fn()
const acceptLanguage = vi.fn()

vi.mock('@/lib/server/db', () => ({
  db: { query: { user: { findFirst: (...a: unknown[]) => findFirst(...a) } } },
  user: { email: 'email' },
  eq: (...a: unknown[]) => a,
}))
vi.mock('@/lib/server/logger', () => ({
  logger: { child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }) },
}))
vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeaders: () => ({ get: () => acceptLanguage() }),
}))

import { emailLocaleFor } from '../email-locale'

beforeEach(() => {
  findFirst.mockReset()
  acceptLanguage.mockReset()
})

describe('emailLocaleFor', () => {
  it('prend la langue enregistrée sur le compte, normalisée', async () => {
    findFirst.mockResolvedValue({ locale: 'fr-FR' })
    expect(await emailLocaleFor('A@b.test')).toBe('fr')
  })

  it('retombe sur l’anglais quand la langue du compte n’est pas prise en charge', async () => {
    findFirst.mockResolvedValue({ locale: 'ja' })
    expect(await emailLocaleFor('a@b.test')).toBe('en')
  })

  it('n’utilise PAS la langue du navigateur de l’expéditeur sans y être invité', async () => {
    findFirst.mockResolvedValue(null)
    acceptLanguage.mockReturnValue('fr-FR,fr;q=0.9')
    expect(await emailLocaleFor('a@b.test')).toBeUndefined()
  })

  it('utilise la langue du navigateur quand le destinataire est la personne connectée', async () => {
    findFirst.mockResolvedValue(null)
    acceptLanguage.mockReturnValue('de-DE,de;q=0.9')
    expect(await emailLocaleFor('a@b.test', { requestFallback: true })).toBe('de')
  })

  it('ne casse pas l’envoi quand la lecture échoue ou que l’adresse manque', async () => {
    findFirst.mockRejectedValue(new Error('db down'))
    expect(await emailLocaleFor('a@b.test')).toBeUndefined()
    expect(await emailLocaleFor(null)).toBeUndefined()
  })
})
