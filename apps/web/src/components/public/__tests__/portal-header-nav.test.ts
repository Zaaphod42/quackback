import { describe, it, expect } from 'vitest'
import { buildNavItems, estLienExterne, type PortalNavItem } from '../portal-header-nav'

/** Ce qu'une entree ouvre : sa route interne, ou son adresse hors du portail. */
const cible = (item: PortalNavItem) => (estLienExterne(item) ? item.href : item.to)

describe('buildNavItems', () => {
  it('returns guides then feedback when nothing else is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: false, supportEnabled: false })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/guides', '/'])
  })

  it('adds Help tab when help center is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: false })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/guides', '/', '/hc'])
  })

  it('adds Support tab when portal support is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: false, supportEnabled: true })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/guides', '/', '/support'])
  })

  it('orders Help before Support when both are enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/guides', '/', '/hc', '/support'])
  })

  // Elles etaient masquees par la feuille d'habillage, donc vivantes et
  // atteignables en tapant l'adresse. Les retirer ici est ce qui les ferme.
  it('carries neither Roadmap nor Changelog', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.map(cible)).not.toContain('/roadmap')
    expect(items.map(cible)).not.toContain('/changelog')
  })

  // Le routeur du portail chercherait `/en/guides` chez lui : c'est cette
  // distinction qui fait rendre un `<a>` plutot qu'un `<Link>`.
  it('marks only the guides as leaving the portal', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.filter(estLienExterne).map((i) => i.href)).toEqual([
      'https://diafane.com/en/guides',
    ])
  })
})
