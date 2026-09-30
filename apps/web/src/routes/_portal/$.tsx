import { createFileRoute, notFound } from '@tanstack/react-router'

/**
 * Diafane : UNE ADRESSE INCONNUE GARDE LA BARRE DU PORTAIL (PLAN #660 de Diafane).
 *
 * Sans cette route, une adresse qu'aucune autre ne reconnaît sortait par le
 * `defaultNotFoundComponent` du routeur, hors du gabarit `_portal` : une page
 * blanche, sans la barre ni la feuille d'habillage. Attrapée ici, elle lève la
 * même page introuvable qu'une idée inconnue, rendue DANS le gabarit, et le
 * statut reste 404. Une route plus précise l'emporte toujours sur celle-ci.
 */
export const Route = createFileRoute('/_portal/$')({
  loader: () => {
    throw notFound()
  },
})
