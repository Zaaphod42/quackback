import { memo, useEffect, useState } from 'react'
import { Link, useRouter, useRouterState, useRouteContext } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import {
  barreDiafane,
  DIAFANE,
  resolvePortalNavItems,
  type PortalNavItem,
} from './portal-header-nav'
import { usePreviewNav } from './preview-draft-context'
import { isProductEnabled } from '@/lib/shared/types/settings'
import { isStatusPagePublished } from '@/lib/shared/status-settings'
import { isPortalSupportSurfaceEnabled } from '@/lib/shared/support-surfaces'
import { useIntl, FormattedMessage } from 'react-intl'
import { cn } from '@/lib/shared/utils'
import { isTeamMember, Role } from '@/lib/shared/roles'
import { Button } from '@/components/ui/button'
import { startOidcSignIn } from '@/lib/client/start-oidc-sign-in'
import { stashSsoAttempt } from '@/lib/client/sso-attempt-stash'
import { signinErrorLanding } from '@/lib/shared/auth-prompt'
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
import { getMyConversationsFn } from '@/lib/server/functions/conversation'
import { PORTAL_MY_CONVERSATIONS_QUERY_KEY } from '@/lib/client/queries/portal-support'
import { removeViewerScopedPortalQueries } from '@/lib/client/queries/portal'
import { useAuthBroadcast } from '@/lib/client/hooks/use-auth-broadcast'
import { NotificationBell } from '@/components/notifications'
import { useSessionContext, useWorkspaceSettings } from '@/lib/client/hooks/use-root-context'

interface PortalHeaderProps {
  orgName: string
  orgLogo?: string | null
  /** User's role in the organization (passed from server) */
  userRole?: Role | null
  /** Whether to show the theme toggle (hidden when admin forces a specific theme) */
  showThemeToggle?: boolean
}

export function PortalHeader({
  orgName,
  orgLogo,
  userRole,
  showThemeToggle = true,
}: PortalHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  // Each part is selected: the route context is a new object after every
  // navigation, while these stay the same until the viewer or workspace
  // changes. The location is read by the tabs that highlight it.
  const session = useSessionContext()
  const settings = useWorkspaceSettings()
  const registeredAuthProviders = useRouteContext({
    from: '__root__',
    select: (context) => context.registeredAuthProviders,
  })

  const flags = settings?.featureFlags
  const feedbackEnabled = isProductEnabled(flags, 'feedback')
  const helpCenterEnabled = isProductEnabled(flags, 'helpCenter')
  const supportEnabled = isPortalSupportSurfaceEnabled(flags, settings?.portalConfig)
  const changelogEnabled = isProductEnabled(flags, 'changelog')
  // Status tab: product flag + published. A non-public audience still needs
  // a signed-in viewer to bother showing the tab; the route enforces the
  // real per-viewer segment gate (settings here are workspace-global, not
  // per-viewer). Hide or reorder the tab in Portal → Navigation.
  const statusAudience = settings?.statusConfig?.audience ?? 'public'
  const statusLoggedIn = !!session?.user && session.user.principalType !== 'anonymous'
  const statusEnabled =
    isStatusPagePublished(flags, settings?.statusConfig) &&
    (statusAudience === 'public' || statusLoggedIn)
  // The unsaved navigation from the admin branding preview (undefined outside
  // preview mode). Only that draft: a stylesheet or welcome-card edit leaves the
  // header alone.
  const previewNav = usePreviewNav()
  // DIAFANE : les guides en tete, Roadmap et Changelog retires (portal-header-nav.ts).
  const navItems = barreDiafane(
    resolvePortalNavItems(
      {
        feedback: feedbackEnabled,
        roadmap: feedbackEnabled,
        changelog: changelogEnabled,
        help: helpCenterEnabled,
        support: supportEnabled,
        status: statusEnabled,
      },
      previewNav ?? settings?.portalConfig?.nav
    )
  )

  // Hide Log in / Sign up when no portal sign-in surface is usable.
  // Team members can still reach /admin/login directly. Counts any registered
  // OIDC provider — including a routed-only one with no public button, which a
  // domain user reaches by entering their email — not just the legacy `sso` id.
  const portalAuthEnabled = hasAnyPortalAuthMethod(settings?.publicAuthConfig?.oauth ?? {}, {
    registeredAuthProviders,
    oidcProviders: settings?.publicPortalConfig?.oidcProviders,
  })

  // DIAFANE : pas de bouton « Sign up » propre au portail, quel que soit le
  // reglage d'inscription. Son role est tenu par le bouton dore de Diafane
  // (plus bas), et un compte de portail est cree par le jeton signe que le
  // widget envoie depuis l'application, jamais a la main.

  // When the ONLY sign-in method is a single OIDC provider, every sign-in goes
  // through it — so "Log in" / "Sign up" redirect straight to the IdP and skip
  // the email-entry dialog entirely.
  const soleOidcProviderId = resolveSoleOidcProvider(
    registeredAuthProviders,
    settings?.publicAuthConfig?.oauth ?? {}
  )

  const authPopover = useAuthPopoverSafe()
  const openAuthPopover = authPopover?.openAuthPopover

  // Listen for auth success to refetch session and role via router invalidation
  useAuthBroadcast({
    onSuccess: () => {
      // Refresh vote highlights and drop viewer-scoped data (post detail,
      // feed, tag catalog) so a team sign-in gains internal tags.
      queryClient.invalidateQueries({ queryKey: ['votedPosts'] })
      removeViewerScopedPortalQueries(queryClient)
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
  // to the current page afterwards. Stash + errorCallbackURL route callback
  // failures back into the sign-in dialog (with link-conflict recovery for
  // account_not_linked) instead of Better-Auth's bare error page.
  const redirectToSoleProvider = () => {
    if (!soleOidcProviderId) return
    const pathname = router.state.location.pathname
    stashSsoAttempt({
      providerId: soleOidcProviderId,
      providerType: 'oidc',
      callbackUrl: pathname,
    })
    void startOidcSignIn({
      providerId: soleOidcProviderId,
      callbackURL: pathname,
      errorCallbackURL: signinErrorLanding(pathname),
    })
  }

  // Auth/admin buttons. Plain elements rather than a component declared in
  // here: a component declared in render is a new type each time, so every
  // render of the header would tear these menus down and build them again.
  const authButtons = (
    <div className="flex items-center">
      {/* Theme Toggle (when admin allows user choice) */}
      {showThemeToggle && <ThemeToggle />}

      {/* Admin Button (visible for team members) */}
      {canAccessAdmin && (
        <Button variant="outline" size="sm" asChild className="ms-1 me-2">
          <Link to="/admin" search={{}}>
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
            {authButtons}
          </div>
        </div>
      </div>

      {/* Row 2: Navigation */}
      <div className="mt-2 overflow-x-auto scrollbar-none">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <Navigation
            navItems={navItems}
            helpHeaderLinks={settings?.helpCenterConfig?.headerLinks}
            supportUnreadTotal={supportUnreadTotal}
          />
        </div>
      </div>
    </div>
  )
}

const isHelpPath = (pathname: string) => pathname === '/hc' || pathname.startsWith('/hc/')

function isTabActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/' || /^\/[^/]+\/posts\//.test(pathname)
  if (to === '/hc') return isHelpPath(pathname)
  return pathname.startsWith(to)
}

const navItemClass = (isActive: boolean) =>
  cn(
    'portal-nav__item px-3 py-2 text-sm font-medium transition-colors [border-radius:calc(var(--radius)*0.8)]',
    isActive
      ? 'portal-nav__item--active bg-[var(--nav-active-background)] text-[var(--nav-active-foreground)]'
      : 'text-[var(--nav-inactive-color)] hover:text-[var(--nav-active-foreground)] hover:bg-[var(--nav-active-background)]/50'
  )

function Navigation({
  navItems,
  helpHeaderLinks,
  supportUnreadTotal,
}: {
  navItems: PortalNavItem[]
  helpHeaderLinks: { label: string; url: string }[] | undefined
  supportUnreadTotal: number
}) {
  const intl = useIntl()
  // Admin-configured help center links render beside the built-in nav on help
  // pages only. External URLs open in a new tab; root-relative paths stay
  // in-tab. Legacy configs predate the field, hence the `?? []`.
  const onHelpPages = useRouterState({ select: (s) => isHelpPath(s.location.pathname) })
  const helpLinks = onHelpPages ? (helpHeaderLinks ?? []).slice(0, 3) : []

  return (
    <nav className="portal-nav flex items-center gap-1 whitespace-nowrap">
      {navItems.map((item) => {
        if (item.kind === 'link') {
          return (
            <a
              key={item.id}
              href={item.href}
              target={item.newTab ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={navItemClass(false)}
            >
              {/* DIAFANE : les guides se traduisent, un lien de l'administration non. */}
              {item.messageId
                ? intl.formatMessage({ id: item.messageId, defaultMessage: item.label })
                : item.label}
            </a>
          )
        }
        return (
          <NavTab
            key={item.id}
            item={item}
            unread={item.type === 'support' ? supportUnreadTotal : 0}
          />
        )
      })}
      {helpLinks.map((link) => {
        const external = !link.url.startsWith('/')
        return (
          <a
            key={link.url}
            href={link.url}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className={navItemClass(false)}
          >
            {link.label}
          </a>
        )
      })}
    </nav>
  )
}

type BuiltInNavItem = Extract<PortalNavItem, { kind: 'builtin' }>

/**
 * A tab. It follows the location on its own, so a navigation renders only the
 * tabs it highlights, and is memoized on what it shows, so the header
 * rendering again (a navigation draft in the branding preview, a new unread
 * count) renders only the tabs that changed.
 */
const NavTab = memo(
  function NavTab({ item, unread }: { item: BuiltInNavItem; unread: number }) {
    const intl = useIntl()
    const isActive = useRouterState({ select: (s) => isTabActive(item.to, s.location.pathname) })
    return (
      <Link to={item.to} className={navItemClass(isActive)}>
        {item.label ??
          intl.formatMessage({ id: item.messageId, defaultMessage: item.defaultMessage })}
        {unread > 0 && (
          <span
            className="ms-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-[18px] text-primary-foreground"
            aria-label={intl.formatMessage(
              {
                id: 'portal.support.unreadBadge',
                defaultMessage: '{count} unread',
              },
              { count: unread }
            )}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Link>
    )
  },
  (prev, next) =>
    prev.unread === next.unread &&
    prev.item.to === next.item.to &&
    prev.item.label === next.item.label &&
    prev.item.messageId === next.item.messageId &&
    prev.item.defaultMessage === next.item.defaultMessage
)

/** Compact theme toggle dropdown for the header. */
function ThemeToggle() {
  const intl = useIntl()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
