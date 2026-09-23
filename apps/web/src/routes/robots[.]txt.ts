import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        // DIAFANE : le portail ne se refere pas. Les idees restent LISIBLES
        // sans compte (decision D3), elles cessent seulement d'etre indexees
        // (decision de Seb du 2026-09-22 : « feedback n'a pas besoin d'etre
        // reference, mais les guides oui, absolument »). Les guides vivent sur
        // diafane.com, et c'est la que l'autorite doit s'accumuler : un second
        // site qui sort sur une recherche de marque avec seize idees en anglais
        // fait moins bonne impression que rien du tout.
        //
        // La ligne `Sitemap:` part AVEC : sans elle, plus rien n'annonce
        // l'accueil, la feuille de route ni chaque idee (`/b/{tableau}/posts/{id}`).
        // La garder tout en refusant l'exploration serait une contradiction.
        //
        // ⚠️ A REAPPLIQUER A CHAQUE MONTEE DE VERSION, comme le correctif des
        // images MinIO. Verification en dix secondes : `/robots.txt` du portail.
        const body = `User-agent: *
Disallow: /
`

        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        })
      },
    },
  },
})
