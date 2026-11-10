/**
 * Diafane : le lien qui ouvre l'administration du portail depuis celle de
 * Diafane, en un clic, sans repasser par le code envoyé par mail (PLAN #651
 * de Diafane, demande de Seb du 2026-09-29).
 *
 * Le serveur de Diafane appelle `POST /api/v1/admin/login-link` avec le jeton
 * `ADMIN_API_TOKEN` (la même porte que `/api/v1/admin/usage`), et reçoit un
 * lien de connexion à USAGE UNIQUE, valable UNE MINUTE, qu'il donne aussitôt
 * au navigateur de l'administrateur.
 *
 * ⚠️ LE LIEN N'OUVRE QU'UN SEUL COMPTE, celui que nomme `ADMIN_LOGIN_EMAIL`,
 * et seulement s'il est ADMINISTRATEUR du portail. L'adresse ne vient JAMAIS
 * de la requête : un jeton volé ne peut donc pas ouvrir le compte de
 * quelqu'un d'autre, ni créer un compte d'équipe. Et comme pour les codes de
 * secours, le lien est fabriqué SANS passer par la route de connexion
 * publique (`mintMagicLinkUrl`), dont le quota de trois essais par quart
 * d'heure ne concerne que les demandes faites à la main.
 */
import { db, eq, principal, sql, user } from '@/lib/server/db'
import { recordAuditEvent } from '@/lib/server/audit/log'
import { mintMagicLinkUrl } from '@/lib/server/auth/magic-link-mint'

/** Une minute : le temps d'une redirection, pas celui d'un mail oublié. */
export const DUREE_LIEN_ADMIN_SECONDES = 60

/** Où l'on atterrit quand aucune destination valable n'est demandée. */
export const DESTINATION_PAR_DEFAUT = '/admin'

/**
 * LA DESTINATION D'UN LIEN (PLAN #731 de Diafane) : le lien d'une alerte
 * Telegram ouvre directement la conversation ou l'idée, déjà connecté en
 * équipe, au lieu de l'accueil de l'administration.
 *
 * ⚠️ UN CHEMIN INTERNE ET RIEN D'AUTRE, sinon c'est une redirection ouverte
 * dont le jeton volé ferait un lien de phishing signé par le portail. Sont
 * acceptés : `/admin`, ses sous-pages et une chaîne de requête simple
 * (`/admin/inbox?c=conversation_x`), et la page d'une idée
 * (`/b/<tableau>/posts/<id>`). Rien d'autre : ni adresse complète, ni `//`, ni
 * `\`, ni `..`, ni caractère de contrôle ou espace. Une destination refusée
 * retombe silencieusement sur `/admin` : le lien ne mène jamais à une erreur.
 */
const CHEMIN_AUTORISE = /^\/(?:admin|b)(?:\/[A-Za-z0-9._~-]+)*(?:\?[A-Za-z0-9_.~%=&-]*)?$/

export function destinationAdmin(vers: unknown): string {
  if (typeof vers !== 'string' || vers.length === 0 || vers.length > 300) {
    return DESTINATION_PAR_DEFAUT
  }
  if (vers.includes('..') || !CHEMIN_AUTORISE.test(vers)) return DESTINATION_PAR_DEFAUT
  return vers
}

export type ResultatLienAdmin =
  | { ok: true; url: string }
  | { ok: false; statut: 404 | 403; erreur: 'not_configured' | 'not_admin' }

export async function fabriquerLienAdmin(opts: {
  /** `ADMIN_LOGIN_EMAIL`, lu par l'appelant. */
  email: string | undefined
  /** L'origine publique du portail, `config.baseUrl`. */
  portalUrl: string
  headers?: Headers
  /** La page voulue après la connexion (`destinationAdmin` la contrôle). */
  vers?: unknown
}): Promise<ResultatLienAdmin> {
  const email = opts.email?.trim().toLowerCase()
  if (!email) return { ok: false, statut: 404, erreur: 'not_configured' }

  const userRow = await db.query.user.findFirst({
    where: sql`LOWER(${user.email}) = ${email}`,
    columns: { id: true, email: true },
  })
  const principalRow = userRow
    ? await db.query.principal.findFirst({
        where: eq(principal.userId, userRow.id),
        columns: { role: true },
      })
    : null

  if (!userRow || principalRow?.role !== 'admin') {
    await recordAuditEvent({
      event: 'auth.diafane_admin_link.minted',
      outcome: 'failure',
      actor: { email },
      headers: opts.headers,
      metadata: { reason: userRow ? 'not_admin' : 'unknown_email' },
    })
    return { ok: false, statut: 403, erreur: 'not_admin' }
  }

  const destination = destinationAdmin(opts.vers)
  const { url } = await mintMagicLinkUrl({
    email: userRow.email ?? email,
    callbackPath: destination,
    // Un lien expiré ou déjà servi retombe sur la connexion ordinaire de
    // l'équipe, qui revient à la même page, jamais sur une page d'erreur.
    errorCallbackPath: `/auth/login?callbackUrl=${encodeURIComponent(destination)}`,
    portalUrl: opts.portalUrl,
    expiresInSeconds: DUREE_LIEN_ADMIN_SECONDES,
  })

  await recordAuditEvent({
    event: 'auth.diafane_admin_link.minted',
    outcome: 'success',
    actor: { userId: userRow.id, email: userRow.email, role: 'admin' },
    headers: opts.headers,
  })

  return { ok: true, url }
}
