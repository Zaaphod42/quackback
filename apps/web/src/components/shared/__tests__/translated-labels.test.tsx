// @vitest-environment happy-dom
/**
 * Accessible labels of the shared components that the portal and the widget
 * mount (image zoom, emoji picker, attachment tray, filter chip, status
 * dropdown, vote button): translated under a provider, English without one
 * (the admin app has no provider and stays in English).
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ZoomableImage } from '../zoomable-image'
import { EmojiPicker } from '../emoji-picker'
import { ComposerAttachmentTray } from '../composer-attachment-tray'
import { FilterChip } from '../filter-chip'
import { StatusDropdown } from '../status-dropdown'
import { VoteButton } from '@/components/public/vote-button'
import it_ from '@/locales/it.json'
import nl from '@/locales/nl.json'

function inLanguage(locale: 'it' | 'nl', ui: React.ReactElement) {
  const messages = locale === 'it' ? it_ : nl
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlProvider locale={locale} messages={messages} defaultLocale="en">
        {ui}
      </IntlProvider>
    </QueryClientProvider>
  )
}

describe('ZoomableImage', () => {
  it.each([
    ['it', 'Ingrandisci immagine'],
    ['nl', 'Afbeelding vergroten'],
  ] as const)('names its thumbnail button in %s', (locale, label) => {
    const { getByRole } = inLanguage(locale, <ZoomableImage src="/a.png" />)
    expect(getByRole('button').getAttribute('aria-label')).toBe(label)
  })

  it('names the thumbnail after the image when it has a name', () => {
    const { getByRole } = inLanguage('it', <ZoomableImage src="/a.png" alt="foto" />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Ingrandisci foto')
  })

  it('stays in English without a provider', () => {
    const { getByRole } = render(<ZoomableImage src="/a.png" />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Enlarge image')
  })
})

describe('EmojiPicker', () => {
  it('labels its button in Dutch', () => {
    const { getByRole } = inLanguage('nl', <EmojiPicker onSelect={() => {}} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Emoji invoegen')
  })

  it('stays in English without a provider', () => {
    const { getByRole } = render(<EmojiPicker onSelect={() => {}} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Insert emoji')
  })
})

describe('ComposerAttachmentTray', () => {
  const attachment = { url: '/f.pdf', name: '', contentType: 'application/pdf', size: 10 }

  it('translates the file fallback name and the remove button', () => {
    const { getByText, getByRole } = inLanguage(
      'it',
      <ComposerAttachmentTray attachments={[attachment]} onRemove={() => {}} />
    )
    expect(getByText('File')).toBeTruthy()
    expect(getByRole('button').getAttribute('aria-label')).toBe('Rimuovi allegato')
  })
})

describe('FilterChip', () => {
  it('translates the remove label around the filter name and value', () => {
    const { getByRole } = inLanguage(
      'nl',
      <FilterChip
        icon={() => null}
        label="Status:"
        value="Open"
        valueId="open"
        onRemove={() => {}}
      />
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Filter Status: Open verwijderen')
  })
})

describe('StatusDropdown', () => {
  it('translates "No status" for a post without a status', () => {
    const { getByText } = inLanguage(
      'it',
      <StatusDropdown currentStatus={undefined} statuses={[]} onStatusChange={() => {}} />
    )
    expect(getByText('Nessuno stato')).toBeTruthy()
  })
})

describe('VoteButton (read only)', () => {
  it.each([
    ['it', 1, '1 voto'],
    ['it', 3, '3 voti'],
    ['nl', 3, '3 stemmen'],
  ] as const)('announces the count in %s (%i)', (locale, count, label) => {
    const { getByTestId } = inLanguage(
      locale,
      <VoteButton postId={'post_1' as never} voteCount={count} readonly />
    )
    expect(getByTestId('vote-button').getAttribute('aria-label')).toBe(label)
  })
})
