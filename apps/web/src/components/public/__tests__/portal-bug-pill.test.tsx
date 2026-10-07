// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import fr from '@/locales/fr.json'

const { mockRouteContext, mockPathname, mockOuvrirCourriel } = vi.hoisted(() => ({
  mockRouteContext: vi.fn(),
  mockPathname: vi.fn((): string => '/'),
  mockOuvrirCourriel: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: mockPathname() } }),
  useRouteContext: () => mockRouteContext(),
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string
    params?: Record<string, string>
    children: React.ReactNode
    [key: string]: unknown
  }) => {
    const href = Object.entries(params ?? {}).reduce(
      (chemin, [cle, valeur]) => chemin.replace(`$${cle}`, valeur),
      to
    )
    return (
      <a href={href} {...(rest as React.HTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  },
}))

vi.mock('../portal-header-nav', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../portal-header-nav')>()),
  ouvrirCourrielDiafane: mockOuvrirCourriel,
}))

import { PortalBugPill, estPageDeConversation } from '../portal-bug-pill'

const SUPPORT_ALLUME = {
  featureFlags: { supportInbox: true },
  portalConfig: { support: { enabled: true } },
}

function rendre({
  connecte,
  settings = SUPPORT_ALLUME,
  pathname = '/',
  locale = 'en',
  messages,
}: {
  connecte: boolean
  settings?: Record<string, unknown>
  pathname?: string
  locale?: string
  messages?: Record<string, string>
}) {
  mockPathname.mockReturnValue(pathname)
  mockRouteContext.mockReturnValue({
    session: connecte ? { user: { id: 'usr_1', principalType: 'user' } } : null,
    settings,
  })
  return render(
    <IntlProvider locale={locale} defaultLocale="en" messages={messages}>
      <PortalBugPill />
    </IntlProvider>
  )
}

beforeEach(() => {
  mockOuvrirCourriel.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('estPageDeConversation', () => {
  it('reconnait une conversation, la nouvelle comprise', () => {
    expect(estPageDeConversation('/support/new')).toBe(true)
    expect(estPageDeConversation('/support/conversation_01abc')).toBe(true)
    expect(estPageDeConversation('/support/conversation_01abc/')).toBe(true)
  })

  it('laisse la liste des conversations et les autres pages', () => {
    expect(estPageDeConversation('/support')).toBe(false)
    expect(estPageDeConversation('/support/')).toBe(false)
    expect(estPageDeConversation('/')).toBe(false)
    expect(estPageDeConversation('/b/ideas/posts/post_01abc')).toBe(false)
  })
})

describe('PortalBugPill', () => {
  it('ouvre une nouvelle conversation pour une personne connectee', () => {
    rendre({ connecte: true })
    const lien = screen.getByRole('link', { name: 'A bug? A question?' })
    expect(lien.getAttribute('href')).toBe('/support/new')
  })

  it('ouvre un courriel pour un visiteur, sans adresse ecrite dans la page', () => {
    const { container } = rendre({ connecte: false })
    expect(screen.queryByRole('link')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'A bug? A question?' }))
    expect(mockOuvrirCourriel).toHaveBeenCalledTimes(1)
    expect(container.innerHTML).not.toContain('@')
    expect(container.innerHTML).not.toContain('mailto')
  })

  it('ouvre un courriel quand la conversation est eteinte, meme connecte', () => {
    rendre({ connecte: true, settings: {} })
    expect(screen.queryByRole('link')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'A bug? A question?' }))
    expect(mockOuvrirCourriel).toHaveBeenCalledTimes(1)
  })

  it('se tait dans une conversation', () => {
    const { container } = rendre({ connecte: true, pathname: '/support/new' })
    expect(container.innerHTML).toBe('')
  })

  it('reste sur la liste des conversations et sur les idees', () => {
    rendre({ connecte: true, pathname: '/support' })
    expect(screen.getByRole('link', { name: 'A bug? A question?' })).toBeTruthy()
    cleanup()
    rendre({ connecte: false, pathname: '/b/ideas/posts/post_01abc' })
    expect(screen.getByRole('button', { name: 'A bug? A question?' })).toBeTruthy()
  })

  it('parle la langue du visiteur, le texte des guides de Diafane', () => {
    rendre({ connecte: true, locale: 'fr', messages: fr })
    const lien = screen.getByRole('link', { name: 'Un bug ? Une question ?' })
    expect(lien.textContent).toBe('Un bug ? Une question ?')
  })

  it('laisse au contenu la place de la pastille', () => {
    const { container } = rendre({ connecte: false })
    expect(container.querySelector('.portal-bug-pill__place')?.getAttribute('aria-hidden')).toBe(
      'true'
    )
  })
})

describe('ouvrirCourrielDiafane', () => {
  it("compose l'adresse de contact au moment du clic", async () => {
    const { ouvrirCourrielDiafane } =
      await vi.importActual<typeof import('../portal-header-nav')>('../portal-header-nav')
    const origine = window.location
    Object.defineProperty(window, 'location', { value: { href: '' }, configurable: true })
    try {
      ouvrirCourrielDiafane()
      expect(window.location.href).toBe('mailto:hello@diafane.com')
    } finally {
      Object.defineProperty(window, 'location', { value: origine, configurable: true })
    }
  })
})
