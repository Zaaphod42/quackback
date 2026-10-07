import { describe, it, expect } from 'vitest'
import { decouperTitre, separerTitre } from '../titre-carte-accueil'

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

// Depuis la 0.14, la carte n'a plus de champ titre : l'ancien titre arrive en
// titre de niveau 2 en tete du texte enrichi (`resolveWelcomeCard`).
describe('separerTitre', () => {
  const titre = (texte: string, level = 2) => ({
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text: texte }],
  })
  const paragraphe = (texte: string) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: texte }],
  })

  it('sort le titre de tete et le decoupe sur la barre', () => {
    const corps = {
      type: 'doc',
      content: [
        titre('Vote for the next Diafane features, | or suggest your own'),
        paragraphe('Hi'),
      ],
    }
    expect(separerTitre(corps)).toEqual({
      titre: { debut: 'Vote for the next Diafane features,', or: 'or suggest your own' },
      corps: { type: 'doc', content: [paragraphe('Hi')] },
    })
  })

  it('ne rend aucun corps quand le titre etait tout le texte', () => {
    const corps = { type: 'doc', content: [titre('Un titre')] }
    expect(separerTitre(corps)).toEqual({ titre: { debut: 'Un titre', or: '' }, corps: null })
  })

  it('laisse le texte entier quand il ne commence pas par un titre de niveau 2', () => {
    for (const premier of [paragraphe('Hi'), titre('Un titre', 3)]) {
      const corps = { type: 'doc', content: [premier] }
      expect(separerTitre(corps)).toEqual({ titre: null, corps })
    }
  })

  // Le decouper perdrait sa mise en forme : il reste dans le texte enrichi.
  it('laisse en place un titre mis en forme', () => {
    const corps = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Gras', marks: [{ type: 'bold' }] }],
        },
      ],
    }
    expect(separerTitre(corps)).toEqual({ titre: null, corps })
  })
})
