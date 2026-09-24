import { describe, it, expect } from 'vitest'
import { decouperTitre } from '../titre-carte-accueil'

// Le titre de la carte d'accueil est du TEXTE BRUT dans les reglages : sans ce
// decoupage, il n'existe aucun moyen de dorer sa fin, comme le fait le hero des
// pages publiques de Diafane.
describe('decouperTitre', () => {
  it('coupe sur la barre et pare les deux moities de leurs espaces', () => {
    expect(decouperTitre('Vote for the next Diafane features, | or suggest your own')).toEqual({
      debut: 'Vote for the next Diafane features,',
      or: 'or suggest your own',
    })
  })

  // Tous les titres qui existaient avant sont dans ce cas : rien ne se dore, et
  // surtout rien ne disparait.
  it('rend le titre entier quand il n a pas de barre', () => {
    expect(decouperTitre('Vote for the next Diafane features')).toEqual({
      debut: 'Vote for the next Diafane features',
      or: '',
    })
  })

  // Perdre un morceau en silence serait pire que d'en afficher un de trop.
  it('garde les barres suivantes dans la partie doree', () => {
    expect(decouperTitre('a | b | c')).toEqual({ debut: 'a', or: 'b | c' })
  })

  it('accepte une barre collee au texte', () => {
    expect(decouperTitre('Un titre|sa fin')).toEqual({ debut: 'Un titre', or: 'sa fin' })
  })

  it('ne dore rien quand la barre finit le titre', () => {
    expect(decouperTitre('Un titre |')).toEqual({ debut: 'Un titre', or: '' })
  })
})
