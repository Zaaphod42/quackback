import { useEffect, useState } from 'react'

/**
 * Le panneau est-il affiche en PLEIN ECRAN sur un telephone (et non pose en bas a droite d'une page de bureau) ?
 *
 * L'iframe est cross-origin : elle ne voit que sa propre largeur, et le panneau de bureau (400 px) ressemble a un
 * telephone. Le SDK hote, lui, connait la fenetre de la page : il envoie `quackback:mobile` (vrai sous 640 px) quand le
 * panneau est pret et a chaque changement (`packages/widget/src/core/sdk.ts`). Avant ce premier message on suppose un
 * telephone si l'appareil est tactile, ce qui evite de voir apparaitre l'avatar apres coup.
 */
export function useWidgetMobile(): boolean {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
  )

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) return
      const msg = event.data
      if (!msg || typeof msg !== 'object' || msg.type !== 'quackback:mobile') return
      setMobile(!!msg.data)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return mobile
}
