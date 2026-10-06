import type { SupportedLocale } from './i18n'

/**
 * Texts of the document `<head>` (tab title, meta description) that cannot go
 * through the message catalogs: `head()` runs before any catalog is loaded on
 * the root route, and the access gate loads the locale only. They are short, so
 * they live in this one table, for the six languages of the Diafane portal.
 * Any other locale reads the English text, like a missing catalog entry would.
 */
interface PageMetaTexts {
  /** Description of the pages outside the portal (sign-in screen, error pages). */
  rootDescription: string
  /** Tab title of the private-portal sign-in screen. */
  gateTitle: (workspace: string) => string
  /** Description of every portal page. */
  portalDescription: (workspace: string) => string
}

const PAGE_META: Partial<Record<SupportedLocale, PageMetaTexts>> = {
  en: {
    rootDescription: 'Help and ideas for Diafane, the stained glass design software.',
    gateTitle: (workspace) => `Sign in · ${workspace}`,
    portalDescription: (workspace) =>
      `Share feedback, vote on feature requests, and track the ${workspace} roadmap.`,
  },
  fr: {
    rootDescription: 'Aide et idées pour Diafane, le logiciel de conception de vitraux.',
    gateTitle: (workspace) => `Connexion · ${workspace}`,
    portalDescription: (workspace) =>
      `Partagez vos retours, votez pour les demandes de fonctionnalités et suivez la feuille de route de ${workspace}.`,
  },
  de: {
    rootDescription:
      'Hilfe und Ideen für Diafane, die Software zum Entwerfen von Bleiverglasungen.',
    gateTitle: (workspace) => `Anmelden · ${workspace}`,
    portalDescription: (workspace) =>
      `Teilen Sie Feedback, stimmen Sie über Funktionswünsche ab und verfolgen Sie die Roadmap von ${workspace}.`,
  },
  es: {
    rootDescription: 'Ayuda e ideas para Diafane, el software para diseñar vitrales.',
    gateTitle: (workspace) => `Iniciar sesión · ${workspace}`,
    portalDescription: (workspace) =>
      `Comparta sus comentarios, vote las solicitudes de funciones y siga la roadmap de ${workspace}.`,
  },
  it: {
    rootDescription: 'Aiuto e idee per Diafane, il software per progettare vetrate.',
    gateTitle: (workspace) => `Accedi · ${workspace}`,
    portalDescription: (workspace) =>
      `Condividere feedback, votare le richieste di funzioni e seguire la roadmap di ${workspace}.`,
  },
  nl: {
    rootDescription: 'Hulp en ideeën voor Diafane, de software voor glas-in-loodontwerp.',
    gateTitle: (workspace) => `Aanmelden · ${workspace}`,
    portalDescription: (workspace) =>
      `Deel feedback, stem op functieverzoeken en volg de roadmap van ${workspace}.`,
  },
}

/** The head texts for a locale, English when the locale has none. */
export function pageMeta(locale?: SupportedLocale | null): PageMetaTexts {
  return (locale && PAGE_META[locale]) || (PAGE_META.en as PageMetaTexts)
}
