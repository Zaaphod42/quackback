/**
 * ⭐ LA CHARTE DE DIAFANE, POUR LES MAILS (adaptation du fork, 2026-09-23).
 *
 * POURQUOI CE FICHIER EST RETOUCHE ET PAS LE CSS D'HABILLAGE : le CSS colle
 * dans `Settings > Branding` habille le portail, l'ecran de connexion et le
 * widget, mais il N'ATTEINT PAS les mails. Ceux-ci sont rendus en React par ce
 * paquet, et leurs couleurs vivent ICI, en dur. Le seul reglage que
 * l'administration expose pour un mail est le LOGO (`settings.logoKey`).
 *
 * CE QUE CA CORRIGEAIT, mesure le 2026-09-22 : les quatorze gabarits partaient
 * avec le dore de Quackback `#FFD43B` sur leurs boutons et un ambre `#b45309`
 * sur chaque lien. Ce sont un JAUNE et un ORANGE, les deux seules couleurs que
 * la charte de Diafane interdit sans exception (« il n'y a plus aucune
 * exception au jaune, l'admin comprise »).
 *
 * LES VALEURS sont celles que Seb a arretees pour le portail, donc les memes
 * des deux cotes : une seule apparence a tenir a jour.
 *
 * ⚠️ A REAPPLIQUER A CHAQUE MONTEE DE VERSION, comme le correctif des images
 * MinIO et celui de `robots.txt`.
 *
 * CE QU'ON NE TOUCHE PAS, et pourquoi :
 *  - LA PILE DE POLICES reste celle du systeme. Diafane ecrit en Google Sans,
 *    mais une police distante ne se charge pas dans la plupart des logiciels de
 *    messagerie : la pile actuelle EST deja le repli de l'application.
 *  - LA POLICE DES TITRES (Glass Antiqua) ne peut pas suivre, pour la meme
 *    raison. Un mail n'a pas les titres de la vitrine, il a son encre.
 */

/**
 * Le repli quand aucun logo n'est charge dans l'administration. Il pointait sur
 * `quackback.io/logo.png`, donc tant que le reglage restait vide CHAQUE mail
 * partait avec le logo d'un autre produit.
 */
export const DEFAULT_LOGO_URL = 'https://diafane.com/email-logo.png'

// Les jetons de Diafane (resources/css/vitrine3.css et le kit du portail).
export const colors = {
  // Le bouton est NOIR a texte creme, comme `.v3-btn-noir` : c'est le bouton
  // de Diafane. `primaryDark` est l'elevation e1, celle des survols.
  primary: '#14181C', // DiafaneBlack
  primaryDark: '#1E242A', // DiafaneBlack e1

  // Text colors
  heading: '#14181C', // DiafaneBlack
  text: '#4a453d', // entre l'encre et le gris de la charte
  textMuted: '#6f6a60', // --gris
  textLight: '#a39d90', // --gris-clair

  // Background colors
  background: '#faf6ef', // le creme de l'application
  surface: '#ffffff',
  surfaceMuted: '#f4eee2', // le beige

  // Border
  border: '#ece8e1',
}

// Common layout styles
export const layout = {
  main: {
    backgroundColor: colors.background,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  container: {
    backgroundColor: colors.surface,
    padding: '48px 32px',
    maxWidth: '560px',
    borderRadius: '12px',
  },
}

// Typography styles
export const typography = {
  h1: {
    color: colors.heading,
    fontSize: '24px',
    fontWeight: '700' as const,
    lineHeight: '32px',
    marginTop: '0',
    marginBottom: '8px',
  },
  h2: {
    color: colors.heading,
    fontSize: '20px',
    fontWeight: '600' as const,
    lineHeight: '28px',
    marginTop: '0',
    marginBottom: '8px',
  },
  text: {
    color: colors.text,
    fontSize: '16px',
    lineHeight: '26px',
    marginTop: '0',
    marginBottom: '24px',
  },
  textSmall: {
    color: colors.textMuted,
    fontSize: '14px',
    lineHeight: '22px',
    marginTop: '0',
    marginBottom: '16px',
  },
  footer: {
    color: colors.textLight,
    fontSize: '13px',
    lineHeight: '20px',
    marginTop: '32px',
    marginBottom: '0',
    textAlign: 'center' as const,
  },
}

// Button styles
export const button = {
  primary: {
    backgroundColor: colors.primary,
    // La capsule de `.v3-btn`. Les vieux Outlook la rendent carree, ce qui est
    // une degradation visible mais honnete : aucune autre valeur ne donnerait
    // le bouton de Diafane ailleurs.
    borderRadius: '999px',
    color: '#faf6ef', // le creme, sur le noir
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
}

// Utility styles
export const utils = {
  divider: {
    borderTop: `1px solid ${colors.border}`,
    marginTop: '32px',
    marginBottom: '32px',
  },
  link: {
    color: colors.heading,
    textDecoration: 'underline',
  },
  codeBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    padding: '24px',
    textAlign: 'center' as const,
  },
  code: {
    color: colors.heading,
    fontSize: '32px',
    fontWeight: '700' as const,
    letterSpacing: '0.2em',
    fontFamily: 'monospace',
    marginTop: '0',
    marginBottom: '0',
  },
}

// Logo/branding
export const branding = {
  logoContainer: {
    textAlign: 'center' as const,
    paddingBottom: '32px',
  },
  logo: {
    width: 48,
    height: 48,
    display: 'block' as const,
    margin: '0 auto',
  },
  appName: {
    color: colors.heading,
    fontSize: '18px',
    fontWeight: '700',
    marginTop: '12px',
    marginBottom: '0',
    textAlign: 'center' as const,
  },
}
