// @vitest-environment happy-dom
/**
 * La racine de l'onglet Assistance (Seb 2026-11-24) : aucune conversation -> on arrive DIRECTEMENT dans une
 * nouvelle conversation ; des conversations -> la liste, avec le bouton « Nouvelle conversation » ; et le choix ne
 * change plus une fois fait, meme quand la premiere conversation vient d'etre creee.
 */
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IntlProvider } from 'react-intl'

const { getMyConversationsFn } = vi.hoisted(() => ({ getMyConversationsFn: vi.fn() }))
vi.mock('@/lib/server/functions/chat', () => ({ getMyConversationsFn }))
vi.mock('@/lib/client/widget-auth', () => ({ getWidgetAuthHeaders: vi.fn(() => ({})) }))
vi.mock('../widget-live-chat', () => ({
  WidgetLiveChat: (p: { conversationTarget?: string }) => (
    <div data-testid="chat" data-cible={p.conversationTarget} />
  ),
}))
vi.mock('../use-chat-summary', () => ({ useChatSummary: () => ({ teamName: 'Diafane support' }) }))
vi.mock('@/components/ui/time-ago', () => ({ TimeAgo: () => <span>il y a 2 mois</span> }))

import { WidgetAssistance } from '../widget-assistance'

function monter(onOpenChat = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, throwOnError: false } },
  })
  const rendu = render(
    <QueryClientProvider client={client}>
      <IntlProvider locale="fr" messages={{}}>
        <WidgetAssistance onOpenChat={onOpenChat} />
      </IntlProvider>
    </QueryClientProvider>
  )
  return { client, onOpenChat, ...rendu }
}

const conv = (id: string, subject: string | null, preview: string) => ({
  id,
  subject,
  lastMessagePreview: preview,
  status: 'open',
  lastMessageAt: '2026-09-12T10:00:00Z',
})

beforeEach(() => getMyConversationsFn.mockReset())
afterEach(cleanup)

describe('WidgetAssistance', () => {
  it('sans conversation : directement une nouvelle conversation, ni liste ni bouton', async () => {
    getMyConversationsFn.mockResolvedValue({ conversations: [] })
    monter()
    const chat = await screen.findByTestId('chat')
    expect(chat.getAttribute('data-cible')).toBe('new')
    expect(screen.queryByText('New conversation')).toBeNull()
  })

  it('avec des conversations : le bouton, puis une carte par conversation', async () => {
    getMyConversationsFn.mockResolvedValue({
      conversations: [conv('c1', 'Export des gabarits', 'Merci'), conv('c2', null, 'Hello ?')],
    })
    const { onOpenChat } = monter()
    expect(await screen.findByText('New conversation')).toBeTruthy()
    expect(screen.getByText('Export des gabarits')).toBeTruthy()
    expect(screen.getByText('Hello ?')).toBeTruthy()
    expect(screen.queryByTestId('chat')).toBeNull()
    act(() => screen.getByText('New conversation').closest('button')!.click())
    expect(onOpenChat).toHaveBeenCalledWith('new')
    act(() => screen.getByText('Export des gabarits').closest('button')!.click())
    expect(onOpenChat).toHaveBeenCalledWith('c1')
  })

  it('le choix est fait une fois : la premiere conversation creee ne bascule pas sur la liste', async () => {
    getMyConversationsFn.mockResolvedValue({ conversations: [] })
    const { client } = monter()
    await screen.findByTestId('chat')
    getMyConversationsFn.mockResolvedValue({ conversations: [conv('c1', null, 'Bonjour')] })
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['widget', 'my-conversations'] })
    })
    await waitFor(() => expect(getMyConversationsFn).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('chat')).toBeTruthy()
    expect(screen.queryByText('New conversation')).toBeNull()
  })
})
