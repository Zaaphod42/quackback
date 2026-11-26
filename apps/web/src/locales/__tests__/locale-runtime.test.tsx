// @vitest-environment happy-dom
/**
 * Verification de bout en bout du chargement des catalogues. Les tests de parite prouvent que les fichiers sont
 * bien formes ; celui-ci prouve qu'ils se CHARGENT et se RENDENT par la vraie pile cliente : l'import dynamique de
 * `loadMessages` trouve le fichier (et ne retombe pas silencieusement sur l'anglais), `PortalIntlProvider` le donne
 * a react-intl, et un pluriel se formate avec le nombre. Une langue SANS catalogue (le chinois, retire le
 * 2026-11-26) doit, elle, servir l'anglais.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FormattedMessage } from 'react-intl'
import { PortalIntlProvider } from '@/components/portal-intl-provider'
import { loadMessages, type SupportedLocale } from '@/lib/shared/i18n'

describe('locale runtime wiring', () => {
  it('loadMessages resolves the real catalogs, not the English fallback', async () => {
    const [en, fr, it] = await Promise.all([
      loadMessages('en'),
      loadMessages('fr'),
      loadMessages('it'),
    ])
    // Un mauvais chemin d'import retomberait sans bruit sur l'anglais : on verifie donc que la valeur est la
    // traduction, distincte de l'anglais.
    expect(fr['widget.voteButton.label']).toBe('Voter')
    expect(it['widget.voteButton.label']).toBe('Vota')
    expect(fr['widget.voteButton.label']).not.toBe(en['widget.voteButton.label'])
  })

  it('serves English for a language that has no catalog any more', async () => {
    const en = await loadMessages('en')
    const zh = await loadMessages('zh-cn' as SupportedLocale)
    expect(zh['widget.voteButton.label']).toBe(en['widget.voteButton.label'])
  })

  it('renders French synchronously when SSR provides the catalog (no async wait)', async () => {
    const fr = await loadMessages('fr')
    render(
      <PortalIntlProvider locale="fr" messages={fr}>
        <span data-testid="vote-ssr">
          <FormattedMessage id="widget.voteButton.label" defaultMessage="Vote" />
        </span>
      </PortalIntlProvider>
    )
    // Pas de findBy/waitFor : le chemin SSR doit deja porter la traduction au tout premier rendu.
    expect(screen.getByTestId('vote-ssr').textContent).toBe('Voter')
  })

  it('renders Italian through PortalIntlProvider once the catalog loads', async () => {
    render(
      <PortalIntlProvider locale="it">
        <span data-testid="vote">
          <FormattedMessage id="widget.voteButton.label" defaultMessage="Vote" />
        </span>
      </PortalIntlProvider>
    )
    const node = await screen.findByTestId('vote')
    await waitFor(() => expect(node.textContent).toBe('Vota'))
  })

  it('formats a plural with the count substituted', async () => {
    render(
      <PortalIntlProvider locale="fr">
        <span data-testid="plural">
          <FormattedMessage
            id="widget.help.articleCount"
            defaultMessage="{count, plural, one {# article} other {# articles}}"
            values={{ count: 3 }}
          />
        </span>
      </PortalIntlProvider>
    )
    const node = await screen.findByTestId('plural')
    await waitFor(() => expect(node.textContent).toBe('3 articles'))
  })
})
