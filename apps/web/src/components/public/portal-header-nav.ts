/**
 * Pure helpers for the portal header's top-level nav.
 * Kept in its own module so tests can import without dragging in React.
 *
 * The nav is admin-configurable via `portalConfig.nav` (ordered items,
 * per-item visibility, label overrides, custom links). Absent config
 * resolves to the default tab order, preserving pre-setting behavior.
 */
import type {
  PortalNavConfig,
  PortalNavItemConfig,
  PortalNavItemType,
} from '@/lib/shared/types/settings'

/** Built-in tab types (everything except admin-defined links). */
export type PortalBuiltInNavType = Exclude<PortalNavItemType, 'link'>

interface BuiltInNavDefinition {
  to: string
  messageId: string
  defaultMessage: string
}

const BUILT_IN_NAV_ITEMS: Record<PortalBuiltInNavType, BuiltInNavDefinition> = {
  feedback: { to: '/', messageId: 'portal.header.nav.feedback', defaultMessage: 'Feedback' },
  roadmap: { to: '/roadmap', messageId: 'portal.header.nav.roadmap', defaultMessage: 'Roadmap' },
  changelog: {
    to: '/changelog',
    messageId: 'portal.header.nav.changelog',
    defaultMessage: 'Changelog',
  },
  help: { to: '/hc', messageId: 'portal.header.nav.help', defaultMessage: 'Help Center' },
  support: { to: '/support', messageId: 'portal.header.nav.support', defaultMessage: 'Support' },
  status: { to: '/status', messageId: 'portal.header.nav.status', defaultMessage: 'Status' },
}

/** Default order, matching the nav before it became configurable. */
export const DEFAULT_NAV_ORDER: readonly PortalBuiltInNavType[] = [
  'feedback',
  'roadmap',
  'changelog',
  'help',
  'support',
  'status',
]

/**
 * Per-type availability. Each gate already folds in product flags,
 * publication toggles, and the viewer's audience where applicable — a tab
 * can only render for a viewer who can see the page behind it. Nav config
 * can hide a gated-on tab but never force-show a gated-off one.
 */
export interface PortalNavGates {
  feedback: boolean
  roadmap: boolean
  changelog: boolean
  help: boolean
  support: boolean
  status: boolean
}

/** A nav item resolved for rendering. */
export type PortalNavItem =
  | {
      kind: 'builtin'
      id: string
      type: PortalBuiltInNavType
      to: string
      messageId: string
      defaultMessage: string
      /** Admin label override — when set it wins over the i18n message. */
      label?: string
    }
  | {
      kind: 'link'
      id: string
      type: 'link'
      href: string
      label: string
      newTab: boolean
      /**
       * DIAFANE : un lien pose par le code (les guides) se traduit par cette cle,
       * `label` servant alors de texte par defaut. Un lien de l'administration
       * n'en a pas et garde son libelle tel quel.
       */
      messageId?: string
    }

function builtInItem(type: PortalBuiltInNavType, id?: string, label?: string): PortalNavItem {
  const def = BUILT_IN_NAV_ITEMS[type]
  return { kind: 'builtin', id: id ?? type, type, ...def, label }
}

function isSafeLinkUrl(url: string | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url)
}

/**
 * Resolves the nav items shown in the portal header.
 *
 * - Absent/empty config: default order filtered by gates (legacy behavior,
 *   byte-for-byte).
 * - With config: configured order; built-ins render iff their gate passes
 *   AND they are not disabled; links render unless disabled (http(s) only).
 * - Built-in types missing from the config are appended in default order
 *   when their gate passes, so a product enabled after the admin saved nav
 *   config still gets its tab.
 */
export function resolvePortalNavItems(
  gates: PortalNavGates,
  nav?: PortalNavConfig | null
): PortalNavItem[] {
  const configured = nav?.items
  if (!configured || configured.length === 0) {
    return DEFAULT_NAV_ORDER.filter((type) => gates[type]).map((type) => builtInItem(type))
  }

  const items: PortalNavItem[] = []
  const seenTypes = new Set<PortalBuiltInNavType>()

  for (const item of configured) {
    if (item.type === 'link') {
      if (item.enabled === false || !isSafeLinkUrl(item.url)) continue
      items.push({
        kind: 'link',
        id: item.id,
        type: 'link',
        href: item.url,
        label: item.label?.trim() || item.url,
        newTab: item.newTab !== false,
      })
      continue
    }

    seenTypes.add(item.type)
    // Feedback is always on: a stored enabled:false is ignored. Other built-ins
    // still honor their visibility switch (and every built-in still needs its gate).
    const hidden = item.type !== 'feedback' && item.enabled === false
    if (hidden || !gates[item.type]) continue
    items.push(builtInItem(item.type, item.id, item.label?.trim() || undefined))
  }

  for (const type of DEFAULT_NAV_ORDER) {
    if (!seenTypes.has(type) && gates[type]) items.push(builtInItem(type))
  }

  return items
}

/**
 * Seeds the admin nav editor's rows: the saved config order first, then any
 * built-in types the config doesn't mention (appended in default order, shown
 * as enabled). The editor shows every built-in — including currently
 * gated-off products, rendered disabled — so admins can pre-order tabs.
 */
export function seedNavEditorItems(nav?: PortalNavConfig | null): PortalNavItemConfig[] {
  const items: PortalNavItemConfig[] = nav?.items?.length
    ? nav.items.map((item) => ({ ...item }))
    : []
  const seenTypes = new Set(items.filter((i) => i.type !== 'link').map((i) => i.type))
  for (const type of DEFAULT_NAV_ORDER) {
    if (!seenTypes.has(type)) items.push({ id: type, type })
  }
  return items
}

/** Default label/message metadata for the editor's built-in rows. */
export function builtInNavDefinition(type: PortalBuiltInNavType): BuiltInNavDefinition {
  return BUILT_IN_NAV_ITEMS[type]
}

/**
 * ⭐ LA BARRE DU PORTAIL EST CELLE DES PAGES PUBLIQUES DE DIAFANE (Seb 2026-09-23).
 *
 * Elle porte trois pieces, et trois seulement :
 *
 *   1. LES GUIDES, qui vivent sur `diafane.com` et non ici (decision D2) ;
 *   2. LES IDEES, le tableau de feedback, qui est l'accueil du portail ;
 *   3. LES CONVERSATIONS, l'onglet Support.
 *
 * Roadmap et Changelog ne sont plus masques par la feuille d'habillage mais
 * RETIRES : la feuille de route se lit dans les idees, et le journal des
 * nouveautes reste dans l'application (decision D15). Les cacher en CSS
 * laissait deux pages vivantes que n'importe quelle adresse tapee a la main
 * rouvrait, et une barre dont la moitie des entrees existait pour etre cachee.
 *
 * Depuis la 0.14, la barre se regle dans l'administration (ordre, visibilite,
 * liens). Ce filtre passe APRES ce reglage : les guides restent en tete et les
 * deux onglets retires ne reviennent pas, quoi qu'on y coche. Les guides sont
 * un lien (`kind: 'link'`), donc un `<a>` : sans cela, le routeur chercherait
 * leur adresse chez lui.
 */
/**
 * LES TROIS ADRESSES DE DIAFANE QUE LE PORTAIL CONNAIT. Elles vivent ici, et
 * seulement ici : une adresse recopiee dans un composant est une adresse qu'on
 * oublie de changer.
 *
 * ⚠️ LE SOMMAIRE DES GUIDES EST SOUS `/aide`, PAS SOUS `/guides`. Le segment a
 * ete renomme cote Diafane le 2026-09-22, mais la PRODUCTION sert encore
 * l'ancien : `main` y est tres en retard sur `staging`. L'ancienne adresse
 * redirige vers la nouvelle une fois la promotion faite, donc ce lien marche
 * avant ET apres ; l'inverse ne serait vrai qu'apres. La LANGUE est
 * obligatoire, il n'existe pas de `/aide` nu, et le portail est en anglais.
 */
export const DIAFANE = {
  accueil: 'https://diafane.com/',
  app: 'https://diafane.com/app',
  guides: 'https://diafane.com/en/aide',
} as const

const NAV_ITEM_GUIDES: PortalNavItem = {
  kind: 'link',
  id: 'guides',
  type: 'link',
  href: DIAFANE.guides,
  label: 'Guides',
  messageId: 'portal.header.nav.guides',
  newTab: false,
}

const ONGLETS_RETIRES: ReadonlySet<PortalBuiltInNavType> = new Set(['roadmap', 'changelog'])

/** DIAFANE : les guides en tete, puis la barre de l'amont sans Roadmap ni Changelog. */
export function barreDiafane(items: readonly PortalNavItem[]): PortalNavItem[] {
  return [
    NAV_ITEM_GUIDES,
    ...items.filter((item) => item.kind === 'link' || !ONGLETS_RETIRES.has(item.type)),
  ]
}
