import { notFound } from '@tanstack/react-router'

/**
 * Diafane : UNE IDÉE QUI N'EXISTE PAS EST INTROUVABLE, PAS UNE PANNE (PLAN #660
 * de Diafane).
 *
 * La requête du détail d'une idée LÈVE « Post not found » quand l'idée manque
 * (supprimée, fusionnée hors de vue, ou lien mal recopié), et les requêtes
 * lancées à côté d'elle peuvent échouer avant elle. Le `throw notFound()` qui
 * suivait le chargement n'était donc jamais atteint : la page sortait en 500,
 * « Something went wrong », au lieu de la page introuvable.
 *
 * Quand le chargement échoue, on demande donc à part si l'idée existe. Si elle
 * n'existe pas, c'est une page introuvable (statut 404) ; si elle existe, ou si
 * la question elle-même échoue, l'erreur d'origine repart telle quelle : une
 * vraie panne ne doit pas se déguiser en page introuvable.
 */
export async function chargerOuIntrouvable<T>(
  charger: () => Promise<T>,
  existe: () => Promise<boolean>
): Promise<T> {
  try {
    return await charger()
  } catch (erreur) {
    const presente = await existe().catch(() => true)
    if (!presente) throw notFound()
    throw erreur
  }
}
