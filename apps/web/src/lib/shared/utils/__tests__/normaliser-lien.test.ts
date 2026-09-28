import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { normaliserLien } from '../normaliser-lien'
import { sanitizeUrl } from '../sanitize'

describe('normaliserLien', () => {
  it('garde une adresse mail telle quelle', () => {
    expect(normaliserLien('mailto:hello@exemple.com')).toBe('mailto:hello@exemple.com')
    expect(normaliserLien('MAILTO:hello@exemple.com')).toBe('MAILTO:hello@exemple.com')
  })

  it('garde une adresse web complète', () => {
    expect(normaliserLien('https://exemple.com/a?b=1')).toBe('https://exemple.com/a?b=1')
    expect(normaliserLien('http://exemple.com')).toBe('http://exemple.com')
  })

  it('garde un chemin du site', () => {
    expect(normaliserLien('/support')).toBe('/support')
  })

  it('ajoute https:// à une adresse tapée sans protocole', () => {
    expect(normaliserLien('exemple.com')).toBe('https://exemple.com')
  })

  it('retire les blancs tapés autour', () => {
    expect(normaliserLien('  mailto:hello@exemple.com ')).toBe('mailto:hello@exemple.com')
  })

  // Ce qui est enregistré doit survivre au filtre du rendu : sans quoi le lien
  // serait accepté dans l'éditeur puis retiré de la page publique.
  it.each(['mailto:hello@exemple.com', 'https://exemple.com', '/support', 'exemple.com'])(
    '%s passe le filtre du rendu',
    (tape) => {
      expect(sanitizeUrl(normaliserLien(tape))).not.toBe('')
    }
  )
})

describe('les éditeurs de lien du texte enrichi', () => {
  const editeur = readFileSync(
    fileURLToPath(new URL('../../../../components/ui/rich-text-editor.tsx', import.meta.url)),
    'utf8'
  )

  it('passent tous les deux par normaliserLien', () => {
    expect(editeur.match(/normaliserLien\(/g)).toHaveLength(2)
  })

  it('n’ajoutent plus https:// de leur côté', () => {
    expect(editeur).not.toMatch(/`https:\/\/\$\{url\}`/)
  })
})
