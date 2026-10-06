import { describe, it, expect } from 'vitest'
import { Route } from '../__root'

type Meta = Array<Record<string, string>>

function headMeta(acceptLanguageLocale?: string): Meta {
  const head = (Route as unknown as { options: { head: (ctx: unknown) => { meta: Meta } } }).options
    .head
  return head({ match: { context: { acceptLanguageLocale } } }).meta
}

const description = (meta: Meta) => meta.find((m) => m.name === 'description')?.content

describe('root head', () => {
  it('keeps the brand title, which is not translated', () => {
    expect(headMeta('it').find((m) => 'title' in m)?.title).toBe('Diafane')
  })

  it.each([
    ['en', 'Help and ideas for Diafane, the stained glass design software.'],
    ['fr', 'Aide et idées pour Diafane, le logiciel de conception de vitraux.'],
    ['it', 'Aiuto e idee per Diafane, il software per progettare vetrate.'],
    ['nl', 'Hulp en ideeën voor Diafane, de software voor glas-in-loodontwerp.'],
  ])('describes the page in %s', (locale, expected) => {
    expect(description(headMeta(locale))).toBe(expected)
  })

  it('reads English when the locale is unknown or has no translation', () => {
    expect(description(headMeta(undefined))).toContain('Help and ideas')
    expect(description(headMeta('zh-cn'))).toContain('Help and ideas')
  })
})
