// @vitest-environment happy-dom
/**
 * L'onglet « Vos idees » (Seb 2026-11-24) : le tableau (proposer, rechercher, trier, une carte par idee), les etats
 * vides, et l'ecran « Proposer une idee » avec son bouton « Proposer l'idee ».
 */
import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IntlProvider } from 'react-intl'

vi.mock('@/lib/server/functions/public-posts', () => ({
  listPublicPostsFn: vi.fn(async () => ({ items: [], total: 0, hasMore: false })),
  createPublicPostFn: vi.fn(),
}))
vi.mock('@/lib/client/widget-bridge', () => ({ sendToHost: vi.fn() }))
vi.mock('@/lib/client/widget-auth', () => ({ getWidgetAuthHeaders: vi.fn(() => ({})) }))
vi.mock('@/lib/client/hooks/use-image-upload', () => ({
  useWidgetImageUpload: () => ({ upload: vi.fn() }),
}))
vi.mock('@/lib/client/hooks/use-infinite-scroll', () => ({
  useInfiniteScroll: () => ({ current: null }),
}))
vi.mock('@/lib/client/hooks/use-pills-scroll', () => ({
  usePillsScroll: () => ({
    ref: { current: null },
    canScrollLeft: false,
    canScrollRight: false,
    scrollBy: vi.fn(),
  }),
}))
vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="editeur">{placeholder}</div>
  ),
}))
vi.mock('../widget-vote-button', () => ({
  WidgetVoteButton: () => <button type="button">vote</button>,
}))
vi.mock('../widget-auth-provider', () => ({
  useWidgetAuth: () => ({
    ensureSession: vi.fn(),
    ensureSessionThen: vi.fn(),
    isIdentified: true,
    hmacRequired: false,
    user: { name: 'Sebastien', email: 's@example.org', avatarUrl: null },
    emitEvent: vi.fn(),
    metadata: null,
    identifyWithEmail: vi.fn(),
  }),
}))

import { WidgetHomeAnimated } from '../widget-home-animated'

const board = { id: 'b1', name: 'Idees', slug: 'idees' }
const post = (id: string, title: string, commentCount = 0) => ({
  id,
  title,
  voteCount: 3,
  statusId: 's1',
  commentCount,
  board,
})

function monter(props: Partial<React.ComponentProps<typeof WidgetHomeAnimated>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onComposingChange = vi.fn()
  const rendu = render(
    <QueryClientProvider client={client}>
      <IntlProvider locale="en" messages={{}}>
        <WidgetHomeAnimated
          initialPosts={[post('p1', 'Premiere idee', 2), post('p2', 'Seconde idee')]}
          statuses={[{ id: 's1', name: 'Planned', color: '#48702f' }]}
          boards={[board]}
          boardPermissions={{ b1: { canSubmit: true, canVote: true } }}
          onComposingChange={onComposingChange}
          {...props}
        />
      </IntlProvider>
    </QueryClientProvider>
  )
  return { onComposingChange, ...rendu }
}

afterEach(cleanup)

describe('WidgetHomeAnimated : le tableau des idees', () => {
  it('une carte par idee, avec son etat et ses commentaires, et le bouton pour proposer', () => {
    const { onComposingChange } = monter()
    expect(screen.getByText('Premiere idee')).toBeTruthy()
    expect(screen.getByText('Seconde idee')).toBeTruthy()
    expect(screen.getAllByText('Planned')).toHaveLength(2)
    expect(screen.getByText('2')).toBeTruthy()
    fireEvent.click(screen.getByText('Propose an idea'))
    expect(onComposingChange).toHaveBeenCalledWith(true)
  })

  it('propose de trier les idees : populaires ou recentes', () => {
    monter()
    expect(screen.getByText('Popular').getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByText('Recent'))
    expect(screen.getByText('Recent').getAttribute('aria-pressed')).toBe('true')
  })

  it("aucune idee : l'etat vide, avec le bouton pour proposer la premiere", async () => {
    const { onComposingChange } = monter({ initialPosts: [] })
    expect(await screen.findByText('No ideas yet')).toBeTruthy()
    const boutons = screen.getAllByText('Propose an idea')
    expect(boutons).toHaveLength(2)
    fireEvent.click(boutons[1])
    expect(onComposingChange).toHaveBeenCalledWith(true)
  })

  it('une recherche sans resultat ne repete pas la recherche, et le bouton la reprend', async () => {
    const longue = "exporter tous les gabarits d'un projet au format DXF pour ma decoupeuse laser"
    globalThis.fetch = vi.fn(async () => ({ json: async () => ({ data: { posts: [] } }) })) as never
    const { onComposingChange } = monter()
    fireEvent.change(screen.getByLabelText('Search ideas'), { target: { value: longue } })
    expect(
      await screen.findByText('No idea matches your search.', {}, { timeout: 2000 })
    ).toBeTruthy()
    // seul le champ porte la recherche
    expect(screen.queryAllByText(longue)).toHaveLength(0)
    expect((screen.getByLabelText('Search ideas') as HTMLInputElement).value).toBe(longue)
    fireEvent.click(screen.getByText('Propose this idea'))
    expect(onComposingChange).toHaveBeenCalledWith(true)
  })
})

describe('WidgetHomeAnimated : proposer une idee', () => {
  it("le titre, la description et le bouton « Proposer l'idee », sans bouton Annuler", () => {
    monter({ composing: true })
    expect(screen.getByLabelText('Title')).toBeTruthy()
    expect(screen.getByText('Description')).toBeTruthy()
    expect(screen.getByTestId('editeur')).toBeTruthy()
    const bouton = screen.getByText('Propose the idea').closest('button')!
    expect(bouton.getAttribute('type')).toBe('submit')
    expect((bouton as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('Cancel')).toBeNull()
  })

  it("le bouton s'active des qu'il y a un titre", async () => {
    monter({ composing: true })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Une idee' } })
    await waitFor(() =>
      expect(
        (screen.getByText('Propose the idea').closest('button') as HTMLButtonElement).disabled
      ).toBe(false)
    )
    await act(async () => {})
  })
})
