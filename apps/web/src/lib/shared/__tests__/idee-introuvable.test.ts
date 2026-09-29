import { describe, it, expect } from 'vitest'
import { isNotFound } from '@tanstack/react-router'
import { chargerOuIntrouvable } from '../idee-introuvable'

// Diafane (PLAN #660) : une idée absente sort en page introuvable, une vraie
// panne garde son erreur.
describe('chargerOuIntrouvable', () => {
  it('rend ce que le chargement rend, sans poser la question', async () => {
    let demande = false
    const r = await chargerOuIntrouvable(
      async () => 'idée',
      async () => {
        demande = true
        return true
      }
    )
    expect(r).toBe('idée')
    expect(demande).toBe(false)
  })

  it('lève une page introuvable quand l’idée n’existe pas', async () => {
    const erreur = await chargerOuIntrouvable(
      async () => {
        throw new Error('Post not found')
      },
      async () => false
    ).catch((e) => e)
    expect(isNotFound(erreur)).toBe(true)
  })

  it('garde l’erreur d’origine quand l’idée existe', async () => {
    const panne = new Error('database unavailable')
    const erreur = await chargerOuIntrouvable(
      async () => {
        throw panne
      },
      async () => true
    ).catch((e) => e)
    expect(erreur).toBe(panne)
  })

  it('garde l’erreur d’origine quand la question elle-même échoue', async () => {
    const panne = new Error('database unavailable')
    const erreur = await chargerOuIntrouvable(
      async () => {
        throw panne
      },
      async () => {
        throw new Error('still down')
      }
    ).catch((e) => e)
    expect(erreur).toBe(panne)
  })
})
