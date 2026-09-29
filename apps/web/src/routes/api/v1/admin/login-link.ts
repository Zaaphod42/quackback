import { createFileRoute } from '@tanstack/react-router'
import { authenticateAdminToken } from '@/lib/server/domains/api-keys/admin-token-auth'
import { fabriquerLienAdmin } from '@/lib/server/auth/lien-admin-diafane'
import { config } from '@/lib/server/config'

/**
 * POST /api/v1/admin/login-link
 *
 * Diafane : rend un lien de connexion à usage unique, valable une minute,
 * vers l'administration du portail, pour le seul compte `ADMIN_LOGIN_EMAIL`
 * (`lien-admin-diafane.ts` dit pourquoi l'adresse ne vient pas de la
 * requête). Même garde que `/api/v1/admin/usage` : `ADMIN_API_TOKEN` absent,
 * la route n'existe pas (404).
 */
export const Route = createFileRoute('/api/v1/admin/login-link')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateAdminToken(request)
        if (auth) return auth

        const resultat = await fabriquerLienAdmin({
          email: process.env.ADMIN_LOGIN_EMAIL,
          portalUrl: config.baseUrl,
          headers: request.headers,
        })

        if (!resultat.ok) {
          return new Response(JSON.stringify({ error: resultat.erreur }), {
            status: resultat.statut,
            headers: { 'content-type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ url: resultat.url }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        })
      },
    },
  },
})
