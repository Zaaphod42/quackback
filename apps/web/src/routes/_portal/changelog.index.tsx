import { createFileRoute, redirect } from '@tanstack/react-router'
import { versIdeesRealisees } from '@/components/public/nouveautes-du-portail'

// Pas de page de nouveautés sur ce portail : `nouveautes-du-portail.ts` dit pourquoi.
export const Route = createFileRoute('/_portal/changelog/')({
  beforeLoad: () => {
    throw redirect(versIdeesRealisees())
  },
})
