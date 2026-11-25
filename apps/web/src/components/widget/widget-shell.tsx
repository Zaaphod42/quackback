import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeftIcon,
  XIcon,
  HouseIcon,
  LightbulbIcon,
  NewspaperIcon,
  MessageCircleQuestionMarkIcon,
  ExternalLinkIcon,
} from 'lucide-react'
import { FormattedMessage, useIntl } from 'react-intl'
import { cn } from '@/lib/shared/utils'
import { Avatar } from '@/components/ui/avatar'
import { UserStatsBar } from '@/components/shared/user-stats'
import { getWidgetAuthHeaders, generateOneTimeToken } from '@/lib/client/widget-auth'
import { sendToHost } from '@/lib/client/widget-bridge'
import { useWidgetAuth } from './widget-auth-provider'
import { useWidgetMobile } from './use-widget-mobile'

import { type WidgetTab, type EnabledTabs, visibleTabs } from './widget-nav'
export type { WidgetTab }

const TAB_CONFIG: {
  tab: WidgetTab
  icon: typeof LightbulbIcon
  labelId: string
  defaultLabel: string
}[] = [
  { tab: 'home', icon: HouseIcon, labelId: 'widget.shell.tab.home', defaultLabel: 'Home' },
  {
    tab: 'feedback',
    icon: LightbulbIcon,
    labelId: 'widget.shell.tab.feedback',
    defaultLabel: 'Your ideas',
  },
  {
    tab: 'changelog',
    icon: NewspaperIcon,
    labelId: 'widget.shell.tab.changelog',
    defaultLabel: 'Changelog',
  },
  {
    tab: 'help',
    icon: MessageCircleQuestionMarkIcon,
    labelId: 'widget.shell.tab.help',
    defaultLabel: 'Support',
  },
]

interface PortalAccessProps {
  /** Whether the portal is set to private visibility. */
  isPrivate: boolean
  /** Whether widget sign-in is enabled on this portal. */
  widgetSignIn: boolean
}

interface WidgetShellProps {
  orgSlug: string
  activeTab: WidgetTab
  onTabChange: (tab: WidgetTab) => void
  onBack?: () => void
  /**
   * Cache le titre de l'onglet a cote de la fleche de retour : une conversation n'en porte pas (Seb 2026-11-24),
   * alors que le detail d'une idee ou la proposition gardent « Vos idees ».
   */
  hideTitle?: boolean
  enabledTabs?: EnabledTabs
  /** Portal access config used to decide whether to show the "Go to portal" CTA. */
  portalAccess?: PortalAccessProps
  /**
   * The portal's own origin (e.g. "https://feedback.example.com"), resolved
   * server-side from BASE_URL. Used for the widget-handoff URL so the CTA
   * always points at the portal host, not at the widget iframe's origin (which
   * may differ in self-hosted setups where the widget is served from a
   * separate domain).
   */
  portalOrigin?: string
  children: ReactNode
}

export function WidgetShell({
  orgSlug,
  activeTab,
  onTabChange,
  onBack,
  hideTitle = false,
  enabledTabs = { feedback: true, changelog: false, help: false, chat: false },
  portalAccess,
  portalOrigin,
  children,
}: WidgetShellProps) {
  const intl = useIntl()
  const tabsToShow = visibleTabs(enabledTabs)
  const showTabBar = tabsToShow.length > 1
  const { user, isIdentified, hmacRequired, closeWidget } = useWidgetAuth()
  // Plein ecran sur telephone : l'en-tete y fait 60 px et porte l'avatar. Pose sur une page de bureau, 56 px et
  // aucun avatar (la personne est deja connectee dans la page dessous).
  const mobile = useWidgetMobile()

  // Global Escape key handler — close widget from anywhere
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeWidget()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeWidget])

  // "Go to portal" CTA — shown only when ALL three conditions hold:
  //   1. The visitor is HMAC-verified (hmacRequired=true and they are identified)
  //   2. The portal is private
  //   3. widgetSignIn is enabled
  const showPortalCta =
    hmacRequired &&
    isIdentified &&
    (portalAccess?.isPrivate ?? false) &&
    (portalAccess?.widgetSignIn ?? false)
  const [portalCtaError, setPortalCtaError] = useState(false)
  const handleGoToPortal = useCallback(async () => {
    setPortalCtaError(false)
    const ott = await generateOneTimeToken()
    if (!ott) {
      setPortalCtaError(true)
      return
    }
    // Prefer the server-resolved portal origin so the handoff URL targets the
    // portal host — not the widget iframe's origin, which may differ in
    // self-hosted setups where the widget is served from a separate domain.
    const origin = portalOrigin || window.location.origin
    const portalUrl = `${origin}/auth/widget-handoff?ott=${encodeURIComponent(ott)}`
    sendToHost({ type: 'quackback:navigate', url: portalUrl })
  }, [])

  return (
    <div className="flex flex-col h-full bg-card text-foreground overflow-x-hidden">
      {/* L'EN-TETE : le titre de l'onglet a gauche (jamais de logo : le panneau s'ouvre par-dessus un site qui a le sien),
          l'avatar sur telephone seulement, puis la croix. Dans une conversation ou un detail, la fleche de retour
          prend la place du titre : le contenu porte son propre titre. */}
      <div
        className={cn(
          'widget-shell-entete relative flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-border bg-card ps-5 pe-4'
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition-colors"
              aria-label={intl.formatMessage({
                id: 'widget.shell.aria.goBack',
                defaultMessage: 'Go back',
              })}
            >
              <ArrowLeftIcon className="w-5 h-5 text-foreground" />
            </button>
          )}
          {activeTab !== 'home' && !hideTitle && (
            <h2
              className="widget-shell-titre truncate pb-[3px] text-[22px] font-normal leading-none text-foreground"
              style={{ fontFamily: "'Glass Antiqua', Georgia, serif" }}
            >
              {activeTab === 'feedback' ? (
                <FormattedMessage id="widget.shell.heading.feedback" defaultMessage="Your ideas" />
              ) : activeTab === 'help' ? (
                <FormattedMessage id="widget.shell.heading.help" defaultMessage="Support" />
              ) : (
                <FormattedMessage id="widget.shell.heading.changelog" defaultMessage="What's new" />
              )}
            </h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showPortalCta && (
            <button
              type="button"
              onClick={handleGoToPortal}
              className="flex items-center gap-1 px-2 h-10 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              aria-label={intl.formatMessage({
                id: 'widget.shell.aria.goToPortal',
                defaultMessage: 'Go to portal',
              })}
            >
              <FormattedMessage id="widget.shell.goToPortal" defaultMessage="Portal" />
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {user && mobile && <UserAvatarPopover user={user} />}
          <button
            type="button"
            onClick={closeWidget}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition-colors"
            aria-label={intl.formatMessage({
              id: 'widget.shell.aria.close',
              defaultMessage: 'Close feedback widget',
            })}
          >
            <XIcon className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {portalCtaError && (
        <p className="px-4 pb-1 text-[11px] text-destructive">
          <FormattedMessage
            id="widget.shell.goToPortal.error"
            defaultMessage="Couldn't generate sign-in link, please try again"
          />
        </p>
      )}

      <div className="flex-1 overflow-hidden min-h-0 bg-background">{children}</div>

      {/* Bottom tab bar + footer */}
      <div
        className="widget-shell-onglets border-t border-border shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {showTabBar && (
          // NOS ONGLETS, EN MIROIR VERTICAL (Seb 2026-11-24) : les filets et la hauteur de `BarreOnglets` de
          // l'application, mais le trait epais de l'onglet choisi est EN HAUT, vers l'interieur, la ou l'application
          // le met en bas.
          <div className="flex" role="tablist">
            {tabsToShow.map((tab) => {
              const cfg = TAB_CONFIG.find((c) => c.tab === tab)
              if (!cfg) return null
              const Icon = cfg.icon
              const selected = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    'relative flex h-[54px] flex-1 items-center justify-center gap-2 text-sm transition-colors',
                    'border-s border-border first:border-s-0',
                    selected
                      ? 'font-semibold text-foreground before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-foreground'
                      : 'font-medium text-foreground/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">
                    <FormattedMessage id={cfg.labelId} defaultMessage={cfg.defaultLabel} />
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="border-t border-border/20 py-2 flex items-center justify-center">
          <a
            href={`https://quackback.io?utm_campaign=${encodeURIComponent(orgSlug || 'unknown')}&utm_content=widget&utm_medium=referral&utm_source=powered-by`}
            target="_blank"
            className="group inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-all"
          >
            <img
              src="/logo.png"
              alt=""
              width={11}
              height={11}
              className="opacity-60 group-hover:opacity-100 transition-opacity"
            />
            <span>
              <FormattedMessage
                id="widget.shell.poweredBy"
                defaultMessage="Powered by {brand}"
                values={{ brand: <span className="font-medium">Quackback</span> }}
              />
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}

function UserAvatarPopover({
  user,
}: {
  user: { name: string; email: string; avatarUrl: string | null }
}) {
  const intl = useIntl()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
        aria-label={intl.formatMessage({
          id: 'widget.shell.aria.userMenu',
          defaultMessage: 'User menu',
        })}
      >
        <Avatar src={user.avatarUrl} name={user.name} className="size-10 text-xs" />
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-1.5 z-50 w-56 rounded-lg border border-border bg-card shadow-lg">
          <div className="px-3 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar src={user.avatarUrl} name={user.name} className="size-9 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border px-3 py-2.5">
            <UserStatsBar compact headers={getWidgetAuthHeaders()} />
          </div>
        </div>
      )}
    </div>
  )
}
