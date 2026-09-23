// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { IntlProvider } from 'react-intl'

// vi.hoisted ensures these mocks are available when the vi.mock factory runs
// (vi.mock calls are hoisted above imports by the Vitest transformer).
const { mockGetRouteContext, mockOpenAuthPopover, mockOauth2, mockResolveSole, mockHasAny } =
  vi.hoisted(() => ({
    mockGetRouteContext: vi.fn(),
    mockOpenAuthPopover: vi.fn(),
    mockOauth2: vi.fn(),
    mockResolveSole: vi.fn((): string | null => null),
    mockHasAny: vi.fn((): boolean => false),
  }))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: vi.fn(), navigate: vi.fn() }),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: '/' } }),
  useRouteContext: () => mockGetRouteContext(),
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
  }) => (
    <a href={to} className={className} {...(rest as React.HTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
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
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock('@/lib/server/functions/chat', () => ({
  getMyConversationsFn: vi.fn(),
}))

vi.mock('@/lib/client/hooks/use-auth-broadcast', () => ({
  useAuthBroadcast: () => {},
}))

vi.mock('@/lib/client/auth-client', () => ({
  signOut: vi.fn(),
  authClient: { signIn: { oauth2: mockOauth2 } },
}))

vi.mock('@/components/notifications', () => ({
  NotificationBell: () => null,
}))

vi.mock('@/components/shared/user-stats', () => ({
  UserStatsBar: () => null,
}))

import { PortalHeader } from '../portal-header'

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

describe('PortalHeader — single-IdP redirect', () => {
  beforeEach(() => {
    mockOpenAuthPopover.mockClear()
    mockOauth2.mockClear()
    mockHasAny.mockReturnValue(true) // the portal has a usable sign-in method
    mockResolveSole.mockReturnValue(null)
  })
  afterEach(() => cleanup())

  it('redirects straight to the sole OIDC provider on Log in, skipping the dialog', () => {
    mockResolveSole.mockReturnValue('oidc_entra')
    renderHeader({ userRole: null, isLoggedIn: false })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockOauth2).toHaveBeenCalledWith(expect.objectContaining({ providerId: 'oidc_entra' }))
    expect(mockOpenAuthPopover).not.toHaveBeenCalled()
  })

  it('opens the dialog on Log in when more than one method exists', () => {
    mockResolveSole.mockReturnValue(null)
    renderHeader({ userRole: null, isLoggedIn: false })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockOpenAuthPopover).toHaveBeenCalledWith(expect.objectContaining({ mode: 'login' }))
    expect(mockOauth2).not.toHaveBeenCalled()
  })
})
