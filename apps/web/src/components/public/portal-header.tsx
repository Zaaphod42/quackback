import { useEffect, useState } from 'react'
import { Link, useRouter, useRouterState, useRouteContext } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { buildNavItems, estLienExterne, DIAFANE } from './portal-header-nav'
import { useIntl, FormattedMessage } from 'react-intl'
import { cn } from '@/lib/shared/utils'
import { isTeamMember } from '@/lib/shared/roles'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/client/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ComputerDesktopIcon, MoonIcon, ShieldCheckIcon, SunIcon } from '@heroicons/react/24/solid'
import { useAuthPopoverSafe } from '@/components/auth/auth-popover-context'
import { hasAnyPortalAuthMethod, resolveSoleOidcProvider } from '@/components/auth/oauth-buttons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyConversationsFn } from '@/lib/server/functions/chat'
import { PORTAL_MY_CONVERSATIONS_QUERY_KEY } from '@/lib/client/queries/portal-support'
import { useAuthBroadcast } from '@/lib/client/hooks/use-auth-broadcast'
import { NotificationBell } from '@/components/notifications'

interface PortalHeaderProps {
  orgName: string
  orgLogo?: string | null
  /** User's role in the organization (passed from server) */
  userRole?: 'admin' | 'member' | 'user' | null
  /** Whether to show the theme toggle (hidden when admin forces a specific theme) */
  showThemeToggle?: boolean
}

export function PortalHeader({
  orgName,
  orgLogo,
  userRole,
  showThemeToggle = true,
}: PortalHeaderProps) {
  const intl = useIntl()
  const router = useRouter()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { session, settings, registeredAuthProviders } = useRouteContext({ from: '__root__' })

  const helpCenterEnabled =
    !!settings?.featureFlags?.helpCenter && !!settings?.helpCenterConfig?.enabled
  const supportEnabled =
    !!settings?.featureFlags?.supportInbox && !!settings?.portalConfig?.support?.enabled
  const onHelpPages = pathname === '/hc' || pathname.startsWith('/hc/')
  const navItems = buildNavItems({ helpCenterEnabled, supportEnabled })

  // Hide Log in / Sign up when no portal sign-in surface is usable.
  // Team members can still reach /admin/login directly. Counts any registered
  // OIDC provider — including a routed-only one with no public button, which a
  // domain user reaches by entering their email — not just the legacy `sso` id.
  const portalAuthEnabled = hasAnyPortalAuthMethod(settings?.publicAuthConfig?.oauth ?? {}, {
    registeredAuthProviders,
    oidcProviders: settings?.publicPortalConfig?.oidcProviders,
  })

  // When the ONLY sign-in method is a single OIDC provider, every sign-in goes
  // through it — so "Log in" / "Sign up" redirect straight to the IdP and skip
  // the email-entry dialog entirely.
  const soleOidcProviderId = resolveSoleOidcProvider(
    registeredAuthProviders,
    settings?.publicAuthConfig?.oauth ?? {}
  )

  const authPopover = useAuthPopoverSafe()
  const openAuthPopover = authPopover?.openAuthPopover
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for auth success to refetch session and role via router invalidation
  useAuthBroadcast({
    onSuccess: () => {
      // Invalidate user-scoped queries so reaction highlights and vote data refresh
      queryClient.invalidateQueries({ queryKey: ['portal', 'post'] })
      queryClient.invalidateQueries({ queryKey: ['votedPosts'] })
      // Refetch loaders (includes session and userRole) for the new session.
      void router.invalidate()
    },
  })

  // Get user info from session (anonymous sessions don't count as logged in)
  const user = session?.user
  const isLoggedIn = !!user && user.principalType !== 'anonymous'

  // Unread count for the Support tab badge — one light query, shared with the
  // Support pages via the query key. Skipped entirely when signed out.
  const myConversationsQuery = useQuery({
    queryKey: PORTAL_MY_CONVERSATIONS_QUERY_KEY,
    queryFn: () => getMyConversationsFn(),
    enabled: supportEnabled && isLoggedIn,
    staleTime: 30_000,
  })
  const supportUnreadTotal = (myConversationsQuery.data?.conversations ?? []).reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0
  )

  // Team members (admin, member) can access admin dashboard
  const canAccessAdmin = isLoggedIn && isTeamMember(userRole)

  // Skip the sign-in dialog for a single-IdP workspace: go straight to the
  // OIDC provider (same redirect the dialog's "Continue" path uses), returning
  // to the current page afterwards.
  const redirectToSoleProvider = () => {
    if (!soleOidcProviderId) return
    void authClient.signIn.oauth2({ providerId: soleOidcProviderId, callbackURL: pathname })
  }

  // Navigation component
  const Navigation = () => (
    <nav className="portal-nav flex items-center gap-1 whitespace-nowrap">
      {navItems.map((item) => {
        // Les guides vivent sur `diafane.com` : c'est un `<a>`, le routeur du
        // portail ne connait pas cette adresse, et rien ne le marque courant
        // puisqu'on n'y est jamais.
        if (estLienExterne(item)) {
          return (
            <a
              key={item.href}
              href={item.href}
              className="portal-nav__item px-3 py-2 text-sm font-medium transition-colors [border-radius:calc(var(--radius)*0.8)] text-[var(--nav-inactive-color)] hover:text-[var(--nav-active-foreground)] hover:bg-[var(--nav-active-background)]/50"
            >
              {intl.formatMessage({ id: item.messageId, defaultMessage: item.defaultMessage })}
            </a>
          )
        }

        const isActive =
          item.to === '/'
            ? pathname === '/' || /^\/[^/]+\/posts\//.test(pathname)
            : item.to === '/hc'
              ? onHelpPages
              : pathname.startsWith(item.to)

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'portal-nav__item px-3 py-2 text-sm font-medium transition-colors [border-radius:calc(var(--radius)*0.8)]',
              isActive
                ? 'portal-nav__item--active bg-[var(--nav-active-background)] text-[var(--nav-active-foreground)]'
                : 'text-[var(--nav-inactive-color)] hover:text-[var(--nav-active-foreground)] hover:bg-[var(--nav-active-background)]/50'
            )}
          >
            {intl.formatMessage({ id: item.messageId, defaultMessage: item.defaultMessage })}
            {item.to === '/support' && supportUnreadTotal > 0 && (
              <span
                className="ms-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-[18px] text-primary-foreground"
                aria-label={intl.formatMessage(
                  {
                    id: 'portal.support.unreadBadge',
                    defaultMessage: '{count} unread',
                  },
                  { count: supportUnreadTotal }
                )}
              >
                {supportUnreadTotal > 99 ? '99+' : supportUnreadTotal}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  // Compact theme toggle dropdown for the header
  const ThemeToggle = () => {
    if (!showThemeToggle || !mounted) return null

    const themeOptions = [
      {
        value: 'system',
        label: intl.formatMessage({ id: 'portal.header.theme.system', defaultMessage: 'System' }),
        icon: ComputerDesktopIcon,
      },
      {
        value: 'light',
        label: intl.formatMessage({ id: 'portal.header.theme.light', defaultMessage: 'Light' }),
        icon: SunIcon,
      },
      {
        value: 'dark',
        label: intl.formatMessage({ id: 'portal.header.theme.dark', defaultMessage: 'Dark' }),
        icon: MoonIcon,
      },
    ] as const

    const currentTheme = themeOptions.find((t) => t.value === theme) ?? themeOptions[0]
    const CurrentIcon = currentTheme.icon

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <CurrentIcon className="h-4 w-4" />
            <span className="sr-only">
              {intl.formatMessage({
                id: 'portal.header.theme.toggleLabel',
                defaultMessage: 'Toggle theme',
              })}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themeOptions.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(theme === t.value && 'bg-accent')}
            >
              <t.icon className="me-2 h-4 w-4" />
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Auth/admin buttons component (reused in both layouts)
  const AuthButtons = () => (
    <div className="flex items-center">
      {/* Theme Toggle (when admin allows user choice) */}
      <ThemeToggle />

      {/* Admin Button (visible for team members) */}
      {canAccessAdmin && (
        <Button variant="outline" size="sm" asChild className="ms-1 me-2">
          <Link to="/admin">
            <ShieldCheckIcon className="me-2 h-4 w-4" />
            <FormattedMessage id="portal.header.auth.admin" defaultMessage="Admin" />
          </Link>
        </Button>
      )}

      {/*
        ⭐ LE RETOUR VERS DIAFANE (Seb 2026-09-23). Le portail est une surface du
        produit, pas un site a part : sa barre porte donc le meme bouton dore que
        la vitrine, a la meme place. Connecte, il mene a la bibliotheque ;
        visiteur, il mene a l'accueil public, ou il tient le role de l'appel a
        l'action. C'est un <a> : on sort du portail.
      */}
      <Button size="sm" asChild className="portal-header__diafane ms-1 me-2">
        <a href={isLoggedIn ? DIAFANE.app : DIAFANE.accueil}>
          {isLoggedIn ? (
            <FormattedMessage id="portal.header.diafane.app" defaultMessage="Open the app" />
          ) : (
            <FormattedMessage
              id="portal.header.diafane.discover"
              defaultMessage="Discover Diafane"
            />
          )}
        </a>
      </Button>

      {/* Notification Bell (logged in users only) */}
      {isLoggedIn && <NotificationBell popoverSide="bottom" className="me-1" />}

      {/*
        ⭐ LA BARRE DU PORTAIL N'A PLUS DE MENU DE COMPTE DU TOUT (Seb
        2026-09-23 : « on pourrait le masquer dans feedback ? »).

        Il avait d'abord ete reserve a l'equipe, faute de savoir ou Seb
        retrouverait « Se deconnecter ». La reponse est mesuree : le rail de
        l'ADMINISTRATION porte deja son propre avatar, son « Settings » et son
        « Sign out » (`components/admin/admin-sidebar.tsx`). Le retirer d'ici ne
        coute donc rien a personne, et le bouton « Administration », qui reste
        dans la barre, y mene d'un clic.

        Pour un utilisateur du portail, il ne manquait deja rien : son compte
        n'est jamais choisi, il est cree par le jeton signe que le widget envoie
        depuis l'application, et le nom qu'il affiche vient de la meme source.

        Ce qui reste ici : la cloche, parce qu'une reponse a son idee doit se
        voir, et « Log in » pour un visiteur.
      */}
      {!isLoggedIn && openAuthPopover && portalAuthEnabled ? (
        // ⚠️ `!isLoggedIn` EST INDISPENSABLE, et il n'est plus porte par une
        // branche precedente : sans lui, un utilisateur DEJA connecte se
        // verrait proposer de se connecter, puisque plus rien ne le distingue
        // ici. C'est le defaut qu'avait attrape le retrait de l'avatar.
        // Visiteur : « Log in » discret, comme sur la vitrine, le bouton dore
        // juste avant tenant le role de l'appel a l'action.
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            soleOidcProviderId ? redirectToSoleProvider() : openAuthPopover({ mode: 'login' })
          }
        >
          <FormattedMessage id="portal.header.auth.logIn" defaultMessage="Log in" />
        </Button>
      ) : null}
    </div>
  )

  // Two-row layout: Logo + Auth on top, Navigation below
  return (
    <div className="portal-header w-full py-2 border-b border-[var(--header-border)] bg-[var(--header-background)] shadow-sm">
      {/* Row 1: Logo + Name + Auth */}
      <div>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <div className="flex h-12 items-center justify-between">
            <Link to="/" className="portal-header__logo flex items-center gap-2">
              {orgLogo ? (
                <img
                  src={orgLogo}
                  alt={orgName}
                  className="h-8 w-8 [border-radius:calc(var(--radius)*0.6)]"
                />
              ) : (
                <div className="h-8 w-8 [border-radius:calc(var(--radius)*0.6)] bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {orgName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="portal-header__name font-semibold hidden sm:block max-w-[18ch] line-clamp-2 text-[var(--header-foreground)]">
                {orgName}
              </span>
              {/*
                ⭐ LE NOM DE LA SURFACE, a droite du mot, comme sur les pages
                publiques de Diafane (`Components/Vitrine3/BarreVitrine.vue`).

                Il vivait dans un `::after` de la feuille d'habillage, faute de
                pouvoir toucher au code : il sortait donc en ANGLAIS meme pour
                un visiteur francais, alors que tout le reste de la barre est
                traduit (le portail resout la langue depuis `Accept-Language`).
                Une regle de style ne sait pas traduire ; ceci si.
              */}
              <span className="portal-header__surface">
                <span aria-hidden="true">/</span>
                <FormattedMessage id="portal.header.surface" defaultMessage="Help and ideas" />
              </span>
            </Link>
            <AuthButtons />
          </div>
        </div>
      </div>

      {/* Row 2: Navigation */}
      <div className="mt-2 overflow-x-auto scrollbar-none">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <Navigation />
        </div>
      </div>
    </div>
  )
}
