/**
 * Pure helpers for the portal header's top-level nav.
 * Kept in its own module so tests can import without dragging in React.
 */

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
 * Un element porte SOIT `to` (une route du portail) SOIT `href` (une adresse
 * hors du portail) : c'est ce qui decide, au rendu, entre `<Link>` et `<a>`.
 * Sans cette distinction, le routeur chercherait `/en/guides` chez lui.
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

const NAV_ITEM_GUIDES = {
  href: DIAFANE.guides,
  messageId: 'portal.header.nav.guides',
  defaultMessage: 'Guides',
} as const

const NAV_ITEM_FEEDBACK = {
  to: '/',
  messageId: 'portal.header.nav.feedback',
  defaultMessage: 'Feedback',
} as const

const NAV_ITEM_HELP = {
  to: '/hc',
  messageId: 'portal.header.nav.help',
  defaultMessage: 'Help Center',
} as const

const NAV_ITEM_SUPPORT = {
  to: '/support',
  messageId: 'portal.header.nav.support',
  defaultMessage: 'Support',
} as const

export type PortalNavItem =
  | typeof NAV_ITEM_GUIDES
  | typeof NAV_ITEM_FEEDBACK
  | typeof NAV_ITEM_HELP
  | typeof NAV_ITEM_SUPPORT

/** Un element qui sort du portail : il se rend en `<a>`, jamais en `<Link>`. */
export function estLienExterne(item: PortalNavItem): item is typeof NAV_ITEM_GUIDES {
  return 'href' in item
}

/**
 * Returns the nav items shown in the portal header.
 * Guides (hors du portail) then Feedback are always shown; a Help tab is
 * appended when the help center feature is enabled, and a Support tab (the
 * signed-in user's conversations) when portal support is enabled.
 */
export function buildNavItems({
  helpCenterEnabled,
  supportEnabled,
}: {
  helpCenterEnabled: boolean
  supportEnabled: boolean
}): readonly PortalNavItem[] {
  const items: PortalNavItem[] = [NAV_ITEM_GUIDES, NAV_ITEM_FEEDBACK]
  if (helpCenterEnabled) items.push(NAV_ITEM_HELP)
  if (supportEnabled) items.push(NAV_ITEM_SUPPORT)
  return items
}
