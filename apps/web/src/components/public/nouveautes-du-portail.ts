/**
 * ⭐ LE PORTAIL N'A PAS DE PAGE DE NOUVEAUTÉS : LE JOURNAL VIT DANS DIAFANE.
 *
 * Les nouveautés de Diafane s'écrivent une seule fois, dans l'application
 * elle-même. Une copie ici serait à reposer à chaque version, et se figerait le
 * jour où on l'oublierait. Ce qui a été livré se lit donc dans les IDÉES
 * RÉALISÉES : le tableau filtré sur le statut `complete`, qui se tient à jour de
 * lui-même dès qu'une idée change de statut.
 *
 * Toute adresse de nouveautés y mène, la liste comme une entrée : les deux
 * routes de `_portal/changelog` lèvent `redirect(versIdeesRealisees())` dans
 * leur `beforeLoad`. Le sitemap ne les liste plus, et la racine n'annonce plus
 * de flux RSS ; `routes/changelog/feed.ts` reste servi, mais rien n'y mène.
 *
 * Deux détails qui comptent :
 *  - le filtre s'écrit en LISTE (`status: ['complete']`), la forme que le
 *    `validateSearch` de l'accueil attend ; `?status=complete` tout court y
 *    répond 500 ;
 *  - la redirection est TEMPORAIRE (307, la valeur par défaut de `redirect`) :
 *    un navigateur garde une 301 en mémoire, et rouvrir un jour ces pages
 *    passerait inaperçu de qui y est déjà venu.
 */
export function versIdeesRealisees() {
  return { to: '/' as const, search: { status: ['complete'] }, replace: true }
}
