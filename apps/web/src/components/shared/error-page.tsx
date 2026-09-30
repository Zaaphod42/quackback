import { useContext } from 'react'
import { IntlContext } from 'react-intl'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/shared/utils'
import { DIAFANE } from '@/components/public/portal-header-nav'

/**
 * Diafane : LES PAGES D'ERREUR DU PORTAIL SONT CELLES DE DIAFANE.COM (PLAN #660
 * de Diafane, dessin et textes choisis par Seb le 2026-09-29).
 *
 * Elles montraient le canard jaune de Quackback et un texte en anglais seul
 * (« That page has flown the pond. »). Elles reprennent désormais le bandeau à
 * photo de l'accueil du portail, `section[aria-labelledby="portal-welcome-title"]`,
 * que la feuille d'habillage de Diafane (Settings › Branding › Theme CSS) dessine
 * déjà : un titre dont la fin se dore, une phrase, des liens de retour à flèche.
 * diafane.com porte les MÊMES pages, avec les mêmes mots, dans son propre code.
 *
 * ⚠️ L'ADMINISTRATION N'A PAS CETTE FEUILLE : elle garde une coque simple, sans
 * le canard, avec les détails techniques, qui ne servent qu'à l'équipe.
 *
 * ⚠️ UNE ERREUR PEUT SURVENIR AVANT LE FOURNISSEUR DE TRADUCTIONS (une erreur
 * du gabarit racine) : les textes se lisent alors en anglais, jamais en panne.
 */

interface ErrorPageProps {
  error: Error
  reset?: () => void
  fullPage?: boolean
}

interface Texte {
  id: string
  defaultMessage: string
}

const T = {
  notFound: {
    title: { id: 'portal.errorPage.notFound.title', defaultMessage: 'This page' },
    titleGold: { id: 'portal.errorPage.notFound.titleGold', defaultMessage: 'could not be found.' },
    lead: {
      id: 'portal.errorPage.notFound.lead',
      defaultMessage: 'The link may be incomplete, or the page may have moved.',
    },
  },
  error: {
    title: { id: 'portal.errorPage.error.title', defaultMessage: 'Something' },
    titleGold: { id: 'portal.errorPage.error.titleGold', defaultMessage: 'went wrong.' },
    lead: { id: 'portal.errorPage.error.lead', defaultMessage: 'Please try again in a moment.' },
  },
  denied: {
    title: { id: 'portal.errorPage.denied.title', defaultMessage: 'Access' },
    titleGold: { id: 'portal.errorPage.denied.titleGold', defaultMessage: 'restricted.' },
    lead: {
      id: 'portal.errorPage.denied.lead',
      defaultMessage:
        'This page is limited to certain accounts. If you think you should have access, let us know.',
    },
  },
  links: {
    ideas: { id: 'portal.errorPage.links.ideas', defaultMessage: 'See the ideas' },
    guides: { id: 'portal.errorPage.links.guides', defaultMessage: 'Browse the guides' },
    contact: { id: 'portal.errorPage.links.contact', defaultMessage: 'Contact us' },
    retry: { id: 'portal.errorPage.links.retry', defaultMessage: 'Try again' },
    home: { id: 'portal.errorPage.links.home', defaultMessage: 'Back to the home page' },
  },
  technicalDetails: {
    id: 'portal.errorPage.technicalDetails',
    defaultMessage: 'Technical details',
  },
} as const

/** L'adresse de contact de Diafane, la même que « Contact us » de l'accueil du portail. */
export const CONTACT_DIAFANE = 'mailto:hello@diafane.com'

function useTraduire() {
  const intl = useContext(IntlContext)
  return (texte: Texte) => (intl ? intl.formatMessage(texte) : texte.defaultMessage)
}

/** L'administration n'a pas la feuille d'habillage : elle garde la coque simple. */
function useDansAdministration(): boolean {
  const router = useRouter({ warn: false })
  const chemin =
    router?.state?.location?.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '')
  return chemin.startsWith('/admin')
}

interface Lien {
  libelle: string
  href: string
  onClick?: () => void
}

interface HeroErreurProps {
  titre: string
  titreOr: string
  chapeau: string
  liens: Lien[]
}

/**
 * Le bandeau de l'accueil du portail, réutilisé tel quel : même balisage, donc
 * même dessin, sans une ligne de feuille de style en plus. Le PREMIER
 * paragraphe est le chapeau, le DERNIER porte les liens (contrat de la feuille).
 */
export function HeroErreur({ titre, titreOr, chapeau, liens }: HeroErreurProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <section aria-labelledby="portal-welcome-title">
        <div>
          <h2 id="portal-welcome-title">
            {titre} <span className="portal-welcome-title__or">{titreOr}</span>
          </h2>
          <p>{chapeau}</p>
          <p>
            {liens.map((lien, i) => (
              <span key={lien.libelle}>
                {i > 0 && ' '}
                <a
                  href={lien.href}
                  onClick={
                    lien.onClick
                      ? (e) => {
                          e.preventDefault()
                          lien.onClick?.()
                        }
                      : undefined
                  }
                >
                  {lien.libelle}
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  )
}

interface FriendlyShellProps {
  children: React.ReactNode
  fullPage?: boolean
}

/** La coque simple de l'administration : sans le canard de Quackback. */
export function FriendlyShell({ children, fullPage = true }: FriendlyShellProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center px-4',
        fullPage ? 'min-h-screen' : 'min-h-[400px]'
      )}
    >
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  )
}

/**
 * True for the role-gate failures thrown by requireAuth / requireWorkspaceRole
 * (e.g. "Access denied: Requires [admin], got member"). These are expected
 * outcomes, not crashes, so they get a calm permission notice rather than the
 * scary generic error treatment.
 */
export function isAuthorizationError(error: Error): boolean {
  return /access denied/i.test(error.message)
}

export function PermissionDeniedPage({ fullPage = true }: { fullPage?: boolean }) {
  const t = useTraduire()
  if (useDansAdministration()) {
    return (
      <FriendlyShell fullPage={fullPage}>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(T.denied.title)} {t(T.denied.titleGold)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(T.denied.lead)}</p>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <a href="/">{t(T.links.home)}</a>
          </Button>
        </div>
      </FriendlyShell>
    )
  }
  return (
    <HeroErreur
      titre={t(T.denied.title)}
      titreOr={t(T.denied.titleGold)}
      chapeau={t(T.denied.lead)}
      liens={[
        { libelle: t(T.links.home), href: '/' },
        { libelle: t(T.links.contact), href: CONTACT_DIAFANE },
      ]}
    />
  )
}

export function DefaultErrorPage({ error, reset, fullPage = true }: ErrorPageProps) {
  const t = useTraduire()
  const admin = useDansAdministration()

  if (isAuthorizationError(error)) {
    return <PermissionDeniedPage fullPage={fullPage} />
  }

  if (admin) {
    return (
      <FriendlyShell fullPage={fullPage}>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(T.error.title)} {t(T.error.titleGold)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(T.error.lead)}</p>

        {error.message && (
          <details className="mt-4 rounded-md border bg-muted/40 px-4 py-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              {t(T.technicalDetails)}
            </summary>
            <p className="mt-2 break-words text-sm text-muted-foreground">{error.message}</p>
          </details>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          {reset && (
            <Button onClick={reset} variant="default">
              {t(T.links.retry)}
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href="/">{t(T.links.home)}</a>
          </Button>
        </div>
      </FriendlyShell>
    )
  }

  return (
    <HeroErreur
      titre={t(T.error.title)}
      titreOr={t(T.error.titleGold)}
      chapeau={t(T.error.lead)}
      liens={[
        // Sans `reset`, le lien recharge la page elle-même.
        { libelle: t(T.links.retry), href: '', onClick: reset },
        { libelle: t(T.links.ideas), href: '/' },
      ]}
    />
  )
}

export function NotFoundPage() {
  const t = useTraduire()
  if (useDansAdministration()) {
    return (
      <FriendlyShell>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(T.notFound.title)} {t(T.notFound.titleGold)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(T.notFound.lead)}</p>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <a href="/admin">{t(T.links.home)}</a>
          </Button>
        </div>
      </FriendlyShell>
    )
  }
  return (
    <HeroErreur
      titre={t(T.notFound.title)}
      titreOr={t(T.notFound.titleGold)}
      chapeau={t(T.notFound.lead)}
      liens={[
        { libelle: t(T.links.ideas), href: '/' },
        { libelle: t(T.links.guides), href: DIAFANE.guides },
        { libelle: t(T.links.contact), href: CONTACT_DIAFANE },
      ]}
    />
  )
}
