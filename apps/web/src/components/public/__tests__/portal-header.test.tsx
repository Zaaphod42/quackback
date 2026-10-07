// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useState, type ReactNode } from 'react'
import { act, render, screen, fireEvent, cleanup } from '@testing-library/react'
import { IntlProvider } from 'react-intl'

// vi.hoisted ensures these mocks are available when the vi.mock factory runs
// (vi.mock calls are hoisted above imports by the Vitest transformer).
const {
  mockGetRouteContext,
  mockOpenAuthPopover,
  mockSocial,
  mockResolveSole,
  mockHasAny,
  mockHasDistinctSignup,
  mockInvalidateQueries,
  mockRemoveQueries,
  mockSignOut,
  linkRenders,
} = vi.hoisted(() => ({
  mockGetRouteContext: vi.fn(),
  mockOpenAuthPopover: vi.fn(),
  mockSocial: vi.fn(),
  mockResolveSole: vi.fn((): string | null => null),
  mockHasAny: vi.fn((): boolean => false),
  mockHasDistinctSignup: vi.fn((): boolean => true),
  mockInvalidateQueries: vi.fn(() => Promise.resolve()),
  mockRemoveQueries: vi.fn(() => Promise.resolve()),
  mockSignOut: vi.fn(() => Promise.resolve()),
  // The label (or target) of each Link render, to tell which tabs rendered.
  linkRenders: [] as string[],
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    invalidate: vi.fn(),
    navigate: vi.fn(),
    state: { location: { pathname: '/' } },
  }),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: '/' } }),
  useRouteContext: (opts?: { select?: (context: unknown) => unknown }) =>
    opts?.select ? opts.select(mockGetRouteContext()) : mockGetRouteContext(),
  Link: ({
    to,
    children,
    className,
    ...rest
  }: {
    to: string
    children: React.ReactNode
    className?: string
    [key: string]: unknown
  }) => {
    const text = [children]
      .flat()
      .filter((part) => typeof part === 'string')
      .join('')
    linkRenders.push(text || to)
    return (
      <a href={to} className={className} {...(rest as React.HTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  },
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}))

vi.mock('@/components/auth/auth-popover-context', () => ({
  useAuthPopoverSafe: () => ({ openAuthPopover: mockOpenAuthPopover }),
}))

vi.mock('@/components/auth/oauth-buttons', () => ({
  hasAnyPortalAuthMethod: () => mockHasAny(),
  resolveSoleOidcProvider: () => mockResolveSole(),
  hasDistinctSignup: () => mockHasDistinctSignup(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    removeQueries: mockRemoveQueries,
  }),
}))

vi.mock('@/lib/server/functions/conversation', () => ({
  getMyConversationsFn: vi.fn(),
}))

vi.mock('@/lib/client/hooks/use-auth-broadcast', () => ({
  useAuthBroadcast: () => {},
}))

vi.mock('@/lib/client/auth-client', () => ({
  signOut: mockSignOut,
  authClient: { signIn: { social: mockSocial } },
}))

vi.mock('@/components/notifications', () => ({
  NotificationBell: () => null,
}))

vi.mock('@/components/shared/user-stats', () => ({
  UserStatsBar: () => null,
}))

import { PortalHeader } from '../portal-header'
import { PreviewDraftProvider, type PortalPreviewDraft } from '../preview-draft-context'
import { DEFAULT_FEATURE_FLAGS, getProductFlagUpdate } from '@/lib/shared/types/settings'

const loggedInSession = {
  user: {
    id: 'usr_1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    principalType: 'user',
  },
}

function renderHeader({
  userRole,
  isLoggedIn,
  locale = 'en',
  messages,
}: {
  userRole?: 'admin' | 'member' | 'user' | null
  isLoggedIn: boolean
  locale?: string
  messages?: Record<string, string>
}) {
  mockGetRouteContext.mockReturnValue({
    session: isLoggedIn ? loggedInSession : null,
    settings: {},
    registeredAuthProviders: [],
  })

  return render(
    <IntlProvider locale={locale} defaultLocale="en" messages={messages}>
      {/* showThemeToggle=false removes the theme dropdown trigger so the only
          remaining button is the avatar / user-dropdown trigger */}
      <PortalHeader orgName="Acme" userRole={userRole} showThemeToggle={false} />
    </IntlProvider>
  )
}

// ⭐ LA BARRE DU PORTAIL N'A PLUS DE MENU DE COMPTE, POUR PERSONNE
// (Seb 2026-09-23). L'avatar a d'abord ete reserve a l'equipe, puis retire
// tout court : le rail de l'administration porte deja son propre avatar, son
// « Settings » et son « Sign out », et le bouton « Administration » reste dans
// la barre pour y mener. Ces tests figent les deux moities de cette regle.
describe('PortalHeader — le compte', () => {
  afterEach(() => cleanup())

  it('keeps the Administration button for a team member, as a link', () => {
    renderHeader({ userRole: 'admin', isLoggedIn: true })
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })

  // Une garantie plus forte que l'ancienne, qui ouvrait le menu pour verifier
  // qu'« Admin » n'y figurait pas : il n'y a plus de menu a ouvrir.
  it('gives nobody an account menu, team member included', () => {
    for (const userRole of ['admin', 'user'] as const) {
      cleanup()
      renderHeader({ userRole, isLoggedIn: true })
      expect(screen.queryByRole('menuitem')).toBeNull()
      // Le theme est coupe et la cloche est simulee : il ne doit plus rester
      // AUCUN bouton dans la barre pour un visiteur connecte.
      expect(screen.queryByRole('button')).toBeNull()
    }
  })

  it('hides the Administration button from a portal user', () => {
    renderHeader({ userRole: 'user', isLoggedIn: true })
    expect(screen.queryByRole('link', { name: /admin/i })).toBeNull()
  })
})

// ⭐ LA BARRE PARLE LA LANGUE DU VISITEUR, MES AJOUTS COMPRIS.
// Le portail resout sa langue depuis `Accept-Language` et traduit toute sa
// barre. Le nom de la surface a d'abord vecu dans un `::after` de la feuille
// d'habillage, donc en anglais pour tout le monde : « je vois "Help and ideas"
// dans feedback et "Aide et idees" dans les guides » (Seb 2026-09-23). Ces
// deux tests refusent le retour d'une etiquette ecrite en dur.
describe('PortalHeader — la langue de la barre', () => {
  afterEach(() => cleanup())

  it('names the surface next to the wordmark', () => {
    renderHeader({ userRole: null, isLoggedIn: false })
    expect(screen.getByText('Help and ideas')).toBeInTheDocument()
  })

  it('translates the surface name and the Diafane button', () => {
    renderHeader({
      userRole: null,
      isLoggedIn: false,
      locale: 'fr',
      messages: {
        'portal.header.surface': 'Aide et idées',
        'portal.header.diafane.discover': 'Découvrir Diafane',
      },
    })
    expect(screen.getByText('Aide et idées')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /découvrir diafane/i })).toBeInTheDocument()
    expect(screen.queryByText('Help and ideas')).toBeNull()
  })
})

// ⭐ LE RETOUR VERS DIAFANE : le portail est une surface du produit, sa barre
// ramene donc toujours a l'application ou a la vitrine, comme celle des guides.
describe('PortalHeader — le bouton Diafane', () => {
  afterEach(() => cleanup())

  it('sends a signed-in visitor to the app', () => {
    renderHeader({ userRole: 'user', isLoggedIn: true })
    const lien = screen.getByRole('link', { name: /open the app/i })
    expect(lien).toHaveAttribute('href', 'https://diafane.com/app')
  })

  it('sends an anonymous visitor to the public home page', () => {
    mockHasAny.mockReturnValue(true)
    renderHeader({ userRole: null, isLoggedIn: false })
    const lien = screen.getByRole('link', { name: /discover diafane/i })
    expect(lien).toHaveAttribute('href', 'https://diafane.com/')
  })

  // Il remplace l'inscription propre au portail : un compte y est cree par le
  // jeton signe que le widget envoie depuis l'application, jamais a la main.
  it('replaces the portal own sign-up button', () => {
    mockHasAny.mockReturnValue(true)
    renderHeader({ userRole: null, isLoggedIn: false })
    expect(screen.queryByRole('button', { name: /^sign up$/i })).toBeNull()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })
})

// DIAFANE : la barre n'a plus de menu de compte, donc plus de « Sign out » a
// tester ici (la 0.14 y verifiait le vidage des caches propres au visiteur a
// la deconnexion). Ce vidage reste couvert la ou il vit, par
// `lib/client/queries/portal-viewer-scope.test.ts`.

describe('PortalHeader — single-IdP redirect', () => {
  beforeEach(() => {
    mockOpenAuthPopover.mockClear()
    mockSocial.mockClear()
    mockHasAny.mockReturnValue(true) // the portal has a usable sign-in method
    mockResolveSole.mockReturnValue(null)
    mockHasDistinctSignup.mockReturnValue(true)
  })
  afterEach(() => cleanup())

  it('redirects straight to the sole OIDC provider on Log in, skipping the dialog', () => {
    mockResolveSole.mockReturnValue('oidc_entra')
    renderHeader({ userRole: null, isLoggedIn: false })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockSocial).toHaveBeenCalledWith(expect.objectContaining({ provider: 'oidc_entra' }))
    expect(mockOpenAuthPopover).not.toHaveBeenCalled()
  })

  it('opens the dialog on Log in when more than one method exists', () => {
    mockResolveSole.mockReturnValue(null)
    renderHeader({ userRole: null, isLoggedIn: false })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockOpenAuthPopover).toHaveBeenCalledWith(expect.objectContaining({ mode: 'login' }))
    expect(mockSocial).not.toHaveBeenCalled()
  })
})

describe('PortalHeader — Sign up button visibility', () => {
  beforeEach(() => {
    mockOpenAuthPopover.mockClear()
    mockHasAny.mockReturnValue(true)
    mockResolveSole.mockReturnValue(null)
  })
  afterEach(() => cleanup())

  // DIAFANE : le bouton dore de Diafane remplace l'inscription propre au
  // portail, meme quand le reglage en ferait un parcours distinct.
  it('shows only Log in even when sign-up is a distinct flow', () => {
    mockHasDistinctSignup.mockReturnValue(true)
    renderHeader({ userRole: null, isLoggedIn: false })
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign up/i })).toBeNull()
  })

  it('shows only Log in when sign-up would lead to the same form', () => {
    mockHasDistinctSignup.mockReturnValue(false)
    renderHeader({ userRole: null, isLoggedIn: false })
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign up/i })).toBeNull()
  })
})

describe('PortalHeader branding preview drafts', () => {
  afterEach(() => cleanup())

  // The admin's branding preview streams unsaved drafts into the portal. The
  // header shows only the navigation draft, so a stylesheet or welcome-card
  // edit renders none of it. The header asks which sign-in methods exist once
  // per render, which counts its renders.
  it('renders again for a navigation draft only, and then only the tab it changed', () => {
    mockGetRouteContext.mockReturnValue({
      session: null,
      settings: {
        // DIAFANE : la barre n'a plus d'onglet Roadmap (portal-header-nav.ts),
        // l'onglet renomme est donc celui du centre d'aide.
        featureFlags: {
          ...DEFAULT_FEATURE_FLAGS,
          ...getProductFlagUpdate('feedback', true),
          ...getProductFlagUpdate('helpCenter', true),
        },
      },
      registeredAuthProviders: [],
    })
    const drafts: {
      setDraft?: (draft: Omit<PortalPreviewDraft, 'css'>) => void
      setCss?: (css: string) => void
    } = {}
    function Preview({ children }: { children: ReactNode }) {
      const [draft, setDraft] = useState<Omit<PortalPreviewDraft, 'css'>>({})
      const [css, setCss] = useState('')
      drafts.setDraft = setDraft
      drafts.setCss = setCss
      return (
        <PreviewDraftProvider draft={draft} css={css}>
          {children}
        </PreviewDraftProvider>
      )
    }
    render(
      <IntlProvider locale="en" defaultLocale="en">
        <Preview>
          <PortalHeader orgName="Acme" showThemeToggle={false} />
        </Preview>
      </IntlProvider>
    )
    const renders = () => mockHasAny.mock.calls.length
    const settled = renders()
    expect(screen.getByRole('link', { name: 'Help Center' })).toBeInTheDocument()

    act(() => drafts.setCss!(':root { --font-sans: Inter; }'))
    act(() =>
      drafts.setDraft!({
        welcomeCard: { body: { type: 'doc', content: [{ type: 'paragraph' }] } },
      })
    )
    expect(renders()).toBe(settled)

    linkRenders.length = 0
    act(() =>
      drafts.setDraft!({
        nav: {
          items: [
            { id: 'feedback', type: 'feedback' },
            { id: 'help', type: 'help', label: 'Plans' },
          ],
        },
      })
    )
    expect(renders()).toBe(settled + 1)
    expect(screen.getByRole('link', { name: 'Plans' })).toBeInTheDocument()
    expect(linkRenders).toContain('Plans')
    expect(linkRenders).not.toContain('Feedback')
    expect(linkRenders).not.toContain('Changelog')
  })
})
