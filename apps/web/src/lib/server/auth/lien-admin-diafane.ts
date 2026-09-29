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

export type ResultatLienAdmin =
  | { ok: true; url: string }
  | { ok: false; statut: 404 | 403; erreur: 'not_configured' | 'not_admin' }

export async function fabriquerLienAdmin(opts: {
  /** `ADMIN_LOGIN_EMAIL`, lu par l'appelant. */
  email: string | undefined
  /** L'origine publique du portail, `config.baseUrl`. */
  portalUrl: string
  headers?: Headers
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

  const { url } = await mintMagicLinkUrl({
    email: userRow.email ?? email,
    callbackPath: '/admin',
    // Un lien expiré ou déjà servi retombe sur la connexion ordinaire de
    // l'équipe, jamais sur une page d'erreur.
    errorCallbackPath: '/auth/login?callbackUrl=/admin',
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
