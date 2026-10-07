// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortalWelcomeCard } from '../portal-welcome-card'
import type { PortalWelcomeCard as PortalWelcomeCardData } from '@/lib/shared/types/settings'

const emptyBody = { type: 'doc', content: [{ type: 'paragraph' }] }

const richBody = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Tell us what you would like to see next.' }],
    },
  ],
}

describe('<PortalWelcomeCard>', () => {
  it('renders nothing when welcomeCard is undefined', () => {
    const { container } = render(<PortalWelcomeCard welcomeCard={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when the body is empty', () => {
    const data: PortalWelcomeCardData = { body: emptyBody }
    const { container } = render(<PortalWelcomeCard welcomeCard={data} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when the body is whitespace-only', () => {
    const data: PortalWelcomeCardData = {
      body: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '   ' }] }],
      },
    }
    const { container } = render(<PortalWelcomeCard welcomeCard={data} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the body when it has visible content', () => {
    render(<PortalWelcomeCard welcomeCard={{ body: richBody }} />)
    expect(screen.getByText(/Tell us what you would like to see next\./)).toBeDefined()
  })
})

// DIAFANE : le hero du portail. Sa feuille d'habillage s'accroche a l'etiquette
// de la section et dore `.portal-welcome-title__or`.
describe('<PortalWelcomeCard> — le hero de Diafane', () => {
  it('pose le titre de tete en h2 et dore ce qui suit la barre', () => {
    const { container } = render(
      <PortalWelcomeCard
        welcomeCard={{
          body: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Vote for the next features, | or suggest yours' }],
              },
              ...richBody.content,
            ],
          },
        }}
      />
    )
    const section = container.querySelector('section[aria-labelledby="portal-welcome-title"]')
    expect(section).not.toBeNull()
    const h2 = section!.querySelector('h2#portal-welcome-title')
    expect(h2?.textContent).toBe('Vote for the next features, or suggest yours')
    expect(h2?.querySelector('.portal-welcome-title__or')?.textContent).toBe('or suggest yours')
    expect(section!.querySelectorAll('h2')).toHaveLength(1)
    expect(screen.getByText(/Tell us what you would like to see next\./)).toBeDefined()
  })

  it('ne pose aucune etiquette quand le texte ne commence pas par un titre', () => {
    const { container } = render(<PortalWelcomeCard welcomeCard={{ body: richBody }} />)
    expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBeNull()
  })
})
