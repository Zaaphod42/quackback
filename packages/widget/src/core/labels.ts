/**
 * Accessible names of the elements the SDK injects into the HOST page: the
 * launcher button and the iframe. The SDK is a standalone package with no
 * message catalogs, so these few labels live in this table. They match the
 * wording of the widget's own catalogs (`widget.shell.aria.close`).
 *
 * Six languages; any other locale reads the English text.
 */
export interface WidgetLabels {
  /** Launcher button, panel closed. */
  open: string
  /** Launcher button, panel open. */
  close: string
  /** Title of the iframe that holds the widget. */
  frame: string
}

const LABELS: Record<string, WidgetLabels> = {
  en: { open: 'Open feedback widget', close: 'Close feedback widget', frame: 'Feedback Widget' },
  fr: {
    open: 'Ouvrir le widget de feedback',
    close: 'Fermer le widget de feedback',
    frame: 'Widget de feedback',
  },
  de: {
    open: 'Feedback-Widget öffnen',
    close: 'Feedback-Widget schließen',
    frame: 'Feedback-Widget',
  },
  es: {
    open: 'Abrir widget de feedback',
    close: 'Cerrar widget de feedback',
    frame: 'Widget de feedback',
  },
  it: {
    open: 'Apri il widget di feedback',
    close: 'Chiudi il widget di feedback',
    frame: 'Widget di feedback',
  },
  nl: {
    open: 'Feedbackwidget openen',
    close: 'Feedbackwidget sluiten',
    frame: 'Feedbackwidget',
  },
}

/**
 * The labels for a locale: the `locale` init option when given, otherwise the
 * browser's first language (what the server reads from Accept-Language for the
 * content of the iframe). Region subtags are ignored (`nl-BE` is `nl`).
 */
export function widgetLabels(locale?: string): WidgetLabels {
  const tag =
    locale ??
    (typeof navigator !== 'undefined' ? (navigator.languages?.[0] ?? navigator.language) : '') ??
    ''
  const base = tag.toLowerCase().split(/[-_]/)[0]
  return LABELS[base] ?? LABELS.en
}
