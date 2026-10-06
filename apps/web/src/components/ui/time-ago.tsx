import { useContext, useEffect, useState } from 'react'
import { IntlContext } from 'react-intl'
import { formatDistanceToNow, type Locale } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { nl } from 'date-fns/locale/nl'

interface TimeAgoProps {
  date: Date | string
  className?: string
}

/**
 * date-fns locales for the languages whose relative dates are localized
 * ("3 giorni fa", "3 dagen geleden"). Any other locale keeps date-fns' English
 * wording; add a language here (one import, one line) to localize it too.
 */
const DATE_FNS_LOCALES: Readonly<Record<string, Locale>> = { it, nl }

export function getTimeAgo(date: Date | string | null | undefined, locale?: string): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  // Check for invalid date
  if (isNaN(d.getTime())) return ''
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: locale ? DATE_FNS_LOCALES[locale] : undefined,
  })
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  // The raw context (not `useIntl`) so the component still renders, in English,
  // where no IntlProvider is mounted (parts of the admin app).
  const locale = useContext(IntlContext)?.locale

  // Initialize with computed value for SSR
  const [timeAgo, setTimeAgo] = useState<string>(() => getTimeAgo(date, locale))

  useEffect(() => {
    // Update immediately in case server/client time differs slightly
    setTimeAgo(getTimeAgo(date, locale))

    // Update every minute
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(date, locale))
    }, 60000)

    return () => clearInterval(interval)
  }, [date, locale])

  return <span className={className}>{timeAgo}</span>
}
