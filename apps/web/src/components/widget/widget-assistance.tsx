import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FormattedMessage, useIntl, type MessageDescriptor } from 'react-intl'
import { PlusIcon } from 'lucide-react'
import type { ConversationId } from '@quackback/ids'
import { getMyConversationsFn } from '@/lib/server/functions/chat'
import { getWidgetAuthHeaders } from '@/lib/client/widget-auth'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TimeAgo } from '@/components/ui/time-ago'
import { WidgetLiveChat } from './widget-live-chat'
import { useChatSummary } from './use-chat-summary'

// Meme vocabulaire que la liste du support du portail (`portal.support.status.*`).
const STATUS_LABEL: Record<string, MessageDescriptor> = {
  open: { id: 'portal.support.status.open', defaultMessage: 'Open' },
  pending: { id: 'portal.support.status.pending', defaultMessage: 'Awaiting you' },
  closed: { id: 'portal.support.status.closed', defaultMessage: 'Closed' },
}

type Conversations = Awaited<ReturnType<typeof getMyConversationsFn>>['conversations']

interface WidgetAssistanceProps {
  /** Open a conversation: an id opens that thread, 'new' starts a fresh one. */
  onOpenChat: (target?: ConversationId | 'new') => void
  helpEnabled?: boolean
  onArticleSelect?: (slug: string) => void
  linkPreviews?: boolean
}

/**
 * LA RACINE DE L'ONGLET ASSISTANCE (Seb 2026-11-24). Sans aucune conversation, on arrive DIRECTEMENT dans une
 * nouvelle conversation : pas de liste vide, pas de texte d'accueil. Des qu'il y en a, la liste de toutes les
 * conversations, avec un bouton pour en ouvrir une autre.
 *
 * Le choix se fait UNE fois, a l'ouverture de l'onglet : la premiere conversation creee depuis l'ecran direct ferait
 * sinon basculer la zone sur la liste sous les doigts de la personne qui est en train d'ecrire.
 */
export function WidgetAssistance({
  onOpenChat,
  helpEnabled,
  onArticleSelect,
  linkPreviews,
}: WidgetAssistanceProps) {
  const { data, isError, isPending } = useQuery({
    queryKey: ['widget', 'my-conversations'],
    // Le jeton du widget est a transmettre, sinon la liste revient toujours vide.
    queryFn: () => getMyConversationsFn({ headers: getWidgetAuthHeaders() }),
    staleTime: 30_000,
  })
  const [direct, setDirect] = useState<boolean | null>(null)

  useEffect(() => {
    if (direct !== null) return
    // Une liste illisible ne doit pas empecher d'ecrire : on ouvre la conversation.
    if (isError) setDirect(true)
    else if (data) setDirect(data.conversations.length === 0)
  }, [data, isError, direct])

  if (direct === null || (isPending && !data)) return <div className="h-full" aria-busy="true" />

  if (direct) {
    return (
      <WidgetLiveChat
        key="direct"
        conversationTarget="new"
        helpEnabled={helpEnabled}
        onArticleSelect={onArticleSelect}
        linkPreviews={linkPreviews}
      />
    )
  }

  return <ConversationList conversations={data?.conversations ?? []} onOpenChat={onOpenChat} />
}

function ConversationList({
  conversations,
  onOpenChat,
}: {
  conversations: Conversations
  onOpenChat: (target?: ConversationId | 'new') => void
}) {
  const intl = useIntl()
  const { teamName } = useChatSummary(true)
  const initiales = (teamName ?? 'D').trim().slice(0, 2).toUpperCase()

  return (
    <ScrollArea scrollBarClassName="w-1.5" className="h-full">
      <div className="flex flex-col gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => onOpenChat('new')}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          <PlusIcon className="size-4" />
          <FormattedMessage id="widget.messages.new" defaultMessage="New conversation" />
        </button>

        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <FormattedMessage
            id="widget.assistance.conversations"
            defaultMessage="Your conversations"
          />
        </p>

        <ul className="flex flex-col gap-3">
          {conversations.map((c) => {
            const titre =
              c.subject ||
              c.lastMessagePreview ||
              intl.formatMessage({ id: 'portal.support.untitled', defaultMessage: 'Conversation' })
            const sous = c.subject
              ? c.lastMessagePreview
              : STATUS_LABEL[c.status]
                ? intl.formatMessage(STATUS_LABEL[c.status])
                : c.status
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpenChat(c.id)}
                  className="flex w-full items-start gap-3 rounded-xl bg-card px-3.5 py-3 text-start shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-semibold text-background">
                    {initiales}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold leading-tight text-foreground">
                      {titre}
                    </span>
                    {sous && (
                      <span className="block truncate text-sm text-muted-foreground">{sous}</span>
                    )}
                  </span>
                  <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                    <TimeAgo date={c.lastMessageAt} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </ScrollArea>
  )
}
