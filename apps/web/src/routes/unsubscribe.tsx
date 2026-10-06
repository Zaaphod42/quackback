import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { FormattedMessage, useIntl, type MessageDescriptor } from 'react-intl'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { PortalIntlProvider } from '@/components/portal-intl-provider'
import { loadPortalIntl } from '@/lib/server/functions/locale'
import {
  processUnsubscribeTokenFn,
  type UnsubscribeResult,
} from '@/lib/server/functions/subscriptions'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/unsubscribe')({
  // Standalone route (outside the portal layout): it loads the language and its
  // catalog itself, so the page is translated from the server render on.
  beforeLoad: async () => ({ intl: await loadPortalIntl() }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps }): Promise<UnsubscribeResult | { success: false; error: 'missing' }> => {
    if (!deps.token) {
      return { success: false, error: 'missing' }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(deps.token)) {
      return { success: false, error: 'invalid' }
    }

    return processUnsubscribeTokenFn({ data: { token: deps.token } })
  },
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const { intl } = Route.useRouteContext()

  return (
    <PortalIntlProvider locale={intl.locale} messages={intl.messages}>
      <UnsubscribeContent />
    </PortalIntlProvider>
  )
}

function UnsubscribeContent() {
  const result = Route.useLoaderData()

  if (result.success) {
    return <SuccessView result={result} />
  }

  return <ErrorView error={result.error || 'invalid'} />
}

function SuccessView({ result }: { result: UnsubscribeResult }) {
  const intl = useIntl()
  const actionText = getActionText(result.action)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {intl.formatMessage(actionText.title)}
          </h1>
          <p className="text-sm text-muted-foreground">{intl.formatMessage(actionText.message)}</p>
          {result.postTitle && (
            <p className="text-sm text-muted-foreground mt-2">
              <FormattedMessage
                id="portal.unsubscribe.post"
                defaultMessage="Post: <b>{title}</b>"
                values={{
                  title: result.postTitle,
                  b: (chunks) => <span className="font-medium">{chunks}</span>,
                }}
              />
            </p>
          )}
        </div>

        <div className="flex justify-center pt-4">
          {result.boardSlug && result.postId ? (
            <Link
              to="/b/$slug/posts/$postId"
              params={{ slug: result.boardSlug, postId: result.postId }}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <FormattedMessage id="portal.unsubscribe.viewPost" defaultMessage="View Post" />
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <FormattedMessage id="portal.unsubscribe.goHome" defaultMessage="Go to Home" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorView({ error }: { error: string }) {
  const intl = useIntl()
  const { title, message } = getErrorContent(error)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{intl.formatMessage(title)}</h1>
          <p className="text-sm text-muted-foreground">{intl.formatMessage(message)}</p>
        </div>

        <div className="flex justify-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <FormattedMessage id="portal.unsubscribe.goHome" defaultMessage="Go to Home" />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface TitleAndMessage {
  title: MessageDescriptor
  message: MessageDescriptor
}

function getActionText(action?: string): TitleAndMessage {
  switch (action) {
    case 'unsubscribe_post':
      return {
        title: { id: 'portal.unsubscribe.post.title', defaultMessage: 'Unsubscribed' },
        message: {
          id: 'portal.unsubscribe.post.message',
          defaultMessage:
            "You've been unsubscribed from this post. You won't receive any more email updates about it.",
        },
      }
    case 'mute_post':
      return {
        title: { id: 'portal.unsubscribe.mute.title', defaultMessage: 'Notifications Muted' },
        message: {
          id: 'portal.unsubscribe.mute.message',
          defaultMessage:
            "You've muted notifications for this post. You can unmute anytime from the post page.",
        },
      }
    case 'unsubscribe_all':
      return {
        title: { id: 'portal.unsubscribe.all.title', defaultMessage: 'All Emails Disabled' },
        message: {
          id: 'portal.unsubscribe.all.message',
          defaultMessage:
            "You've disabled all email notifications. You can re-enable them from your settings.",
        },
      }
    default:
      return {
        title: { id: 'portal.unsubscribe.success.title', defaultMessage: 'Success' },
        message: {
          id: 'portal.unsubscribe.success.message',
          defaultMessage: 'Your preferences have been updated.',
        },
      }
  }
}

function getErrorContent(error: string): TitleAndMessage {
  switch (error) {
    case 'missing':
      return {
        title: { id: 'portal.unsubscribe.missing.title', defaultMessage: 'Missing Token' },
        message: {
          id: 'portal.unsubscribe.missing.message',
          defaultMessage: 'No unsubscribe token was provided. Please use the link from your email.',
        },
      }
    case 'invalid':
    case 'expired':
    case 'used':
      return {
        title: { id: 'portal.unsubscribe.expired.title', defaultMessage: 'Link Expired' },
        message: {
          id: 'portal.unsubscribe.expired.message',
          defaultMessage: 'This unsubscribe link has already been used or has expired.',
        },
      }
    case 'failed':
      return {
        title: { id: 'portal.unsubscribe.failed.title', defaultMessage: 'Something Went Wrong' },
        message: {
          id: 'portal.unsubscribe.failed.message',
          defaultMessage: "We couldn't process your request. Please try again later.",
        },
      }
    default:
      return {
        title: { id: 'portal.unsubscribe.invalid.title', defaultMessage: 'Invalid Link' },
        message: {
          id: 'portal.unsubscribe.invalid.message',
          defaultMessage:
            'This unsubscribe link is not valid. Please use the link from your email.',
        },
      }
  }
}
