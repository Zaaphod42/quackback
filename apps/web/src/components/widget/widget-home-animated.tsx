import { useCallback, useEffect, useMemo, memo, useRef, useState } from 'react'
import { usePillsScroll } from '@/lib/client/hooks/use-pills-scroll'
import {
  TagIcon,
  LightbulbIcon,
  SearchIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  SendIcon,
} from 'lucide-react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useIntl, FormattedMessage } from 'react-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listPublicPostsFn } from '@/lib/server/functions/public-posts'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/shared/utils'
import { useInfiniteScroll } from '@/lib/client/hooks/use-infinite-scroll'
import { WidgetVoteButton } from './widget-vote-button'
import { useWidgetAuth } from './widget-auth-provider'
import { sendToHost } from '@/lib/client/widget-bridge'
import type { PostId } from '@quackback/ids'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useWidgetImageUpload } from '@/lib/client/hooks/use-image-upload'
import type { JSONContent } from '@tiptap/react'
import type { TiptapContent } from '@/lib/shared/schemas/posts'

interface WidgetPost {
  id: string
  title: string
  voteCount: number
  statusId: string | null
  commentCount: number
  board?: { id: string; name: string; slug: string }
}

interface StatusInfo {
  id: string
  name: string
  color: string
}

interface BoardInfo {
  id: string
  name: string
  slug: string
}

export interface WidgetHomeProps {
  initialPosts: WidgetPost[]
  initialHasMore?: boolean
  statuses: StatusInfo[]
  boards: BoardInfo[]
  /**
   * Server-computed per-board submit/vote capability for the request actor,
   * keyed by board id (boardCapabilitiesForActor: each board's access tier
   * composed with the workspace anonymous switch). The submit CTA follows the
   * selected board's `canSubmit`; each feed card's vote follows its board's
   * `canVote` — instead of a workspace-wide flag that advertises actions the
   * board's tier rejects (#191).
   */
  boardPermissions?: Record<string, { canSubmit: boolean; canVote: boolean }>
  defaultBoard?: string
  /**
   * L'ecran « Proposer une idee » est-il ouvert ? Tenu par la route : la fleche de retour de la coque en a besoin, et
   * le brouillon reste en memoire quand on la prend (ce composant reste monte).
   */
  composing?: boolean
  onComposingChange?: (composing: boolean) => void
  onPostSelect?: (postId: string) => void
  onPostCreated?: (post: {
    id: string
    title: string
    voteCount: number
    statusId: string | null
    board: { id: string; name: string; slug: string }
  }) => void
}

interface SearchResult {
  posts: WidgetPost[]
}

const similarSearchCache = new Map<string, SearchResult>()

const identityInputCls =
  'bg-background rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-colors'

// ── Shared post row used in both similar-posts and popular-ideas lists ──

const WidgetPostRow = memo(
  function WidgetPostRow({
    post,
    statusMap,
    showBoard,
    compact,
    canVote,
    noAccessReason,
    ensureSessionThen,
    onAuthRequired,
    onSelect,
  }: {
    post: WidgetPost
    statusMap: Map<string, StatusInfo>
    showBoard?: boolean
    compact?: boolean
    canVote: boolean
    /** Reason an identified viewer cannot vote on this row's board (authz). */
    noAccessReason?: string
    ensureSessionThen: (callback: () => void | Promise<void>) => Promise<void>
    onAuthRequired?: () => void
    onSelect?: () => void
  }) {
    const status = post.statusId ? (statusMap.get(post.statusId) ?? null) : null
    const vote = (
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <WidgetVoteButton
          postId={post.id as PostId}
          voteCount={post.voteCount}
          compact={compact}
          onBeforeVote={
            canVote
              ? async () => {
                  let success = false
                  await ensureSessionThen(() => {
                    success = true
                  })
                  return success
                }
              : undefined
          }
          noAccessReason={!canVote ? noAccessReason : undefined}
          onAuthRequired={!canVote ? onAuthRequired : undefined}
        />
      </div>
    )

    // Les idees similaires (sous le titre d'une proposition) restent des lignes serrees.
    if (compact) {
      return (
        <div
          className="flex w-full cursor-pointer items-center gap-2.5 overflow-hidden border-b border-border/60 px-1 py-1.5 transition-colors last:border-b-0 hover:bg-muted/40"
          onClick={onSelect}
        >
          {vote}
          <p className="line-clamp-1 min-w-0 flex-1 text-xs font-medium text-foreground">
            {post.title}
          </p>
        </div>
      )
    }

    // UNE CARTE PAR IDEE : le vote, le titre, puis l'etat et les commentaires.
    return (
      <div
        className="flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-xl bg-card px-3.5 py-3 shadow-sm transition-shadow hover:shadow-md"
        onClick={onSelect}
      >
        {vote}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
            {post.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            {status && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {status.name}
              </span>
            )}
            {post.commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageCircleIcon className="size-3.5" />
                {post.commentCount}
              </span>
            )}
            {showBoard && post.board && (
              <span className="inline-flex items-center gap-1">
                <TagIcon className="size-3" />
                {post.board.name}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  },
  (prev, next) =>
    prev.post === next.post &&
    prev.statusMap === next.statusMap &&
    prev.showBoard === next.showBoard &&
    prev.compact === next.compact &&
    prev.canVote === next.canVote &&
    prev.noAccessReason === next.noAccessReason
)

// ── Main component ──

export function WidgetHomeAnimated({
  initialPosts,
  initialHasMore = false,
  statuses,
  boards,
  boardPermissions,
  defaultBoard,
  composing = false,
  onComposingChange,
  onPostSelect,
  onPostCreated,
}: WidgetHomeProps) {
  const intl = useIntl()
  const {
    ensureSession,
    ensureSessionThen,
    isIdentified,
    hmacRequired,
    user,
    emitEvent,
    metadata,
    identifyWithEmail,
  } = useWidgetAuth()
  const { upload: uploadImage } = useWidgetImageUpload()
  const [title, setTitle] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState(() => {
    if (defaultBoard) {
      const match = boards.find((b) => b.slug === defaultBoard)
      if (match) return match.id
    }
    // Single board: auto-select (selector is hidden anyway). Multiple boards with no
    // default: leave empty so the user is prompted to pick one.
    if (boards.length === 1) return boards[0].id
    return ''
  })
  const [contentJson, setContentJson] = useState<JSONContent | null>(null)
  const [contentHtml, setContentHtml] = useState('')
  const handleEditorChange = useCallback((json: JSONContent, html: string) => {
    setContentJson(json)
    setContentHtml(html)
  }, [])

  // Per-board capability, server-computed for the request actor. The widget
  // route refetches boardPermissions with the Bearer identity (keyed on
  // sessionVersion), so for an identified viewer this already reflects the real
  // actor and for an anonymous one it's the anonymous baseline — no client-side
  // isIdentified OR, which would advertise CTAs on segments/team boards the
  // actor cannot act on (#191). Submit follows the selected board; each feed
  // card's vote follows its own board. Unknown board → deny.
  const rowCanVote = useCallback(
    (boardId: string | undefined) => !!boardId && (boardPermissions?.[boardId]?.canVote ?? false),
    [boardPermissions]
  )
  const canPost = boardPermissions?.[selectedBoardId]?.canSubmit ?? false
  // An anonymous visitor on a board that does not allow anonymous submission must
  // identify first; the form collects an email and escalates to a real user.
  const needsEmail = !isIdentified && !hmacRequired && !canPost
  // An identified viewer denied by the selected board's submit tier (segments/
  // team) is an authorization failure — surface it instead of "Posting as X".
  const submitNoAccess = isIdentified && !!selectedBoardId && !canPost
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [similarPostResults, setSimilarPostResults] = useState<SearchResult | null>(null)
  const [isSimilarSearching, setIsSimilarSearching] = useState(false)
  const similarDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [activeBoardSlug, setActiveBoardSlug] = useState<string | null>(null)
  const pills = usePillsScroll()
  const [popularSearch, setPopularSearch] = useState('')
  const [debouncedPopularSearch, setDebouncedPopularSearch] = useState('')
  const popularSearchDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const descriptionRef = useRef<HTMLDivElement>(null)

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses])

  // Infinite query for popular ideas — page 1 seeded from SSR, pages 2+ fetched on scroll
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingPosts,
  } = useInfiniteQuery({
    queryKey: ['widget', 'posts', 'popular', sort, activeBoardSlug ?? 'all'],
    queryFn: ({ pageParam }) =>
      listPublicPostsFn({
        data: {
          sort,
          page: pageParam,
          limit: 20,
          boardSlug: activeBoardSlug ?? undefined,
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    // Only seed from SSR data on the initial unfiltered view (the SSR page is the 'top' sort)
    initialData:
      activeBoardSlug === null && sort === 'top'
        ? {
            pages: [{ items: initialPosts, total: -1, hasMore: initialHasMore }],
            pageParams: [1],
          }
        : undefined,
  })

  const allPopularPosts: WidgetPost[] = useMemo(
    () =>
      postsData?.pages.flatMap((page) =>
        page.items.map(
          (p): WidgetPost => ({
            id: p.id,
            title: p.title,
            voteCount: p.voteCount,
            statusId: p.statusId ?? null,
            commentCount: (p as WidgetPost).commentCount ?? 0,
            board: (p as WidgetPost).board,
          })
        )
      ) ?? [],
    [postsData]
  )

  const postsSentinelRef = useInfiniteScroll({
    hasMore: hasNextPage ?? false,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  })

  // Search query for popular ideas — replaces infinite list when active
  const { data: popularSearchData, isFetching: isPopularSearchFetching } = useQuery({
    queryKey: ['widget', 'search', 'popular', debouncedPopularSearch, activeBoardSlug ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedPopularSearch, limit: '20' })
      if (activeBoardSlug) params.set('board', activeBoardSlug)
      const res = await fetch(`/api/widget/search?${params}`)
      const json = await res.json()
      return { posts: (json.data?.posts ?? []) as WidgetPost[] }
    },
    enabled: debouncedPopularSearch.length > 0,
  })

  const handleAuthRequired = useCallback(
    (postId: string) => {
      if (!hmacRequired && onPostSelect) {
        onPostSelect(postId)
      } else {
        sendToHost({ type: 'quackback:navigate', url: `${window.location.origin}/auth/login` })
      }
    },
    [hmacRequired, onPostSelect]
  )

  // An identified viewer denied by the board's vote tier (segments/team) is an
  // authorization failure, not auth: the vote button shows this as a dimmed
  // tooltip. An anonymous viewer is routed to sign in (onAuthRequired) instead.
  const voteNoAccessReason = isIdentified
    ? intl.formatMessage({
        id: 'widget.vote.noAccess',
        defaultMessage: "You don't have access to vote on this board",
      })
    : undefined

  useEffect(() => {
    if (similarDebounceRef.current) clearTimeout(similarDebounceRef.current)
    const q = title.trim()
    if (!q) {
      setSimilarPostResults(null)
      setIsSimilarSearching(false)
      return
    }
    const cached = similarSearchCache.get(q)
    if (cached) {
      setSimilarPostResults(cached)
      setIsSimilarSearching(false)
      return
    }
    setIsSimilarSearching(true)
    const controller = new AbortController()
    similarDebounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, limit: '5' })
        const res = await fetch(`/api/widget/search?${params}`, { signal: controller.signal })
        const json = await res.json()
        const result: SearchResult = { posts: json.data?.posts ?? [] }
        similarSearchCache.set(q, result)
        setSimilarPostResults(result)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setSimilarPostResults({ posts: [] })
      } finally {
        setIsSimilarSearching(false)
      }
    }, 300)
    return () => {
      if (similarDebounceRef.current) clearTimeout(similarDebounceRef.current)
      controller.abort()
    }
  }, [title])

  // Debounce popular ideas search
  useEffect(() => {
    if (popularSearchDebounceRef.current) clearTimeout(popularSearchDebounceRef.current)
    popularSearchDebounceRef.current = setTimeout(() => {
      setDebouncedPopularSearch(popularSearch)
    }, 300)
    return () => {
      if (popularSearchDebounceRef.current) clearTimeout(popularSearchDebounceRef.current)
    }
  }, [popularSearch])

  function collapseForm() {
    onComposingChange?.(false)
    setTitle('')
    setContentJson(null)
    setContentHtml('')
    setEmail('')
    setName('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !selectedBoardId || isSubmitting) return
    if (needsEmail && !email.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (needsEmail) {
        const identified = await identifyWithEmail(email.trim(), name.trim() || undefined)
        if (!identified) {
          setError(
            intl.formatMessage({
              id: 'widget.home.form.errorEmail',
              defaultMessage: 'Could not verify your email. Please try again.',
            })
          )
          setIsSubmitting(false)
          return
        }
        // Identifying escalates an anonymous visitor to a real authenticated
        // user, which satisfies an `authenticated` submit tier — but NOT a
        // `segments`/`team` tier. Re-check the selected board's capability with
        // the now-Bearer identity before posting, so we surface a clear
        // no-access message instead of firing a createPost the server rejects
        // (#191). The feed's boardPermissions also refetches on sessionVersion.
        const [{ getWidgetAuthHeaders }, { fetchBoardCapabilitiesFn }] = await Promise.all([
          import('@/lib/client/widget-auth'),
          import('@/lib/server/functions/portal'),
        ])
        const freshPermissions = await fetchBoardCapabilitiesFn({
          headers: getWidgetAuthHeaders(),
        })
        if (!freshPermissions?.[selectedBoardId]?.canSubmit) {
          setError(
            intl.formatMessage({
              id: 'widget.home.form.noAccess',
              defaultMessage: "You don't have access to post on this board",
            })
          )
          setIsSubmitting(false)
          return
        }
      } else if (!canPost) {
        if (hmacRequired) {
          sendToHost({ type: 'quackback:navigate', url: `${window.location.origin}/auth/login` })
          setIsSubmitting(false)
          return
        }
        // Identified actor who does not satisfy the board's submit tier
        // (segments/team) — authorization, not auth. The submit button is
        // disabled, but an Enter-key submit can still reach here: surface the
        // reason rather than fall through and fire a createPost the server
        // would reject.
        setError(
          intl.formatMessage({
            id: 'widget.home.form.noAccess',
            defaultMessage: "You don't have access to post on this board",
          })
        )
        setIsSubmitting(false)
        return
      } else if (!isIdentified) {
        const ok = await ensureSession()
        if (!ok) {
          setError(
            intl.formatMessage({
              id: 'widget.home.form.errorSession',
              defaultMessage: 'Could not create session. Please try again.',
            })
          )
          setIsSubmitting(false)
          return
        }
      }

      const [{ getWidgetAuthHeaders }, { createPublicPostFn }] = await Promise.all([
        import('@/lib/client/widget-auth'),
        import('@/lib/server/functions/public-posts'),
      ])
      const result = await createPublicPostFn({
        data: {
          boardId: selectedBoardId,
          title: title.trim(),
          content: contentHtml.trim(),
          contentJson: (contentJson ?? undefined) as TiptapContent | undefined,
          metadata: metadata ?? undefined,
        },
        headers: getWidgetAuthHeaders(),
      })

      emitEvent('post:created', {
        id: result.id,
        title: result.title,
        board: result.board,
        statusId: result.statusId ?? null,
      })

      onPostCreated?.({
        id: result.id,
        title: result.title,
        voteCount: 0,
        statusId: result.statusId ?? null,
        board: result.board,
      })

      collapseForm()
    } catch {
      setError(
        intl.formatMessage({
          id: 'widget.home.form.errorNetwork',
          defaultMessage: 'Network error. Please try again.',
        })
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmitForm =
    title.trim() && selectedBoardId && (!needsEmail || email.trim()) && (canPost || needsEmail)

  // « Vous publiez en tant que... » : la mention sous le bouton de l'ecran de proposition.
  const postingNote = submitNoAccess ? (
    <FormattedMessage
      id="widget.home.posting.noAccess"
      defaultMessage="You don't have access to post on this board"
    />
  ) : user || (needsEmail && email.trim()) ? (
    <FormattedMessage
      id="widget.home.posting.postingAs"
      defaultMessage="Posting as {name}"
      values={{
        name: (
          <span className="font-medium text-foreground">
            {user ? user.name || user.email : email.trim()}
          </span>
        ),
      }}
    />
  ) : needsEmail ? (
    <FormattedMessage
      id="widget.home.posting.emailRequired"
      defaultMessage="Your email is required"
    />
  ) : (
    <FormattedMessage
      id="widget.home.posting.postingAnonymously"
      defaultMessage="Posting anonymously"
    />
  )

  // ── L'ECRAN « PROPOSER UNE IDEE » (Seb 2026-11-24) : le titre, puis la description qui prend TOUTE la hauteur
  //    disponible, puis le bouton, toujours visible en bas. La fleche de retour est celle de la coque.
  if (composing) {
    return (
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4">
          {boards.length > 1 && (
            <div className="flex shrink-0 items-center">
              <span className="me-1 text-xs text-muted-foreground">
                <FormattedMessage id="widget.home.posting.postingTo" defaultMessage="Posting to" />
              </span>
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger
                  size="xs"
                  className="border-0 bg-transparent font-medium text-foreground shadow-none hover:text-foreground/80 focus-visible:ring-0"
                >
                  <SelectValue
                    placeholder={intl.formatMessage({
                      id: 'widget.home.posting.selectBoard',
                      defaultMessage: 'Select a board',
                    })}
                  />
                </SelectTrigger>
                <SelectContent align="start">
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="py-1 text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label
            htmlFor="widget-idea-title"
            className="-mb-1.5 shrink-0 text-[13px] font-semibold text-foreground"
          >
            <FormattedMessage id="widget.home.form.titleLabel" defaultMessage="Title" />
          </label>
          <input
            id="widget-idea-title"
            type="text"
            autoFocus
            maxLength={200}
            placeholder={intl.formatMessage({
              id: 'widget.home.form.titlePlaceholder',
              defaultMessage: 'In one sentence',
            })}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 shrink-0 rounded-xl bg-card px-3.5 text-[15px] text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
          />

          {!isSimilarSearching && similarPostResults && similarPostResults.posts.length > 0 && (
            <div className="shrink-0">
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <LightbulbIcon className="h-3 w-3" />
                <FormattedMessage id="widget.home.similar.heading" defaultMessage="Similar ideas" />
              </p>
              <div className="flex flex-col">
                {similarPostResults.posts.slice(0, 2).map((post) => (
                  <WidgetPostRow
                    key={post.id}
                    post={post}
                    statusMap={statusMap}
                    compact
                    canVote={rowCanVote(post.board?.id)}
                    ensureSessionThen={ensureSessionThen}
                    noAccessReason={voteNoAccessReason}
                    onAuthRequired={() => handleAuthRequired(post.id)}
                    onSelect={() => onPostSelect?.(post.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <label className="-mb-1.5 shrink-0 text-[13px] font-semibold text-foreground">
            <FormattedMessage id="widget.home.form.descriptionLabel" defaultMessage="Description" />
          </label>
          {/* Le champ prend toute la hauteur restante ; un appui n'importe ou dedans place le curseur. */}
          <div
            ref={descriptionRef}
            className="min-h-[120px] flex-1 cursor-text overflow-y-auto rounded-xl bg-card px-3.5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20"
            onClick={() =>
              descriptionRef.current?.querySelector<HTMLElement>('.ProseMirror')?.focus()
            }
          >
            <RichTextEditor
              value={contentJson || ''}
              onChange={handleEditorChange}
              placeholder={intl.formatMessage({
                id: 'widget.home.form.descriptionPlaceholder',
                defaultMessage: 'What would you like to be able to do?',
              })}
              minHeight="80px"
              borderless
              features={{
                headings: true,
                codeBlocks: true,
                taskLists: true,
                blockquotes: true,
                dividers: true,
                tables: true,
                images: true,
                embeds: true,
                quackbackEmbeds: true,
                bubbleMenu: true,
                slashMenu: true,
              }}
              onImageUpload={uploadImage}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 px-4 pb-4 pt-3">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {needsEmail && (
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder={intl.formatMessage({
                  id: 'widget.home.form.emailPlaceholder',
                  defaultMessage: 'Your email',
                })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`min-w-0 flex-1 ${identityInputCls}`}
              />
              <input
                type="text"
                placeholder={intl.formatMessage({
                  id: 'widget.home.form.namePlaceholder',
                  defaultMessage: 'Name (optional)',
                })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-28 shrink-0 ${identityInputCls}`}
              />
            </div>
          )}
          <p className="truncate text-[13px] italic text-muted-foreground">{postingNote}</p>
          <button
            type="submit"
            disabled={!canSubmitForm || isSubmitting}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon className="size-4" />
            {isSubmitting ? (
              <FormattedMessage id="widget.home.form.submitting" defaultMessage="Submitting..." />
            ) : (
              <FormattedMessage
                id="widget.home.form.submitIdea"
                defaultMessage="Propose the idea"
              />
            )}
          </button>
        </div>
      </form>
    )
  }

  // ── LE TABLEAU DES IDEES : proposer, rechercher, trier, puis une carte par idee.
  const searching = debouncedPopularSearch.length > 0
  const searchPending = isPopularSearchFetching || popularSearch !== debouncedPopularSearch

  function proposeFromSearch() {
    // La recherche devient le titre de l'idee (200 signes au plus, la limite du serveur).
    setTitle(popularSearch.trim().slice(0, 200))
    setPopularSearch('')
    onComposingChange?.(true)
  }

  const proposeButton = (label: React.ReactNode, onClick: () => void, className?: string) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-90',
        className
      )}
    >
      <LightbulbIcon className="size-4" />
      {label}
    </button>
  )

  const renderCards = (posts: WidgetPost[]) =>
    posts.map((post) => (
      <WidgetPostRow
        key={post.id}
        post={post}
        statusMap={statusMap}
        showBoard={boards.length > 1}
        canVote={rowCanVote(post.board?.id)}
        ensureSessionThen={ensureSessionThen}
        noAccessReason={voteNoAccessReason}
        onAuthRequired={() => handleAuthRequired(post.id)}
        onSelect={() => onPostSelect?.(post.id)}
      />
    ))

  const emptyState = (
    icon: React.ReactNode,
    titre: React.ReactNode,
    texte: React.ReactNode,
    bouton?: React.ReactNode
  ) => (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-3 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-foreground">
        {icon}
      </span>
      <h3
        className="mt-1.5 text-[26px] font-normal leading-tight text-foreground"
        style={{ fontFamily: "'Glass Antiqua', Georgia, serif" }}
      >
        {titre}
      </h3>
      <p className="max-w-[28ch] text-balance text-[15px] text-muted-foreground">{texte}</p>
      {bouton && <div className="mt-2 flex w-full flex-col">{bouton}</div>}
    </div>
  )

  return (
    <ScrollArea scrollBarClassName="w-1.5" className="h-full">
      <div className="flex min-h-full flex-col gap-3 px-4 py-4">
        {proposeButton(
          <FormattedMessage id="widget.home.propose" defaultMessage="Propose an idea" />,
          () => onComposingChange?.(true)
        )}

        <label className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-card px-3.5 text-sm shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={popularSearch}
            onChange={(e) => setPopularSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault()
            }}
            placeholder={intl.formatMessage({
              id: 'widget.home.popular.search.placeholder',
              defaultMessage: 'Search ideas...',
            })}
            aria-label={intl.formatMessage({
              id: 'widget.home.popular.search.aria',
              defaultMessage: 'Search ideas',
            })}
            className="min-w-0 flex-1 truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
          {popularSearch && (
            <button
              type="button"
              onClick={() => setPopularSearch('')}
              aria-label={intl.formatMessage({
                id: 'widget.home.popular.search.clear',
                defaultMessage: 'Clear search',
              })}
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </label>

        {!searching && (
          <div className="flex h-9 shrink-0 rounded-full bg-muted p-[3px] text-[13px] font-semibold">
            {(['top', 'new'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={sort === value}
                onClick={() => setSort(value)}
                className={cn(
                  'flex-1 rounded-full transition-colors',
                  sort === value ? 'bg-foreground text-background' : 'text-muted-foreground'
                )}
              >
                {value === 'top' ? (
                  <FormattedMessage id="widget.home.sort.top" defaultMessage="Popular" />
                ) : (
                  <FormattedMessage id="widget.home.sort.new" defaultMessage="Recent" />
                )}
              </button>
            ))}
          </div>
        )}

        {boards.length >= 2 && (
          <div className="relative shrink-0">
            <div ref={pills.ref} className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {boards.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() =>
                    setActiveBoardSlug(activeBoardSlug === board.slug ? null : board.slug)
                  }
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeBoardSlug === board.slug
                      ? 'bg-foreground text-background'
                      : 'bg-card text-muted-foreground shadow-sm hover:text-foreground'
                  )}
                >
                  {board.name}
                </button>
              ))}
            </div>
            {pills.canScrollLeft && (
              <button
                type="button"
                onClick={() => pills.scrollBy(-120)}
                className="absolute bottom-0.5 start-0 top-0 flex items-center bg-gradient-to-r from-background via-background/80 to-transparent pe-6 ps-0.5"
                aria-label={intl.formatMessage({
                  id: 'widget.home.scroll.ariaLeft',
                  defaultMessage: 'Scroll left',
                })}
              >
                <ChevronLeftIcon className="size-3 text-muted-foreground" />
              </button>
            )}
            {pills.canScrollRight && (
              <button
                type="button"
                onClick={() => pills.scrollBy(120)}
                className="absolute bottom-0.5 end-0 top-0 flex items-center bg-gradient-to-l from-background via-background/80 to-transparent pe-0.5 ps-6"
                aria-label={intl.formatMessage({
                  id: 'widget.home.scroll.ariaRight',
                  defaultMessage: 'Scroll right',
                })}
              >
                <ChevronRightIcon className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {searching ? (
          searchPending ? (
            <div className="flex justify-center py-4 text-xs text-muted-foreground">
              <FormattedMessage
                id="widget.home.popular.search.searching"
                defaultMessage="Searching..."
              />
            </div>
          ) : (popularSearchData?.posts.length ?? 0) === 0 ? (
            // Aucun resultat : le message ne repete PAS la recherche (elle peut etre tres longue, et le champ
            // la montre deja) ; le bouton la reprend comme titre de l'idee.
            emptyState(
              <SearchIcon className="size-7" />,
              <FormattedMessage
                id="widget.home.popular.search.noResults"
                defaultMessage="No ideas found"
              />,
              <FormattedMessage
                id="widget.home.popular.search.noMatch"
                defaultMessage="No idea matches your search."
              />,
              proposeButton(
                <FormattedMessage
                  id="widget.home.proposeThis"
                  defaultMessage="Propose this idea"
                />,
                proposeFromSearch
              )
            )
          ) : (
            renderCards(popularSearchData!.posts)
          )
        ) : isFetchingPosts && !isFetchingNextPage && allPopularPosts.length === 0 ? (
          <div className="flex justify-center py-4 text-xs text-muted-foreground">
            <FormattedMessage id="widget.home.popular.loading" defaultMessage="Loading..." />
          </div>
        ) : allPopularPosts.length === 0 ? (
          emptyState(
            <LightbulbIcon className="size-7" />,
            activeBoardSlug ? (
              <FormattedMessage
                id="widget.home.popular.emptyBoard"
                defaultMessage="No ideas in this board yet"
              />
            ) : (
              <FormattedMessage id="widget.home.popular.empty" defaultMessage="No ideas yet" />
            ),
            !activeBoardSlug ? (
              <FormattedMessage
                id="widget.home.popular.emptyHint"
                defaultMessage="Be the first to share one!"
              />
            ) : undefined,
            proposeButton(
              <FormattedMessage id="widget.home.propose" defaultMessage="Propose an idea" />,
              () => onComposingChange?.(true)
            )
          )
        ) : (
          <>
            {renderCards(allPopularPosts)}
            {hasNextPage && (
              <div ref={postsSentinelRef} className="flex justify-center py-2">
                {isFetchingNextPage && (
                  <span className="text-xs text-muted-foreground">
                    <FormattedMessage
                      id="widget.home.popular.loading"
                      defaultMessage="Loading..."
                    />
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  )
}
