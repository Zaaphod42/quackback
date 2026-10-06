import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { PortalIntlProvider } from '@/components/portal-intl-provider'
import { loadPortalIntl } from '@/lib/server/functions/locale'
import { postAuthSuccess } from '@/lib/client/hooks/use-auth-broadcast'
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

/**
 * Auth Complete Page
 *
 * This page is shown after authentication completes in a popup window.
 * It broadcasts the success message to the original window via BroadcastChannel,
 * then closes itself.
 */
export const Route = createFileRoute('/auth/auth-complete')({
  // Standalone route (outside the portal layout): it loads the language and its
  // catalog itself, so the page is translated from the server render on.
  beforeLoad: async () => ({ intl: await loadPortalIntl() }),
  component: AuthCompletePage,
})

function AuthCompletePage() {
  const { intl } = Route.useRouteContext()

  return (
    <PortalIntlProvider locale={intl.locale} messages={intl.messages}>
      <AuthCompleteContent />
    </PortalIntlProvider>
  )
}

function AuthCompleteContent() {
  const [status, setStatus] = useState<'broadcasting' | 'success'>('broadcasting')

  useEffect(() => {
    // Post success message to other windows
    postAuthSuccess()
    setStatus('success')

    // Close the window after a brief delay
    const timeout = setTimeout(() => {
      window.close()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'broadcasting' ? (
          <>
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              <FormattedMessage
                id="portal.authComplete.completing"
                defaultMessage="Completing sign in..."
              />
            </p>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-foreground font-medium">
              <FormattedMessage
                id="portal.authComplete.success"
                defaultMessage="Signed in successfully!"
              />
            </p>
            <p className="text-sm text-muted-foreground">
              <FormattedMessage
                id="portal.authComplete.closing"
                defaultMessage="This window will close automatically."
              />
            </p>
          </>
        )}
      </div>
    </div>
  )
}
