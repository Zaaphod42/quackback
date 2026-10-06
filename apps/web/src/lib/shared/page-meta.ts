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
  /** Description of every portal page that has no description of its own. */
  portalDescription: (workspace: string) => string
  /** Tab title of the ideas list (the home page of the portal). */
  feedbackTitle: (workspace: string) => string
  /** Description of the ideas list. */
  feedbackDescription: (workspace: string) => string
  /** Tab title of the roadmap page. */
  roadmapTitle: (workspace: string) => string
  /** Description of the roadmap page. */
  roadmapDescription: (workspace: string) => string
  /** Description of an idea page: its title and the name of its category. */
  postDescription: (postTitle: string, boardName: string) => string
}

const PAGE_META: Partial<Record<SupportedLocale, PageMetaTexts>> = {
  en: {
    rootDescription: 'Help and ideas for Diafane, the stained glass design software.',
    gateTitle: (workspace) => `Sign in · ${workspace}`,
    portalDescription: (workspace) =>
      `Share feedback, vote on feature requests, and track the ${workspace} roadmap.`,
    feedbackTitle: (workspace) => `Feedback - ${workspace}`,
    feedbackDescription: (workspace) =>
      `Submit and vote on feature requests for ${workspace}. Help shape what gets built next.`,
    roadmapTitle: (workspace) => `Roadmap - ${workspace}`,
    roadmapDescription: (workspace) =>
      `See what ${workspace} is working on and what's coming next.`,
    postDescription: (postTitle, boardName) =>
      `${postTitle}. Vote and comment on this ${boardName} post.`,
  },
  fr: {
    rootDescription: 'Aide et idées pour Diafane, le logiciel de conception de vitraux.',
    gateTitle: (workspace) => `Connexion · ${workspace}`,
    portalDescription: (workspace) =>
      `Partagez vos retours, votez pour les demandes de fonctionnalités et suivez la feuille de route de ${workspace}.`,
    feedbackTitle: (workspace) => `Feedback - ${workspace}`,
    feedbackDescription: (workspace) =>
      `Proposez des fonctionnalités pour ${workspace} et votez pour celles des autres. Aidez à décider de la suite.`,
    roadmapTitle: (workspace) => `Feuille de route - ${workspace}`,
    roadmapDescription: (workspace) =>
      `Découvrez ce sur quoi ${workspace} travaille et ce qui arrive ensuite.`,
    postDescription: (postTitle, boardName) =>
      `${postTitle}. Votez et commentez cette publication de ${boardName}.`,
  },
  de: {
    rootDescription:
      'Hilfe und Ideen für Diafane, die Software zum Entwerfen von Bleiverglasungen.',
    gateTitle: (workspace) => `Anmelden · ${workspace}`,
    portalDescription: (workspace) =>
      `Teilen Sie Feedback, stimmen Sie über Funktionswünsche ab und verfolgen Sie die Roadmap von ${workspace}.`,
    feedbackTitle: (workspace) => `Feedback - ${workspace}`,
    feedbackDescription: (workspace) =>
      `Reichen Sie Funktionswünsche für ${workspace} ein und stimmen Sie darüber ab. Gestalten Sie mit, was als Nächstes entsteht.`,
    roadmapTitle: (workspace) => `Roadmap - ${workspace}`,
    roadmapDescription: (workspace) =>
      `Sehen Sie, woran ${workspace} arbeitet und was als Nächstes kommt.`,
    postDescription: (postTitle, boardName) =>
      `${postTitle}. Stimmen Sie ab und kommentieren Sie diesen Beitrag in ${boardName}.`,
  },
  es: {
    rootDescription: 'Ayuda e ideas para Diafane, el software para diseñar vitrales.',
    gateTitle: (workspace) => `Iniciar sesión · ${workspace}`,
    portalDescription: (workspace) =>
      `Comparta sus comentarios, vote las solicitudes de funciones y siga la roadmap de ${workspace}.`,
    feedbackTitle: (workspace) => `Feedback - ${workspace}`,
    feedbackDescription: (workspace) =>
      `Proponga funcionalidades para ${workspace} y vote las de otros. Ayude a decidir qué se desarrollará a continuación.`,
    roadmapTitle: (workspace) => `Roadmap - ${workspace}`,
    roadmapDescription: (workspace) =>
      `Consulte en qué está trabajando ${workspace} y qué viene a continuación.`,
    postDescription: (postTitle, boardName) =>
      `${postTitle}. Vote y comente esta publicación de ${boardName}.`,
  },
  it: {
    rootDescription: 'Aiuto e idee per Diafane, il software per progettare vetrate.',
    gateTitle: (workspace) => `Accedi · ${workspace}`,
    portalDescription: (workspace) =>
      `Condividere feedback, votare le richieste di funzioni e seguire la roadmap di ${workspace}.`,
    feedbackTitle: (workspace) => `Feedback - ${workspace}`,
    feedbackDescription: (workspace) =>
      `Proporre funzioni per ${workspace} e votare quelle degli altri. Contribuire a decidere cosa verrà sviluppato.`,
    roadmapTitle: (workspace) => `Roadmap - ${workspace}`,
    roadmapDescription: (workspace) =>
      `Scoprire a cosa lavora ${workspace} e cosa arriverà prossimamente.`,
    postDescription: (postTitle, boardName) =>
      `${postTitle}. Votare e commentare questo post di ${boardName}.`,
  },
  nl: {
    rootDescription: 'Hulp en ideeën voor Diafane, de software voor glas-in-loodontwerp.',
    gateTitle: (workspace) => `Aanmelden · ${workspace}`,
    portalDescription: (workspace) =>
      `Deel feedback, stem op functieverzoeken en volg de roadmap van ${workspace}.`,
    feedbackTitle: (workspace) => `Feedback - ${workspace}`,
    feedbackDescription: (workspace) =>
      `Dien functieverzoeken in voor ${workspace} en stem op die van anderen. Help mee bepalen wat er hierna wordt gebouwd.`,
    roadmapTitle: (workspace) => `Roadmap - ${workspace}`,
    roadmapDescription: (workspace) => `Bekijk waar ${workspace} aan werkt en wat er nog aankomt.`,
    postDescription: (postTitle, boardName) =>
      `${postTitle}. Stem en reageer op dit bericht in ${boardName}.`,
  },
}

/** The head texts for a locale, English when the locale has none. */
export function pageMeta(locale?: SupportedLocale | null): PageMetaTexts {
  return (locale && PAGE_META[locale]) || (PAGE_META.en as PageMetaTexts)
}

/**
 * The visitor's locale, read from the route match handed to `head()`: the root
 * route puts it in the router context (`acceptLanguageLocale`), and every child
 * match inherits it. Read through `unknown` so the call type-checks whatever the
 * route typing of the file (the generated route tree is not always there).
 */
export function matchLocale(match: unknown): SupportedLocale | undefined {
  return (match as { context?: { acceptLanguageLocale?: SupportedLocale } } | null | undefined)
    ?.context?.acceptLanguageLocale
}
