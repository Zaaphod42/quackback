import { describe, it, expect } from 'vitest'
import { buildNavItems, estLienExterne, DIAFANE, type PortalNavItem } from '../portal-header-nav'

/** Ce qu'une entree ouvre : sa route interne, ou son adresse hors du portail. */
const cible = (item: PortalNavItem) => (estLienExterne(item) ? item.href : item.to)

describe('buildNavItems', () => {
  it('returns guides then feedback when nothing else is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: false, supportEnabled: false })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/aide', '/'])
  })

  it('adds Help tab when help center is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: false })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/aide', '/', '/hc'])
  })

  it('adds Support tab when portal support is enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: false, supportEnabled: true })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/aide', '/', '/support'])
  })

  it('orders Help before Support when both are enabled', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.map(cible)).toEqual(['https://diafane.com/en/aide', '/', '/hc', '/support'])
  })

  // Elles etaient masquees par la feuille d'habillage, donc vivantes et
  // atteignables en tapant l'adresse. Les retirer ici est ce qui les ferme.
  it('carries neither Roadmap nor Changelog', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.map(cible)).not.toContain('/roadmap')
    expect(items.map(cible)).not.toContain('/changelog')
  })

  // ⚠️ LE SEGMENT EST `aide`, PAS `guides`, ET C'EST VOULU : la production de
  // Diafane sert encore l'ancien nom, le nouveau n'existant que sur `staging`.
  // L'ancienne adresse redirige vers la nouvelle une fois la promotion faite,
  // donc ce lien vaut avant et apres ; l'inverse ne vaudrait qu'apres, et le
  // bouton rendait un 404 (Seb 2026-09-23 : « le bouton guides dans le header
  // donne une 404 »). A changer le jour ou la prod porte `guides`, pas avant.
  it('points the guides at the segment production really serves', () => {
    expect(DIAFANE.guides).toBe('https://diafane.com/en/aide')
  })

  // Le routeur du portail chercherait cette adresse chez lui : c'est cette
  // distinction qui fait rendre un `<a>` plutot qu'un `<Link>`.
  it('marks only the guides as leaving the portal', () => {
    const items = buildNavItems({ helpCenterEnabled: true, supportEnabled: true })
    expect(items.filter(estLienExterne).map((i) => i.href)).toEqual(['https://diafane.com/en/aide'])
  })
})
