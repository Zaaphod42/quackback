import { useContext } from 'react'
import { IntlContext, createIntl, createIntlCache, type IntlShape } from 'react-intl'

// What a component reads when no IntlProvider is mounted above it (the admin
// app, unit tests): English, straight from each message's `defaultMessage`.
export const englishIntl = createIntl({ locale: 'en', onError: () => {} }, createIntlCache())

/**
 * `useIntl()` that never throws.
 *
 * Components shared with the admin app (which has no IntlProvider and stays in
 * English by design) must not crash there: this returns the provider's intl
 * when there is one, and an English one otherwise. The portal and the widget
 * always have a provider, so they get their language.
 */
export function useOptionalIntl(): IntlShape {
  return useContext(IntlContext) ?? englishIntl
}
