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

/**
 * Langue probable d'après le pays de la dernière connexion, pour les comptes qui n'ont pas encore de `user.locale`.
 * Seuls les pays où UNE des six langues domine sont listés : la Belgique, la Suisse et le Luxembourg sont ambigus,
 * donc absents (l'anglais s'applique alors, jusqu'à la prochaine connexion qui enregistre la vraie langue).
 */
const COUNTRY_LOCALE: Record<string, string> = {
  FR: 'fr',
  MC: 'fr',
  IT: 'it',
  SM: 'it',
  VA: 'it',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  UY: 'es',
  DE: 'de',
  AT: 'de',
  LI: 'de',
  NL: 'nl',
  SR: 'nl',
}

export function localeFromCountry(country: string | null | undefined): string | undefined {
  return country ? COUNTRY_LOCALE[country.toUpperCase()] : undefined
}

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
      columns: { locale: true, country: true },
    })
    if (row?.locale) return normalizeLocale(row.locale) ?? 'en'
    // Compte antérieur à l'enregistrement de la langue : le pays de sa dernière connexion en donne une approximation.
    const fromCountry = localeFromCountry(row?.country)
    if (fromCountry) return fromCountry
  } catch (error) {
    log.warn({ err: error }, 'email locale lookup failed')
  }
  return opts.requestFallback ? requestLocale() : undefined
}
