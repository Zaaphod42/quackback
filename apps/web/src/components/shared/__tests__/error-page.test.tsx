// @vitest-environment happy-dom
import { describe, expect, it, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import fr from '@/locales/fr.json'

import {
  CONTACT_DIAFANE,
  DefaultErrorPage,
  NotFoundPage,
  isAuthorizationError,
} from '../error-page'

describe('isAuthorizationError', () => {
  it('flags the role-gate failures thrown by requireAuth', () => {
    expect(isAuthorizationError(new Error('Access denied: Requires [admin], got member'))).toBe(
      true
    )
    expect(isAuthorizationError(new Error('Access denied: Not a team member'))).toBe(true)
  })

  it('ignores unrelated runtime errors', () => {
    expect(isAuthorizationError(new Error('Network request failed'))).toBe(false)
    expect(isAuthorizationError(new Error('undefined is not a function'))).toBe(false)
  })
})

// Diafane (PLAN #660) : les pages d'erreur du portail reprennent le bandeau de
// son accueil, et plus le canard de Quackback.
describe('les pages d’erreur du portail', () => {
  afterEach(() => {
    cleanup()
    window.history.pushState({}, '', '/')
  })

  it('une page introuvable prend le bandeau de l’accueil, sans le canard', () => {
    const { container } = render(<NotFoundPage />)

    expect(
      container.querySelector('section[aria-labelledby="portal-welcome-title"]')
    ).not.toBeNull()
    expect(container.querySelector('.portal-welcome-title__or')?.textContent).toBe(
      'could not be found.'
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByText(/flown the pond/i)).toBeNull()
    const liens = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(liens).toEqual(['/', 'https://diafane.com/en/aide', CONTACT_DIAFANE])
  })

  it('parle la langue du portail quand elle est fournie', () => {
    render(
      <IntlProvider locale="fr" messages={fr}>
        <NotFoundPage />
      </IntlProvider>
    )

    expect(screen.getByText('est introuvable.')).toBeInTheDocument()
    expect(screen.getByText('Voir les idées')).toBeInTheDocument()
  })

  it('montre un avis d’accès calme, sans le jargon des rôles', () => {
    render(<DefaultErrorPage error={new Error('Access denied: Requires [admin], got member')} />)

    expect(screen.getByText('restricted.')).toBeInTheDocument()
    expect(screen.queryByText(/Requires \[admin\]/)).toBeNull()
    expect(screen.queryByText(/Technical details/i)).toBeNull()
  })

  it('garde les détails techniques pour l’administration seulement', () => {
    render(<DefaultErrorPage error={new Error('boom')} />)
    expect(screen.getByText('went wrong.')).toBeInTheDocument()
    expect(screen.queryByText(/Technical details/i)).toBeNull()
    cleanup()

    window.history.pushState({}, '', '/admin/feedback')
    render(<DefaultErrorPage error={new Error('boom')} />)
    expect(screen.getByText(/Technical details/i)).toBeInTheDocument()
  })
})
