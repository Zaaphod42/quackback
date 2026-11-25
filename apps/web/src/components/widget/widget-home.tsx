import { lazy, Suspense } from 'react'
import { FormattedMessage } from 'react-intl'
import { LightbulbIcon } from 'lucide-react'
import type { WidgetHomeProps } from './widget-home-animated'

// Defer framer-motion (~360KB minified) to a client-only chunk. The widget
// home form is interactive — it expands on input — so SSR only needs a
// static collapsed shell that matches the animated version's layout.
const WidgetHomeAnimated = lazy(() =>
  import('./widget-home-animated').then((m) => ({ default: m.WidgetHomeAnimated }))
)

function WidgetHomeFallback() {
  // Le temps que l'ecran arrive : la place du bouton « Proposer une idee », rien d'autre.
  return (
    <div className="px-4 py-4">
      <div className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground opacity-60">
        <LightbulbIcon className="size-4" />
        <FormattedMessage id="widget.home.propose" defaultMessage="Propose an idea" />
      </div>
    </div>
  )
}

export function WidgetHome(props: WidgetHomeProps) {
  return (
    <Suspense fallback={<WidgetHomeFallback />}>
      <WidgetHomeAnimated {...props} />
    </Suspense>
  )
}
