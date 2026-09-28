import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { defaultStringifySearch } from '@tanstack/react-router'
import { versIdeesRealisees } from '../nouveautes-du-portail'

/** Le texte d'un fichier de `src/routes`, lu depuis le disque. */
const route = (chemin: string) =>
  readFileSync(fileURLToPath(new URL(`../../../routes/${chemin}`, import.meta.url)), 'utf8')

describe('versIdeesRealisees', () => {
  it('mène au tableau filtré sur les idées réalisées, sans empiler l’historique', () => {
    expect(versIdeesRealisees()).toEqual({
      to: '/',
      search: { status: ['complete'] },
      replace: true,
    })
  })

  // `?status=complete` tout court répond 500 sur l'accueil : le filtre doit
  // sortir en LISTE, et c'est le routeur qui l'écrit dans l'adresse.
  it('écrit le filtre en liste dans l’adresse', () => {
    expect(defaultStringifySearch(versIdeesRealisees().search)).toBe('?status=%5B%22complete%22%5D')
  })

  it('reste une redirection temporaire', () => {
    expect(versIdeesRealisees()).not.toHaveProperty('statusCode')
  })
})

// ⚠️ Ce qui suit protège contre une MONTÉE DE VERSION de Quackback : un conflit
// sur ces fichiers résolu en prenant la version de l'amont rouvrirait la page
// des nouveautés sans que rien ne le signale.
describe('les adresses de nouveautés du portail', () => {
  it.each(['_portal/changelog.index.tsx', '_portal/changelog.$entryId.tsx'])(
    '%s ne rend rien et renvoie aux idées réalisées',
    (fichier) => {
      const texte = route(fichier)
      expect(texte).toContain('throw redirect(versIdeesRealisees())')
      expect(texte).not.toMatch(/\bcomponent\s*:/)
      expect(texte).not.toMatch(/\bloader\s*:/)
    }
  )

  it('ne sont plus listées par le sitemap', () => {
    expect(route('sitemap[.]xml.ts')).not.toMatch(/baseUrl\}\/changelog/)
  })

  it('n’annoncent plus de flux RSS depuis la racine', () => {
    expect(route('__root.tsx')).not.toContain('/changelog/feed')
  })
})
