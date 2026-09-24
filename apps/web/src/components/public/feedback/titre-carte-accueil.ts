/**
 * LE TITRE DE LA CARTE D'ACCUEIL PEUT PORTER UNE PARTIE DOREE.
 *
 * Le hero des pages publiques de Diafane finit son titre par un groupe en or
 * (`.v3-or` de `vitrine3.css` : « The » puis « Diafane guides »), et ce hero-ci
 * le recopie. Seulement, ce titre est du TEXTE BRUT dans les reglages du
 * portail, la ou le corps de la carte est du texte enrichi : une feuille de
 * style ne sait pas dorer un bout de phrase dans du texte brut, et il n'existe
 * aucun selecteur pour « les mots apres la virgule ».
 *
 * D'ou cette barre verticale, que l'on tape dans le champ du titre :
 *
 *     Vote for the next Diafane features, | or suggest your own
 *
 * Elle laisse choisir la coupure depuis l'ecran des reglages, sans toucher au
 * code, et elle tombe exactement ou la ligne casse, la partie doree etant
 * posee en bloc par la feuille.
 *
 * Un titre SANS barre reste un titre normal : rien n'est dore, et c'est le cas
 * de tous ceux qui existaient avant.
 */
export const SEPARATEUR_OR = '|'

export interface TitreCarteAccueil {
  /** Ce qui precede la barre, ou le titre entier s'il n'y en a pas. */
  debut: string
  /** Ce qui suit la PREMIERE barre, a dorer. Vide s'il n'y en a pas. */
  or: string
}

/**
 * Coupe le titre sur la PREMIERE barre verticale. Les barres suivantes restent
 * dans la partie doree : un titre en trois morceaux n'a pas de sens ici, et les
 * perdre en silence serait pire que les afficher.
 */
export function decouperTitre(titre: string): TitreCarteAccueil {
  const i = titre.indexOf(SEPARATEUR_OR)
  if (i === -1) return { debut: titre.trim(), or: '' }

  return {
    debut: titre.slice(0, i).trim(),
    or: titre.slice(i + SEPARATEUR_OR.length).trim(),
  }
}
