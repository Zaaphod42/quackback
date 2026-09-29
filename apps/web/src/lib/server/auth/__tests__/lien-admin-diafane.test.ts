/**
 * Le lien d'administration demandé par Diafane (PLAN #651) : il n'ouvre QUE le
 * compte nommé par la configuration, et seulement s'il est administrateur.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(),
  mintMagicLinkUrl: vi.fn(),
  findUser: vi.fn(),
  findPrincipal: vi.fn(),
}))

vi.mock('@/lib/server/audit/log', () => ({ recordAuditEvent: hoisted.recordAuditEvent }))
vi.mock('@/lib/server/auth/magic-link-mint', () => ({ mintMagicLinkUrl: hoisted.mintMagicLinkUrl }))
vi.mock('@/lib/server/db', () => ({
  db: {
    query: {
      user: { findFirst: hoisted.findUser },
      principal: { findFirst: hoisted.findPrincipal },
    },
  },
  user: { id: 'user.id', email: 'user.email' },
  principal: { userId: 'principal.userId', role: 'principal.role' },
  eq: vi.fn((col: unknown, val: unknown) => ({ op: 'eq', col, val })),
  sql: vi.fn((_s: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', values })),
}))

const { fabriquerLienAdmin, DUREE_LIEN_ADMIN_SECONDES } = await import('../lien-admin-diafane')

const PORTAIL = 'https://feedback.example.com'

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.findUser.mockResolvedValue({ id: 'user_1', email: 'hello@example.com' })
  hoisted.findPrincipal.mockResolvedValue({ role: 'admin' })
  hoisted.mintMagicLinkUrl.mockResolvedValue({
    url: `${PORTAIL}/verify-magic-link?token=t`,
    token: 't',
  })
})

describe('fabriquerLienAdmin', () => {
  it('rend un lien d’une minute vers l’administration, pour le compte configuré', async () => {
    const r = await fabriquerLienAdmin({ email: ' Hello@Example.com ', portalUrl: PORTAIL })
    expect(r).toEqual({ ok: true, url: `${PORTAIL}/verify-magic-link?token=t` })
    expect(hoisted.mintMagicLinkUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'hello@example.com',
        callbackPath: '/admin',
        portalUrl: PORTAIL,
        expiresInSeconds: DUREE_LIEN_ADMIN_SECONDES,
      })
    )
    expect(DUREE_LIEN_ADMIN_SECONDES).toBeLessThanOrEqual(60)
    expect(hoisted.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.diafane_admin_link.minted', outcome: 'success' })
    )
  })

  it('n’existe pas tant que l’adresse n’est pas configurée', async () => {
    const r = await fabriquerLienAdmin({ email: undefined, portalUrl: PORTAIL })
    expect(r).toEqual({ ok: false, statut: 404, erreur: 'not_configured' })
    expect(hoisted.mintMagicLinkUrl).not.toHaveBeenCalled()
  })

  it('refuse un compte qui n’est pas administrateur du portail', async () => {
    hoisted.findPrincipal.mockResolvedValue({ role: 'user' })
    const r = await fabriquerLienAdmin({ email: 'hello@example.com', portalUrl: PORTAIL })
    expect(r).toEqual({ ok: false, statut: 403, erreur: 'not_admin' })
    expect(hoisted.mintMagicLinkUrl).not.toHaveBeenCalled()
    expect(hoisted.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'failure' })
    )
  })

  it('refuse une adresse sans compte, sans en créer un', async () => {
    hoisted.findUser.mockResolvedValue(null)
    const r = await fabriquerLienAdmin({ email: 'inconnu@example.com', portalUrl: PORTAIL })
    expect(r).toEqual({ ok: false, statut: 403, erreur: 'not_admin' })
    expect(hoisted.mintMagicLinkUrl).not.toHaveBeenCalled()
  })
})
