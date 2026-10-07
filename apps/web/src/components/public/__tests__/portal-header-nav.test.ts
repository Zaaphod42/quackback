import { describe, it, expect } from 'vitest'
import {
  barreDiafane,
  DIAFANE,
  resolvePortalNavItems,
  seedNavEditorItems,
  type PortalNavGates,
  type PortalNavItem,
} from '../portal-header-nav'
import type { PortalNavConfig } from '@/lib/shared/types/settings'

function gates(overrides: Partial<PortalNavGates> = {}): PortalNavGates {
  return {
    feedback: true,
    roadmap: true,
    changelog: true,
    help: false,
    support: false,
    status: false,
    ...overrides,
  }
}

function paths(items: PortalNavItem[]): string[] {
  return items.map((i) => (i.kind === 'builtin' ? i.to : i.href))
}

describe('resolvePortalNavItems (no config = legacy defaults)', () => {
  it('returns feedback/roadmap/changelog when help center is disabled', () => {
    expect(paths(resolvePortalNavItems(gates()))).toEqual(['/', '/roadmap', '/changelog'])
  })

  it('adds Help tab when help center is enabled', () => {
    expect(paths(resolvePortalNavItems(gates({ help: true })))).toEqual([
      '/',
      '/roadmap',
      '/changelog',
      '/hc',
    ])
  })

  it('orders Help before Support when both are enabled', () => {
    expect(paths(resolvePortalNavItems(gates({ help: true, support: true })))).toEqual([
      '/',
      '/roadmap',
      '/changelog',
      '/hc',
      '/support',
    ])
  })

  it('drops Feedback and Roadmap when the Feedback product is disabled', () => {
    expect(
      paths(resolvePortalNavItems(gates({ feedback: false, roadmap: false, help: true })))
    ).toEqual(['/changelog', '/hc'])
  })

  it('treats an empty items array like absent config', () => {
    expect(paths(resolvePortalNavItems(gates(), { items: [] }))).toEqual([
      '/',
      '/roadmap',
      '/changelog',
    ])
  })
})

describe('resolvePortalNavItems (configured)', () => {
  const reordered: PortalNavConfig = {
    items: [
      { id: 'changelog', type: 'changelog' },
      { id: 'feedback', type: 'feedback' },
      { id: 'roadmap', type: 'roadmap' },
    ],
  }

  it('respects the configured order', () => {
    expect(paths(resolvePortalNavItems(gates(), reordered))).toEqual([
      '/changelog',
      '/',
      '/roadmap',
    ])
  })

  it('hides items with enabled: false', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'feedback', type: 'feedback' },
        { id: 'roadmap', type: 'roadmap', enabled: false },
        { id: 'changelog', type: 'changelog' },
      ],
    }
    expect(paths(resolvePortalNavItems(gates(), nav))).toEqual(['/', '/changelog'])
  })

  it('ignores enabled: false on the built-in feedback item', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'feedback', type: 'feedback', enabled: false },
        { id: 'roadmap', type: 'roadmap' },
      ],
    }
    expect(paths(resolvePortalNavItems(gates(), nav))).toEqual(['/', '/roadmap', '/changelog'])
  })

  it('never shows a gated-off built-in even when enabled in config', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'feedback', type: 'feedback' },
        { id: 'status', type: 'status', enabled: true },
      ],
    }
    expect(paths(resolvePortalNavItems(gates({ status: false }), nav))).toEqual([
      '/',
      '/roadmap',
      '/changelog',
    ])
  })

  it('applies label overrides and keeps i18n metadata when absent', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'feedback', type: 'feedback', label: 'Ideas' },
        { id: 'roadmap', type: 'roadmap' },
      ],
    }
    const items = resolvePortalNavItems(gates({ changelog: false }), nav)
    expect(items[0]).toMatchObject({ kind: 'builtin', label: 'Ideas', to: '/' })
    expect(items[1]).toMatchObject({
      kind: 'builtin',
      label: undefined,
      messageId: 'portal.header.nav.roadmap',
    })
  })

  it('appends gate-passing built-ins missing from the config in default order', () => {
    // Config saved before the Status product existed; status is now enabled.
    const nav: PortalNavConfig = {
      items: [
        { id: 'changelog', type: 'changelog' },
        { id: 'feedback', type: 'feedback' },
      ],
    }
    expect(paths(resolvePortalNavItems(gates({ status: true }), nav))).toEqual([
      '/changelog',
      '/',
      '/roadmap',
      '/status',
    ])
  })

  it('renders enabled custom links and drops disabled or unsafe ones', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'feedback', type: 'feedback' },
        { id: 'l1', type: 'link', label: 'Community', url: 'https://discord.gg/acme' },
        { id: 'l2', type: 'link', label: 'Hidden', url: 'https://x.com', enabled: false },

        { id: 'l3', type: 'link', label: 'Evil', url: 'javascript:alert(1)' },
        { id: 'l4', type: 'link', label: 'No URL' },
      ],
    }
    const items = resolvePortalNavItems(
      gates({ roadmap: false, changelog: false, feedback: true }),
      nav
    )
    expect(items).toHaveLength(2)
    expect(items[1]).toMatchObject({
      kind: 'link',
      href: 'https://discord.gg/acme',
      label: 'Community',
      newTab: true,
    })
  })

  it('honors newTab: false on links', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'l1', type: 'link', label: 'Docs', url: 'https://docs.acme.com', newTab: false },
      ],
    }
    const items = resolvePortalNavItems(
      gates({ feedback: false, roadmap: false, changelog: false }),
      nav
    )
    expect(items[0]).toMatchObject({ kind: 'link', newTab: false })
  })
})

describe('seedNavEditorItems', () => {
  it('returns all built-ins in default order when config is absent', () => {
    expect(seedNavEditorItems(null).map((i) => i.type)).toEqual([
      'feedback',
      'roadmap',
      'changelog',
      'help',
      'support',
      'status',
    ])
  })

  it('keeps saved order and appends missing built-ins', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'changelog', type: 'changelog' },
        { id: 'l1', type: 'link', label: 'Community', url: 'https://discord.gg/acme' },
        { id: 'feedback', type: 'feedback', enabled: false },
      ],
    }
    expect(seedNavEditorItems(nav).map((i) => i.type)).toEqual([
      'changelog',
      'link',
      'feedback',
      'roadmap',
      'help',
      'support',
      'status',
    ])
  })

  it('returns copies, not references into the config', () => {
    const nav: PortalNavConfig = { items: [{ id: 'feedback', type: 'feedback' }] }
    const seeded = seedNavEditorItems(nav)
    seeded[0].enabled = false
    expect(nav.items?.[0].enabled).toBeUndefined()
  })
})

// DIAFANE : la barre du hub, posee APRES le reglage de l'administration.
describe('barreDiafane', () => {
  const barre = (overrides: Partial<PortalNavGates> = {}, nav?: PortalNavConfig) =>
    barreDiafane(resolvePortalNavItems(gates(overrides), nav))

  it('returns guides then feedback when nothing else is enabled', () => {
    expect(paths(barre())).toEqual(['https://diafane.com/en/aide', '/'])
  })

  it('adds Help tab when help center is enabled', () => {
    expect(paths(barre({ help: true }))).toEqual(['https://diafane.com/en/aide', '/', '/hc'])
  })

  it('adds Support tab when portal support is enabled', () => {
    expect(paths(barre({ support: true }))).toEqual([
      'https://diafane.com/en/aide',
      '/',
      '/support',
    ])
  })

  it('orders Help before Support when both are enabled', () => {
    expect(paths(barre({ help: true, support: true }))).toEqual([
      'https://diafane.com/en/aide',
      '/',
      '/hc',
      '/support',
    ])
  })

  // Elles etaient masquees par la feuille d'habillage, donc vivantes et
  // atteignables en tapant l'adresse. Les retirer ici est ce qui les ferme,
  // y compris quand le reglage de l'administration les remet dans la barre.
  it('carries neither Roadmap nor Changelog, whatever the admin config says', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'changelog', type: 'changelog', enabled: true },
        { id: 'roadmap', type: 'roadmap', enabled: true },
        { id: 'feedback', type: 'feedback' },
      ],
    }
    for (const items of [barre({ help: true, support: true }), barre({}, nav)]) {
      expect(paths(items)).not.toContain('/roadmap')
      expect(paths(items)).not.toContain('/changelog')
    }
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

  // Le routeur du portail chercherait cette adresse chez lui : c'est le
  // `kind: 'link'` qui fait rendre un `<a>` plutot qu'un `<Link>`, et la cle
  // qui le traduit. Il s'ouvre dans le meme onglet, comme le reste du hub.
  it('marks only the guides as leaving the portal', () => {
    const liens = barre({ help: true, support: true }).filter((i) => i.kind === 'link')
    expect(liens).toEqual([
      expect.objectContaining({
        href: 'https://diafane.com/en/aide',
        messageId: 'portal.header.nav.guides',
        newTab: false,
      }),
    ])
  })

  it('keeps the links added in the admin, after the guides', () => {
    const nav: PortalNavConfig = {
      items: [
        { id: 'feedback', type: 'feedback' },
        { id: 'l1', type: 'link', label: 'Community', url: 'https://discord.gg/acme' },
      ],
    }
    expect(paths(barre({}, nav))).toEqual([
      'https://diafane.com/en/aide',
      '/',
      'https://discord.gg/acme',
    ])
  })
})
