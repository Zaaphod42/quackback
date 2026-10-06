// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { TimeAgo, getTimeAgo } from '../time-ago'

const NOW = new Date('2026-10-06T12:00:00Z')
const THREE_DAYS_AGO = new Date('2026-10-03T12:00:00Z')

describe('getTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays in English by default', () => {
    expect(getTimeAgo(THREE_DAYS_AGO)).toBe('3 days ago')
    expect(getTimeAgo(THREE_DAYS_AGO, 'en')).toBe('3 days ago')
  })

  it('speaks Italian and Dutch', () => {
    expect(getTimeAgo(THREE_DAYS_AGO, 'it')).toBe('3 giorni fa')
    expect(getTimeAgo(THREE_DAYS_AGO, 'nl')).toBe('3 dagen geleden')
  })

  it('leaves the other locales on the English wording, as before', () => {
    expect(getTimeAgo(THREE_DAYS_AGO, 'fr')).toBe('3 days ago')
    expect(getTimeAgo(THREE_DAYS_AGO, 'zh-cn')).toBe('3 days ago')
  })

  it('returns an empty string for a missing or invalid date', () => {
    expect(getTimeAgo(null, 'it')).toBe('')
    expect(getTimeAgo('not a date', 'nl')).toBe('')
  })
})

describe('TimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders in English without any IntlProvider (admin app)', () => {
    const { container } = render(<TimeAgo date={THREE_DAYS_AGO} />)
    expect(container.textContent).toBe('3 days ago')
  })

  it.each([
    ['en', '3 days ago'],
    ['it', '3 giorni fa'],
    ['nl', '3 dagen geleden'],
  ])('follows the IntlProvider locale (%s)', (locale, expected) => {
    const { container } = render(
      <IntlProvider locale={locale} defaultLocale="en" messages={{}}>
        <TimeAgo date={THREE_DAYS_AGO} />
      </IntlProvider>
    )
    expect(container.textContent).toBe(expected)
  })
})
