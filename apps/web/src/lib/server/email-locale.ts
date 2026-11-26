/**
 * Dans quelle langue écrire à une adresse e-mail (Seb 2026-11-26).
 *
 * 1. la langue enregistrée sur le compte (`user.locale`, tenue à jour à chaque connexion : `handleLocaleCapture`) ;
 * 2. à défaut, et SEULEMENT quand la personne qui déclenche l'envoi est aussi celle qui le reçoit (lien de connexion,
 *    mot de passe oublié), la langue de son navigateur ;
 * 3. sinon `undefined`, et le paquet d'e-mails écrit en anglais.
 *
 * Jamais la langue de l'expéditeur : une invitation envoyée depuis un navigateur français à quelqu'un qui n'a pas
 * de compte partirait en français sans raison.
 */
import { normalizeLocale, resolveLocale } from '@/lib/shared/i18n'
import { logger } from '@/lib/server/logger'

const log = logger.child({ component: 'email-locale' })

/** Langue du navigateur de la requête en cours, ou undefined hors requête ou sans en-tête Accept-Language. */
async function requestLocale(): Promise<string | undefined> {
  try {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const accept = getRequestHeaders().get('accept-language')
    return accept ? resolveLocale(accept) : undefined
  } catch {
    return undefined
  }
}

export async function emailLocaleFor(
  email: string | null | undefined,
  opts: { requestFallback?: boolean } = {}
): Promise<string | undefined> {
  if (!email) return undefined
  try {
    const { db, user: userTable, eq } = await import('@/lib/server/db')
    const row = await db.query.user.findFirst({
      where: eq(userTable.email, email.trim().toLowerCase()),
      columns: { locale: true },
    })
    if (row?.locale) return normalizeLocale(row.locale) ?? 'en'
  } catch (error) {
    log.warn({ err: error }, 'email locale lookup failed')
  }
  return opts.requestFallback ? requestLocale() : undefined
}
