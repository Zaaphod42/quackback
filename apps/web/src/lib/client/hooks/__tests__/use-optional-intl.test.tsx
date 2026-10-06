// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { useOptionalIntl } from '../use-optional-intl'
import it_ from '@/locales/it.json'

function Probe() {
  const intl = useOptionalIntl()
  return (
    <span data-testid="probe">
      {intl.locale}:{intl.formatMessage({ id: 'ui.dialog.close', defaultMessage: 'Close' })}
    </span>
  )
}

describe('useOptionalIntl', () => {
  it('falls back to English, from the defaultMessage, without a provider (admin app)', () => {
    const { getByTestId } = render(<Probe />)
    expect(getByTestId('probe').textContent).toBe('en:Close')
  })

  it('uses the provider when there is one', () => {
    const { getByTestId } = render(
      <IntlProvider locale="it" messages={it_} defaultLocale="en">
        <Probe />
      </IntlProvider>
    )
    expect(getByTestId('probe').textContent).toBe('it:Chiudi')
  })
})
