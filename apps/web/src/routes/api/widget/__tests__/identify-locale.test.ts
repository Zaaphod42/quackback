/**
 * La LANGUE du compte Diafane (claim `locale` du jeton signé) devient `user.locale`, la langue des e-mails.
 * Seul le jeton VERIFIE la porte : un corps non verifie ne peut pas poser la langue d'un compte.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUserFindFirst = vi.fn()
const mockPrincipalFindFirst = vi.fn()
const mockSessionFindFirst = vi.fn()
const insertValues = vi.fn()
const updateSet = vi.fn()
const mockVerifyJWT = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (opts: unknown) => ({ options: opts })),
}))

vi.mock('@/lib/server/db', () => ({
  db: {
    query: {
      user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
      session: { findFirst: (...args: unknown[]) => mockSessionFindFirst(...args) },
      principal: { findFirst: (...args: unknown[]) => mockPrincipalFindFirst(...args) },
      segments: { findFirst: vi.fn() },
    },
    insert: () => ({
      values: (v: unknown) => {
        insertValues(v)
        return {
          returning: async () => [{ id: 'inserted' }],
          onConflictDoUpdate: async () => undefined,
        }
      },
    }),
    update: () => ({
      set: (s: unknown) => {
        updateSet(s)
        return { where: async () => undefined }
      },
    }),
  },
  user: { externalId: 'external_id' },
  session: {},
  principal: {},
  segments: {},
  widgetIdentifiedSession: { sessionId: 'session_id' },
  eq: vi.fn(),
  and: vi.fn(),
  gt: vi.fn(),
  isNull: vi.fn(),
  sql: vi.fn((parts: TemplateStringsArray) => parts.raw[0]),
}))

vi.mock('@/lib/server/domains/settings/settings.widget', () => ({
  getWidgetConfig: vi.fn(async () => ({ enabled: true, identifyVerification: false })),
  getWidgetSecret: vi.fn(async () => 'secret'),
}))

vi.mock('@/lib/server/domains/posts/post.public', () => ({
  getAllUserVotedPostIds: vi.fn(async () => new Set()),
}))

vi.mock('@/lib/server/storage/s3', () => ({
  getPublicUrlOrNull: vi.fn(() => null),
}))

vi.mock('@/lib/server/auth/identify-merge', () => ({
  resolveAndMergeAnonymousToken: vi.fn(),
}))

vi.mock('@/lib/server/widget/identity-token', () => ({
  verifyHS256JWT: (...args: unknown[]) => mockVerifyJWT(...args),
}))

vi.mock('@/lib/server/domains/users/user.attributes', () => ({
  validateAndCoerceAttributes: vi.fn(async () => ({ valid: {}, removals: [], errors: [] })),
  mergeMetadata: vi.fn(() => null),
}))

vi.mock('@/lib/server/domains/segments/segment-membership.service', () => ({
  addMember: vi.fn(async () => undefined),
  reconcileWidgetMemberships: vi.fn(async () => undefined),
}))

vi.mock('@quackback/ids', () => ({
  generateId: vi.fn((kind: string) => `${kind}_generated`),
}))

import { Route } from '../identify'

type RouteOpts = {
  server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } }
}
const { POST } = (Route as unknown as { options: RouteOpts }).options.server.handlers

function postIdentify(body: Record<string, unknown>): Promise<Response> {
  return POST({
    request: new Request('http://test/api/widget/identify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })
}

/** The values handed to the `user` insert (the call carrying an `email`). */
function userInsertValues(): Record<string, unknown> | undefined {
  const call = insertValues.mock.calls.find(
    (c) => c[0] && typeof c[0] === 'object' && 'email' in (c[0] as object)
  )
  return call?.[0] as Record<string, unknown> | undefined
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSessionFindFirst.mockResolvedValue(null)
})

describe('POST /api/widget/identify — la langue du compte (claim locale)', () => {
  it("enregistre la langue d'un nouveau compte, normalisée", async () => {
    mockVerifyJWT.mockReturnValue({ sub: 'sub_a', email: 'a@acme.com', name: 'A', locale: 'fr-FR' })
    mockUserFindFirst.mockResolvedValue(null)
    mockPrincipalFindFirst.mockResolvedValue(null)

    const res = await postIdentify({ ssoToken: 'jwt' })

    expect(res.status).toBe(200)
    expect(userInsertValues()?.locale).toBe('fr')
  })

  it("une langue hors des six devient l'anglais", async () => {
    mockVerifyJWT.mockReturnValue({ sub: 'sub_b', email: 'b@acme.com', name: 'B', locale: 'ja' })
    mockUserFindFirst.mockResolvedValue(null)
    mockPrincipalFindFirst.mockResolvedValue(null)

    await postIdentify({ ssoToken: 'jwt' })

    expect(userInsertValues()?.locale).toBe('en')
  })

  it("met à jour la langue d'un compte existant quand elle change", async () => {
    mockVerifyJWT.mockReturnValue({ sub: 'sub_c', email: 'c@acme.com', name: 'C', locale: 'de' })
    mockUserFindFirst.mockResolvedValueOnce({
      id: 'user_c',
      email: 'c@acme.com',
      externalId: 'sub_c',
      name: 'C',
      image: null,
      metadata: null,
      locale: 'fr',
    })
    mockPrincipalFindFirst.mockResolvedValue({ id: 'principal_c', role: 'user' })

    await postIdentify({ ssoToken: 'jwt' })

    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ locale: 'de' }))
  })

  it("n'écrit rien quand la langue est déjà la bonne", async () => {
    mockVerifyJWT.mockReturnValue({ sub: 'sub_d', email: 'd@acme.com', name: 'D', locale: 'fr' })
    mockUserFindFirst.mockResolvedValueOnce({
      id: 'user_d',
      email: 'd@acme.com',
      externalId: 'sub_d',
      name: 'D',
      image: null,
      metadata: null,
      locale: 'fr-FR',
    })
    mockPrincipalFindFirst.mockResolvedValue({ id: 'principal_d', role: 'user' })

    await postIdentify({ ssoToken: 'jwt' })

    for (const call of updateSet.mock.calls) expect(call[0]).not.toHaveProperty('locale')
  })

  it('ignore une langue envoyée dans un corps NON vérifié', async () => {
    mockUserFindFirst.mockResolvedValue(null)
    mockPrincipalFindFirst.mockResolvedValue(null)

    await postIdentify({ id: 'client_sub', email: 'e@acme.com', locale: 'it' })

    expect(userInsertValues()?.locale ?? null).toBeNull()
  })
})
