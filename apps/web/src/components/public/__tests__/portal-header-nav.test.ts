import { describe, it, expect } from 'vitest'
import { buildNavItems, estLienExterne, DIAFANE, type PortalNavItem } from '../portal-header-nav'
import en from '@/locales/en.json'
import it_ from '@/locales/it.json'
import nl from '@/locales/nl.json'

/** Ce qu'une entree ouvre : sa route interne, ou son adresse hors du portail. */
const cible = (item: PortalNavItem) => (estLienExterne(item) ? item.href : item.to)

describe('buildNavItems', () => {
  it('returns guides then feedback when nothing else is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: false, supportEnabled: false })
    expect(items.map(cible)).toEqual(['https://diafane.com/guides', '/'])
  })

  it('adds Help tab when help center is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: false })
    expect(items.map(cible)).toEqual(['https://diafane.com/guides', '/', '/hc'])
  })

  it('adds Support tab when portal support is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: false, supportEnabled: true })
    expect(items.map(cible)).toEqual(['https://diafane.com/guides', '/', '/support'])
  })

  it('orders Help before Support when both are enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.map(cible)).toEqual(['https://diafane.com/guides', '/', '/hc', '/support'])
  })

  // Elles etaient masquees par la feuille d'habillage. Les retirer ici ne
  // ferme PAS leurs pages, qui restaient servies a qui tapait l'adresse :
  // `/changelog` est ferme par sa redirection (`nouveautes-du-portail.ts`),
  // `/roadmap` reste servie.
  it('carries neither Roadmap nor Changelog', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.map(cible)).not.toContain('/roadmap')
    expect(items.map(cible)).not.toContain('/changelog')
  })

  // Decision de Seb : le bouton Guides mene a l'adresse NUE `/guides`, sans langue
  // ni ancien segment `/aide` : Diafane negocie lui-meme la langue du visiteur.
  // Elle repond 404 tant que la production de Diafane ne l'a pas recue (comme
  // l'ancienne `/en/aide` le fait deja pour le public), puis marche d'elle-meme.
  it('points the guides at the bare Diafane address, which negotiates the language', () => {
    expect(DIAFANE.guides).toBe('https://diafane.com/guides')
    expect(DIAFANE.guides).not.toMatch(/\/(en|fr|de|es|it|nl)\//)
    expect(DIAFANE.guides).not.toContain('/aide')
  })

  // Le routeur du portail chercherait cette adresse chez lui : c'est cette
  // distinction qui fait rendre un `<a>` plutot qu'un `<Link>`.
  it('marks only the guides as leaving the portal', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.filter(estLienExterne).map((i) => i.href)).toEqual(['https://diafane.com/guides'])
  })

  // Une entree dont la cle manque aux catalogues s'affiche en anglais dans toutes
  // les langues : c'etait le cas de l'onglet Centre d'aide.
  it('only uses message ids that every catalog defines, Italian and Dutch included', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items).toHaveLength(4)
    for (const { messageId } of items) {
      expect(messageId in en, `${messageId} missing from en.json`).toBe(true)
      expect(messageId in it_, `${messageId} missing from it.json`).toBe(true)
      expect(messageId in nl, `${messageId} missing from nl.json`).toBe(true)
    }
  })
})
