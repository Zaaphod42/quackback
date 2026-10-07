import { Link, useRouteContext, useRouterState } from '@tanstack/react-router'
import { useIntl } from 'react-intl'
import { MessageCircle } from 'lucide-react'
import { ouvrirCourrielDiafane } from './portal-header-nav'

/**
 * ⭐ LA PASTILLE « UN BUG ? UNE QUESTION ? », EN BAS A DROITE DE TOUTES LES PAGES
 * DU PORTAIL (Seb 2026-10-07 : « ce serait bien de l'avoir tout le temps sur
 * guides/feedback/support »).
 *
 * C'est la pastille des pages des guides de Diafane
 * (`resources/js/Components/Vitrine3/SignalerBug.vue`, style `.v3-bug-pastille`
 * de `resources/css/vitrine3.css`), recopiee au pixel : meme place, meme texte
 * (la cle `aide.bug.bouton` des six fichiers de langue de Diafane), meme icone
 * de bulle, et sur telephone l'icone seule. Les deux logiciels ne partagent pas
 * de code : une retouche de l'une se reporte a la main sur l'autre.
 *
 * CE QU'ELLE OUVRE, comme dans les guides :
 * - une personne CONNECTEE, la conversation activee : une NOUVELLE conversation
 *   de l'onglet Support, la meme boite que le widget de Diafane ;
 * - sinon (un visiteur, ou la conversation eteinte) : un courriel a l'adresse
 *   de contact, jamais le tableau public des idees, qui publierait le signalement.
 *
 * ELLE SE TAIT DANS UNE CONVERSATION (`/support/<id>`, la nouvelle comprise) :
 * on y est deja, et la page tient toute la hauteur de l'ecran avec la zone de
 * saisie en bas, dont la pastille couvrirait le bouton d'envoi.
 *
 * SA PLACE SOUS LE CONTENU : un bloc vide de sa hauteur et de son air (44 + 20
 * px, plus la zone sure de l'iPhone), comme `.v3-place-pastille` dans Diafane,
 * pour que la fin d'une page ne passe jamais sous elle.
 */
export function estPageDeConversation(pathname: string): boolean {
  return /^\/support\/[^/]+\/?$/.test(pathname)
}

const CLASSES_PASTILLE = [
  'fixed z-40 inline-flex items-center gap-2 whitespace-nowrap',
  'right-5 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] max-sm:right-4',
  'h-11 px-[18px] max-sm:px-3.5 rounded-full',
  'bg-white text-[#14181c] border border-[#e7decf]',
  'shadow-[0_6px_20px_rgba(31,29,24,0.12)]',
  'text-[14.5px] font-medium',
  'transition-[border-color,box-shadow] duration-150',
  // Tailwind 4 ne pose `hover:` que sous `@media (hover: hover)` : l'etat ne
  // reste donc pas colle apres un toucher sur iPad.
  'hover:border-[#c4af7b] hover:shadow-[0_8px_24px_rgba(31,29,24,0.16)]',
].join(' ')

export function PortalBugPill() {
  const intl = useIntl()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { session, settings } = useRouteContext({ from: '__root__' })

  if (estPageDeConversation(pathname)) return null

  const supportEnabled =
    !!settings?.featureFlags?.supportInbox && !!settings?.portalConfig?.support?.enabled
  const isLoggedIn = !!session?.user && session.user.principalType !== 'anonymous'

  const libelle = intl.formatMessage({
    id: 'portal.bugPill.label',
    defaultMessage: 'A bug? A question?',
  })

  // Sur telephone, l'icone seule : le texte se masque, le nom reste dans
  // `aria-label` pour un lecteur d'ecran.
  const contenu = (
    <>
      <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="max-sm:hidden">{libelle}</span>
    </>
  )

  return (
    <>
      <div
        className="portal-bug-pill__place h-[calc(64px+env(safe-area-inset-bottom,0px))]"
        aria-hidden="true"
      />
      {supportEnabled && isLoggedIn ? (
        <Link
          to="/support/$conversationId"
          params={{ conversationId: 'new' }}
          className={`portal-bug-pill ${CLASSES_PASTILLE}`}
          aria-label={libelle}
        >
          {contenu}
        </Link>
      ) : (
        <button
          type="button"
          className={`portal-bug-pill ${CLASSES_PASTILLE}`}
          aria-label={libelle}
          onClick={ouvrirCourrielDiafane}
        >
          {contenu}
        </button>
      )}
    </>
  )
}
