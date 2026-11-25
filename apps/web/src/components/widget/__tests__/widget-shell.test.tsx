// @vitest-environment happy-dom
/**
 * La coque du widget (Seb 2026-11-24) : titre de l'onglet a gauche et sans logo, avatar sur telephone seulement,
 * fleche de retour SEULE dans un detail, et des onglets « Assistance » / « Vos idees » dont le choisi porte le trait
 * epais en haut.
 */
import { describe, it, expect, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { IntlProvider } from 'react-intl'

vi.mock('@/components/shared/user-stats', () => ({ UserStatsBar: () => null }))
vi.mock('@/lib/client/widget-auth', () => ({
  getWidgetAuthHeaders: vi.fn(() => ({})),
  generateOneTimeToken: vi.fn(),
}))
vi.mock('@/lib/client/widget-bridge', () => ({ sendToHost: vi.fn() }))
vi.mock('../widget-auth-provider', () => ({
  useWidgetAuth: () => ({
    user: { name: 'Sebastien', email: 's@example.org', avatarUrl: null },
    isIdentified: true,
    hmacRequired: false,
    closeWidget: vi.fn(),
  }),
}))

import { WidgetShell } from '../widget-shell'

const MESSAGES = {
  'widget.shell.heading.help': 'Assistance',
  'widget.shell.heading.feedback': 'Vos idées',
  'widget.shell.tab.help': 'Assistance',
  'widget.shell.tab.feedback': 'Vos idées',
}

function monter(props: Partial<React.ComponentProps<typeof WidgetShell>> = {}) {
  return render(
    <IntlProvider locale="fr" messages={MESSAGES}>
      <WidgetShell
        orgSlug="diafane"
        activeTab="help"
        onTabChange={() => {}}
        enabledTabs={{ feedback: true, chat: true, home: false }}
        {...props}
      >
        <p>contenu</p>
      </WidgetShell>
    </IntlProvider>
  )
}

function signalMobile(data: boolean) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'quackback:mobile', data },
        source: window.parent,
      })
    )
  })
}

describe('WidgetShell', () => {
  it("titre l'onglet Assistance et l'onglet Vos idees, sans logo dans l'en-tete", () => {
    const { container, rerender } = monter()
    expect(container.querySelector('h2')?.textContent).toBe('Assistance')
    expect(container.querySelector('header img, .widget-shell-titre ~ img')).toBeNull()
    rerender(
      <IntlProvider locale="fr" messages={MESSAGES}>
        <WidgetShell
          orgSlug="diafane"
          activeTab="feedback"
          onTabChange={() => {}}
          enabledTabs={{ feedback: true, chat: true, home: false }}
        >
          <p>contenu</p>
        </WidgetShell>
      </IntlProvider>
    )
    expect(container.querySelector('h2')?.textContent).toBe('Vos idées')
  })

  it('les onglets du bas portent les memes titres, et le choisi a le trait epais en haut', () => {
    const { getAllByRole } = monter()
    const onglets = getAllByRole('tab')
    expect(onglets.map((o) => o.textContent)).toEqual(['Assistance', 'Vos idées'])
    expect(onglets[0].getAttribute('aria-selected')).toBe('true')
    expect(onglets[0].className).toContain('before:top-0')
    expect(onglets[0].className).toContain('before:h-[3px]')
    expect(onglets[1].getAttribute('aria-selected')).toBe('false')
    expect(onglets[1].className).not.toContain('before:h-[3px]')
  })

  it("l'avatar n'existe que sur telephone ; l'en-tete garde 52 px partout", () => {
    const { container } = monter()
    signalMobile(false)
    expect(container.querySelector('[aria-label="User menu"]')).toBeNull()
    expect(container.querySelector('.widget-shell-entete.h-\\[52px\\]')).not.toBeNull()
    signalMobile(true)
    expect(container.querySelector('[aria-label="User menu"]')).not.toBeNull()
    expect(container.querySelector('.widget-shell-entete.h-\\[52px\\]')).not.toBeNull()
  })

  it("l'en-tete et la barre d'onglets portent leur accroche pour la feuille du portail", () => {
    const { container } = monter()
    expect(container.querySelector('.widget-shell-entete')).not.toBeNull()
    expect(container.querySelector('.widget-shell-onglets')).not.toBeNull()
  })

  it('dans une conversation : la fleche de retour seule, aucun titre', () => {
    const { container } = monter({ onBack: () => {}, hideTitle: true })
    expect(container.querySelector('h2')).toBeNull()
    expect(container.querySelector('button[aria-label="Go back"]')).not.toBeNull()
  })

  it("dans le detail d'une idee ou la proposition : la fleche de retour ET le titre", () => {
    const { container } = monter({ onBack: () => {}, activeTab: 'feedback' })
    expect(container.querySelector('button[aria-label="Go back"]')).not.toBeNull()
    expect(container.querySelector('h2')?.textContent).toBe('Vos idées')
  })
})
