/**
 * ⭐ CE QU'ON TAPE DANS LE CHAMP D'UN LIEN, TEL QU'IL SERA ENREGISTRÉ.
 *
 * Les deux éditeurs de lien du texte enrichi (la bulle de la barre d'outils et
 * l'invite) ajoutaient `https://` devant tout ce qui ne commençait pas par
 * `http` : `mailto:hello@exemple.com` devenait `https://mailto:hello@exemple.com`,
 * l'adresse d'un site qui n'existe pas, et `/support` devenait
 * `https:///support`. Ils passent désormais tous deux par cette fonction.
 *
 * Restent tels quels : `http://`, `https://`, `mailto:` (les protocoles que
 * `sanitizeUrl` laisse passer au rendu) et les chemins du site, qui commencent
 * par `/`. Une adresse sans protocole (`exemple.com`) reçoit toujours
 * `https://`, comme avant.
 */
export function normaliserLien(url: string): string {
  const lien = url.trim()
  if (/^(https?:\/\/|mailto:)/i.test(lien) || lien.startsWith('/')) return lien
  return `https://${lien}`
}
