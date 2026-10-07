import type { TiptapContent } from '@/lib/shared/db-types'
import { isEmptyTiptapDoc } from '@/lib/shared/utils/is-empty-tiptap-doc'

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
 *
 * ⚠️ DEPUIS LA 0.14, LA CARTE N'A PLUS DE CHAMP TITRE : elle n'est plus qu'un
 * texte enrichi, et l'amont replie l'ancien titre en un titre de niveau 2 pose
 * EN TETE de ce texte (`resolveWelcomeCard`). `separerTitre` l'en ressort, pour
 * que la carte garde son `<h2 id="portal-welcome-title">` et l'etiquette de sa
 * section, sur lesquels la feuille d'habillage pose tout le hero.
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

export interface CarteAccueilSeparee {
  /** Le titre de tete, decoupe ; `null` si le texte ne commence pas par un. */
  titre: TitreCarteAccueil | null
  /** Le reste du texte, ou `null` s'il ne reste rien a afficher. */
  corps: TiptapContent | null
}

/**
 * Le texte d'un titre de niveau 2 fait de texte SANS mise en forme, la forme
 * exacte que produit le repli de l'ancien titre. Un titre mis en forme (gras,
 * lien...) n'est pas sorti : le decouper en perdrait la mise en forme, il reste
 * donc dans le texte enrichi.
 */
function texteDuTitreDeTete(noeud: TiptapContent | undefined): string | null {
  if (!noeud || noeud.type !== 'heading' || noeud.attrs?.level !== 2) return null
  const enfants = noeud.content ?? []
  if (enfants.length === 0) return null
  if (enfants.some((enfant) => enfant.type !== 'text' || (enfant.marks?.length ?? 0) > 0)) {
    return null
  }
  const texte = enfants
    .map((enfant) => enfant.text ?? '')
    .join('')
    .trim()
  return texte.length > 0 ? texte : null
}

/** Sort le titre de tete du texte de la carte (voir l'en-tete de ce fichier). */
export function separerTitre(corps: TiptapContent): CarteAccueilSeparee {
  const [premier, ...suite] = corps.content ?? []
  const texte = texteDuTitreDeTete(premier)
  if (texte === null) return { titre: null, corps }

  const reste: TiptapContent = { ...corps, content: suite }
  return { titre: decouperTitre(texte), corps: isEmptyTiptapDoc(reste) ? null : reste }
}
