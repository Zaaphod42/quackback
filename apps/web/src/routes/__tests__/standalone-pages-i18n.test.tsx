// @vitest-environment happy-dom
/**
 * The standalone pages (outside the portal layout) that a visitor reaches from
 * an e-mail or from the widget: unsubscribe, portal invite, sign-in hand-off and
 * sign-in completion. They load the language and its catalog themselves
 * (`beforeLoad` -> `loadPortalIntl`) and render under a PortalIntlProvider, so
 * their texts follow the visitor's language from the first render.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import it_ from '@/locales/it.json'
import nl from '@/locales/nl.json'

const state: { intl: { locale: string; messages: Record<string, string> }; data: unknown } = {
  intl: { locale: 'en', messages: {} },
  data: null,
}

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useRouteContext: () => ({ intl: state.intl }),
    useLoaderData: () => state.data,
    useParams: () => ({ inviteId: 'invite_1' }),
  }),
  redirect: (opts: unknown) => opts,
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}))
vi.mock('@/lib/server/functions/locale', () => ({
  loadPortalIntl: vi.fn(async () => state.intl),
}))
vi.mock('@/lib/server/functions/subscriptions', () => ({ processUnsubscribeTokenFn: vi.fn() }))
vi.mock('@/lib/server/functions/portal-invites', () => ({ acceptPortalInviteFn: vi.fn() }))
vi.mock('@/lib/client/hooks/use-auth-broadcast', () => ({ postAuthSuccess: vi.fn() }))
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const chain = {
      validator: () => chain,
      handler: (fn: unknown) => fn,
    }
    return chain
  },
  createServerOnlyFn: (fn: unknown) => fn,
}))
vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeaders: () => new Headers(),
  setResponseHeader: vi.fn(),
}))
vi.mock('@/lib/server/db', () => ({}))
vi.mock('@/lib/server/config', () => ({ config: { baseUrl: 'http://localhost' } }))
vi.mock('@/lib/server/audit/log', () => ({ recordAuditEvent: vi.fn() }))

function component(route: unknown): () => ReactNode {
  return (route as { options: { component: () => ReactNode } }).options.component
}

function renderPage(route: unknown, locale: 'it' | 'nl', data: unknown) {
  state.intl = { locale, messages: locale === 'it' ? it_ : nl }
  state.data = data
  const Page = component(route)
  return render(<Page />)
}

beforeEach(() => {
  state.intl = { locale: 'en', messages: {} }
  state.data = null
})

describe('unsubscribe page', () => {
  it('loads its own language in beforeLoad', async () => {
    const { Route } = await import('../unsubscribe')
    const { beforeLoad } = (Route as unknown as { options: { beforeLoad: () => Promise<unknown> } })
      .options
    state.intl = { locale: 'nl', messages: nl }
    expect(await beforeLoad()).toEqual({ intl: { locale: 'nl', messages: nl } })
  })

  it('confirms the unsubscription in Italian, with the post title in bold', async () => {
    const { Route } = await import('../unsubscribe')
    const { container } = renderPage(Route, 'it', {
      success: true,
      action: 'unsubscribe_post',
      postTitle: 'Più colori',
      postId: 'post_1',
      boardSlug: 'idee',
    })
    expect(container.textContent).toContain('Iscrizione annullata')
    expect(container.textContent).toContain("L'iscrizione a questo post è stata annullata.")
    expect(container.textContent).toContain('Post: Più colori')
    expect(container.querySelector('span.font-medium')?.textContent).toBe('Più colori')
    expect(container.textContent).toContain('Vedi post')
    expect(container.textContent).not.toContain('Unsubscribed')
  })

  it('explains an expired link in Dutch', async () => {
    const { Route } = await import('../unsubscribe')
    const { container } = renderPage(Route, 'nl', { success: false, error: 'expired' })
    expect(container.textContent).toContain('Link verlopen')
    expect(container.textContent).toContain('Deze uitschrijflink is al gebruikt of verlopen.')
    expect(container.textContent).toContain('Naar de startpagina')
  })

  it('stays in English when no catalog is loaded', async () => {
    const { Route } = await import('../unsubscribe')
    state.intl = { locale: 'en', messages: {} }
    state.data = { success: false, error: 'missing' }
    const Page = component(Route)
    const { container } = render(<Page />)
    expect(container.textContent).toContain('Missing Token')
  })
})

describe('portal invite page', () => {
  it('names the problem in Italian', async () => {
    const { Route } = await import('../portal-invite.$inviteId')
    const { container } = renderPage(Route, 'it', { status: 'mismatch' })
    expect(container.textContent).toContain('Account errato')
    expect(container.textContent).toContain(
      'Questo invito è stato inviato a un altro indirizzo e-mail.'
    )
    expect(container.textContent).toContain('Vai al portale')
  })

  it('shows the unexpected-error message in Dutch', async () => {
    const { Route } = await import('../portal-invite.$inviteId')
    const { container } = renderPage(Route, 'nl', { status: 'error' })
    expect(container.textContent).toContain('Er is iets misgegaan')
    expect(container.textContent).toContain('onverwachte fout')
  })
})

describe('sign-in completion page', () => {
  it('announces the success in Italian', async () => {
    const { Route } = await import('../auth.auth-complete')
    const { container } = renderPage(Route, 'it', null)
    // The page flips from "completing" to "signed in" in an effect.
    expect(container.textContent).toContain('Accesso effettuato!')
    expect(container.textContent).toContain('La finestra si chiuderà automaticamente.')
  })
})

describe('widget hand-off page', () => {
  it('tells an expired link in Dutch', async () => {
    const { Route } = await import('../auth.widget-handoff')
    const { container } = renderPage(Route, 'nl', { status: 'expired' })
    expect(container.textContent).toContain('Aanmeldlink verlopen')
    expect(container.textContent).toContain('Deze aanmeldlink is verlopen of al gebruikt.')
  })

  it('tells a processing error in Italian', async () => {
    const { Route } = await import('../auth.widget-handoff')
    const { container } = renderPage(Route, 'it', { status: 'error' })
    expect(container.textContent).toContain("Si è verificato un errore durante l'elaborazione")
  })
})
