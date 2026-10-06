// @vitest-environment happy-dom
/**
 * The editor is shared by the portal, the widget and the admin app. Its texts
 * (slash menu, toolbars, image and table controls) follow the language of the
 * provider; without a provider, as in the admin app, they stay in English.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IntlProvider, createIntl } from 'react-intl'
import type { EditorFeatures } from '../rich-text-editor'
import { RichTextEditor, getSlashMenuItems, buildExtensions } from '../rich-text-editor'
import it_ from '@/locales/it.json'
import nl from '@/locales/nl.json'

const FEATURES: EditorFeatures = {
  headings: true,
  codeBlocks: true,
  taskLists: true,
  blockquotes: true,
  dividers: true,
  tables: true,
  images: true,
  embeds: true,
  slashMenu: true,
}

const intlFor = (locale: 'it' | 'nl') =>
  createIntl({ locale, messages: locale === 'it' ? it_ : nl, defaultLocale: 'en' })

const upload = async () => '/x.png'

describe('slash menu items', () => {
  it('are written in Italian under an Italian provider', () => {
    const items = getSlashMenuItems(FEATURES, upload, intlFor('it'))
    const titles = items.map((i) => i.title)
    expect(titles).toEqual(
      expect.arrayContaining([
        'Testo',
        'Titolo 1',
        'Elenco puntato',
        'Elenco numerato',
        'Lista di controllo',
        'Citazione',
        'Separatore',
        'Blocco di codice',
        'Immagine',
        'Tabella',
        'YouTube',
      ])
    )
    expect(items.find((i) => i.title === 'Tabella')?.description).toBe('Inserisci una tabella')
  })

  it('are written in Dutch under a Dutch provider', () => {
    const items = getSlashMenuItems(FEATURES, upload, intlFor('nl'))
    expect(items.map((i) => i.title)).toEqual(
      expect.arrayContaining([
        'Tekst',
        'Kop 1',
        'Genummerde lijst',
        'Citaat',
        'Tabel',
        'Afbeelding',
      ])
    )
  })

  it('keep their English aliases, so "/h1" or "/table" still find the item', () => {
    const items = getSlashMenuItems(FEATURES, upload, intlFor('it'))
    expect(items.find((i) => i.title === 'Titolo 1')?.aliases).toContain('h1')
    expect(items.find((i) => i.title === 'Tabella')?.aliases).toContain('table')
  })

  it('stay in English when nothing translates them', () => {
    const items = getSlashMenuItems(
      FEATURES,
      upload,
      createIntl({ locale: 'en', onError: () => {} })
    )
    expect(items.map((i) => i.title)).toEqual(
      expect.arrayContaining(['Text', 'Heading 1', 'Bullet List', 'Table'])
    )
  })

  it('buildExtensions builds the slash menu in the language it is given', () => {
    const exts = buildExtensions(FEATURES, {
      placeholder: 'x',
      onImageUpload: upload,
      intl: intlFor('nl'),
    })
    expect(exts.some((e) => e.name === 'slashCommands')).toBe(true)
  })
})

describe('editor placeholder', () => {
  it('defaults to a translated sentence', () => {
    const { container } = render(
      <IntlProvider locale="it" messages={it_} defaultLocale="en">
        <RichTextEditor
          value=""
          onChange={() => {}}
          features={{ ...FEATURES, bubbleMenu: false }}
        />
      </IntlProvider>
    )
    const placeholder = container.querySelector('[data-placeholder]')
    expect(placeholder?.getAttribute('data-placeholder')).toBe('Scrivi qualcosa...')
  })

  it('defaults to English without a provider', () => {
    const { container } = render(
      <RichTextEditor value="" onChange={() => {}} features={{ bubbleMenu: false }} />
    )
    expect(container.querySelector('[data-placeholder]')?.getAttribute('data-placeholder')).toBe(
      'Write something...'
    )
  })

  it('keeps the placeholder the caller gives', () => {
    const { container } = render(
      <IntlProvider locale="it" messages={it_} defaultLocale="en">
        <RichTextEditor
          value=""
          onChange={() => {}}
          placeholder="Descrivere l'idea"
          features={{ bubbleMenu: false }}
        />
      </IntlProvider>
    )
    expect(container.querySelector('[data-placeholder]')?.getAttribute('data-placeholder')).toBe(
      "Descrivere l'idea"
    )
  })
})
