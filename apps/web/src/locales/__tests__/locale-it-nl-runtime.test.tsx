// @vitest-environment happy-dom
/**
 * Wiring check for the Italian and Dutch catalogs, in the style of
 * `locale-runtime.test.tsx`: the static tests prove the files are well-formed,
 * this proves they LOAD and RENDER through the real client stack. A wrong import
 * path in `loadMessages` would silently degrade to English through its
 * catch-fallback, which none of the static tests would notice.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FormattedMessage } from 'react-intl'
import { PortalIntlProvider } from '@/components/portal-intl-provider'
import { loadMessages } from '@/lib/shared/i18n'

describe('Italian and Dutch runtime wiring', () => {
  it('loadMessages resolves the real catalogs, not the English fallback', async () => {
    const [en, it_, nl] = await Promise.all([
      loadMessages('en'),
      loadMessages('it'),
      loadMessages('nl'),
    ])
    expect(it_['portal.header.auth.logIn']).toBe('Accedi')
    expect(nl['portal.header.auth.logIn']).toBe('Aanmelden')
    expect(it_['portal.header.auth.logIn']).not.toBe(en['portal.header.auth.logIn'])
    expect(nl['portal.header.auth.logIn']).not.toBe(en['portal.header.auth.logIn'])
  })

  it.each([
    ['it', 'Guide'],
    ['nl', 'Handleidingen'],
  ] as const)(
    'renders the Diafane "Guides" entry in %s from the SSR catalog',
    async (locale, label) => {
      const messages = await loadMessages(locale)
      render(
        <PortalIntlProvider locale={locale} messages={messages}>
          <span data-testid="guides">
            <FormattedMessage id="portal.header.nav.guides" defaultMessage="Guides" />
          </span>
        </PortalIntlProvider>
      )
      // First synchronous render: no flash of English.
      expect(screen.getByTestId('guides').textContent).toBe(label)
    }
  )

  it.each([
    ['it', 1, '1 commento'],
    ['it', 3, '3 commenti'],
    ['nl', 1, '1 reactie'],
    ['nl', 3, '3 reacties'],
  ] as const)('formats the %s plural for %i', async (locale, count, expected) => {
    render(
      <PortalIntlProvider locale={locale}>
        <span data-testid="plural">
          <FormattedMessage
            id="widget.postDetail.comments"
            defaultMessage="{count, plural, one {# comment} other {# comments}}"
            values={{ count }}
          />
        </span>
      </PortalIntlProvider>
    )
    const node = await screen.findByTestId('plural')
    await waitFor(() => expect(node.textContent).toBe(expected))
    expect(node.textContent).not.toMatch(/comment$/i)
  })
})
