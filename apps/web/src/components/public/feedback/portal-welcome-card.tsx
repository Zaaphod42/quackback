import { memo } from 'react'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { isEmptyTiptapDoc } from '@/lib/shared/utils/is-empty-tiptap-doc'
import { cn } from '@/lib/shared/utils'
import { separerTitre } from './titre-carte-accueil'
import type { PortalWelcomeCard as PortalWelcomeCardData } from '@/lib/shared/types/settings'

interface PortalWelcomeCardProps {
  welcomeCard: PortalWelcomeCardData | undefined
}

function PortalWelcomeCardImpl({ welcomeCard }: PortalWelcomeCardProps) {
  if (!welcomeCard || isEmptyTiptapDoc(welcomeCard.body)) return null
  // DIAFANE : le titre de tete sort du texte enrichi, et la barre verticale le
  // coupe : ce qui la suit se dore (voir `titre-carte-accueil.ts`, qui dit
  // pourquoi une feuille de style ne peut pas le faire seule).
  const { titre, corps } = separerTitre(welcomeCard.body)

  return (
    <section
      aria-labelledby={titre ? 'portal-welcome-title' : undefined}
      className="mb-6 rounded-xl border border-border/60 bg-card/60 p-5 sm:p-6"
    >
      {titre && (
        <h2 id="portal-welcome-title" className="text-xl sm:text-2xl font-semibold tracking-tight">
          {titre.debut}
          {titre.or && (
            <>
              {' '}
              <span className="portal-welcome-title__or">{titre.or}</span>
            </>
          )}
        </h2>
      )}
      {corps && (
        <RichTextContent content={corps} className={cn(titre && 'mt-2 text-muted-foreground')} />
      )}
    </section>
  )
}

// Body rendering goes through DOMPurify.sanitize and TipTap's
// generateContentHTML, so memoize on the welcomeCard reference to keep
// the admin live-preview cheap on keystrokes.
export const PortalWelcomeCard = memo(PortalWelcomeCardImpl)
