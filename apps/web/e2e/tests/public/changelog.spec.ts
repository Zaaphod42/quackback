import { test, expect } from '@playwright/test'

// Le portail n'a pas de page de nouveautés : toute adresse de nouveautés mène
// aux idées réalisées (`src/components/public/nouveautes-du-portail.ts`). Le
// filtre sort en LISTE dans l'adresse, et l'accueil peut y ajouter son tri.
const IDEES_REALISEES = /[?&]status=%5B%22complete%22%5D(&|$)/

test.describe('Adresses des nouveautés', () => {
  test('la liste mène aux idées réalisées', async ({ page }) => {
    await page.goto('/changelog')
    await expect(page).toHaveURL(IDEES_REALISEES)
  })

  test('une entrée mène aux idées réalisées', async ({ page }) => {
    await page.goto('/changelog/une-entree-quelconque')
    await expect(page).toHaveURL(IDEES_REALISEES)
  })
})
