// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { act, render } from '@testing-library/react'
import { useWidgetMobile } from '../use-widget-mobile'

function Probe() {
  return <span data-testid="mobile">{String(useWidgetMobile())}</span>
}

/** Le SDK hote envoie `quackback:mobile` ; l'evenement doit venir de la fenetre parente. */
function depuisLHote(data: boolean) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'quackback:mobile', data },
        source: window.parent,
      })
    )
  })
}

describe('useWidgetMobile', () => {
  it("suit le signal de l'hote : telephone puis bureau", () => {
    const { getByTestId } = render(<Probe />)
    depuisLHote(true)
    expect(getByTestId('mobile').textContent).toBe('true')
    depuisLHote(false)
    expect(getByTestId('mobile').textContent).toBe('false')
  })

  it('ignore un message qui ne vient pas de la fenetre parente', () => {
    const { getByTestId } = render(<Probe />)
    depuisLHote(true)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'quackback:mobile', data: false },
          source: null,
        })
      )
    })
    expect(getByTestId('mobile').textContent).toBe('true')
  })
})
