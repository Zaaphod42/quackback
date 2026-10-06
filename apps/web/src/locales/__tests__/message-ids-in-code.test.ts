import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import en from '../en.json'

/**
 * Every message id the code asks react-intl for must exist in en.json.
 *
 * Without this, a component that ships `{ id: 'portal.x', defaultMessage: '...' }`
 * and no catalog entry works in English, shows English in every other language
 * and fails no test: that is how 73 messages (the support chat, the private
 * portal screens, comment editing...) went untranslated. The scan reads the
 * source with the TypeScript parser, so line breaks and nested calls are no
 * problem. It finds:
 *
 *  - `<FormattedMessage id="..." defaultMessage="..." />`;
 *  - any object literal with an `id` (or `messageId`) string and, usually, a
 *    `defaultMessage`: `intl.formatMessage({...})`, descriptors kept in constants;
 *  - template-literal ids (`portal.x.${y}`), whose fixed part must match keys.
 *
 * The English catalog must also say what the code says: when both hold a text
 * for the same id they are equal, which is what `npm run intl:extract` yields.
 */

const SRC = fileURLToPath(new URL('../../', import.meta.url))
const EN = en as Record<string, string>

// Message ids start with one of the first segments of the English keys
// (`widget`, `portal`, `ui`); other objects with an `id` are not messages.
const PREFIXES = new Set(Object.keys(EN).map((key) => key.split('.')[0]))
const looksLikeMessageId = (id: string) => PREFIXES.has(id.split('.')[0]) && id.includes('.')

// Pre-existing differences between the code and en.json, kept as they are: the
// catalog is the text actually shown in English. Do not add to this list.
const KNOWN_WORDING_DRIFT = new Set([
  'portal.commentThread.teamBadge',
  'portal.feedback.header.detailsPlaceholder',
  'portal.postDetail.edit.detailsPlaceholder',
])

interface Usage {
  id: string
  defaultMessage?: string
  where: string
}

function sourceFiles(dir: string): string[] {
  const files: string[] = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '__tests__' || name === 'locales') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path))
    else if (/\.tsx?$/.test(name) && !/\.d\.ts$/.test(name) && !/\.test\./.test(name))
      files.push(path)
  }
  return files
}

function staticText(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isParenthesizedExpression(node)) return staticText(node.expression)
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticText(node.left)
    const right = staticText(node.right)
    if (left !== undefined && right !== undefined) return left + right
  }
  return undefined
}

function collect(): { usages: Usage[]; templates: Usage[] } {
  const usages: Usage[] = []
  const templates: Usage[] = []
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8')
    const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind)
    const where = (node: ts.Node) =>
      `${relative(SRC, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`

    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node)) {
        let idNode: ts.Expression | undefined
        let defaultMessage: string | undefined
        for (const prop of node.properties) {
          if (!ts.isPropertyAssignment(prop)) continue
          if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) continue
          if (prop.name.text === 'id' || prop.name.text === 'messageId') idNode = prop.initializer
          if (prop.name.text === 'defaultMessage') defaultMessage = staticText(prop.initializer)
        }
        const id = staticText(idNode)
        if (id !== undefined && looksLikeMessageId(id)) {
          usages.push({ id, defaultMessage, where: where(node) })
        } else if (idNode && ts.isTemplateExpression(idNode) && defaultMessageSeen(node)) {
          templates.push({ id: idNode.head.text, where: where(node) })
        }
      }
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        if (node.tagName.getText() === 'FormattedMessage') {
          let id: string | undefined
          let defaultMessage: string | undefined
          for (const attr of node.attributes.properties) {
            if (!ts.isJsxAttribute(attr) || !ts.isIdentifier(attr.name) || !attr.initializer)
              continue
            const value = ts.isStringLiteral(attr.initializer)
              ? attr.initializer.text
              : ts.isJsxExpression(attr.initializer)
                ? staticText(attr.initializer.expression)
                : undefined
            if (attr.name.text === 'id') id = value
            if (attr.name.text === 'defaultMessage') defaultMessage = value
          }
          if (id !== undefined) usages.push({ id, defaultMessage, where: where(node) })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return { usages, templates }
}

// A template id only counts as a message id when its object also carries a
// `defaultMessage` (an event id such as `evt_${...}` has none).
function defaultMessageSeen(node: ts.ObjectLiteralExpression): boolean {
  return node.properties.some(
    (prop) =>
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === 'defaultMessage'
  )
}

const { usages, templates } = collect()

describe('message ids used in the code', () => {
  it('finds the messages (the scan itself is not broken)', () => {
    expect(usages.length).toBeGreaterThan(400)
    // One id of each kind: a component, an object descriptor, a JSX element.
    const ids = new Set(usages.map((u) => u.id))
    expect(ids.has('portal.errorPage.technicalDetails')).toBe(true)
    expect(ids.has('portal.header.nav.guides')).toBe(true)
    expect(ids.has('widget.chat.send')).toBe(true)
  })

  it('all exist in en.json', () => {
    const missing = usages
      .filter(({ id }) => !(id in EN))
      .map(({ id, defaultMessage, where }) => `${id} (${where}): ${defaultMessage ?? '?'}`)
    expect(
      missing,
      'Add these ids to en.json (and translate them in fr, de, es, it and nl): ' +
        'a message missing from the catalogs shows in English in every language.'
    ).toEqual([])
  })

  it('say in en.json what the code says (same defaultMessage)', () => {
    const drift = usages
      .filter(
        ({ id, defaultMessage }) =>
          defaultMessage !== undefined &&
          id in EN &&
          EN[id] !== defaultMessage &&
          !KNOWN_WORDING_DRIFT.has(id)
      )
      .map(
        ({ id, defaultMessage, where }) =>
          `${id} (${where}): code "${defaultMessage}" / en.json "${EN[id]}"`
      )
    expect(drift).toEqual([])
  })

  it('give every use of an id the same defaultMessage', () => {
    const byId = new Map<string, Set<string>>()
    for (const { id, defaultMessage } of usages) {
      if (defaultMessage === undefined) continue
      byId.set(id, (byId.get(id) ?? new Set()).add(defaultMessage))
    }
    const conflicting = [...byId].filter(([, texts]) => texts.size > 1).map(([id]) => id)
    expect(conflicting.filter((id) => !KNOWN_WORDING_DRIFT.has(id))).toEqual([])
  })

  it('build dynamic ids from a fixed part that matches catalog keys', () => {
    expect(templates.length).toBeGreaterThan(0)
    for (const { id, where } of templates) {
      expect(
        Object.keys(EN).some((key) => key.startsWith(id)),
        `${where}: no en.json key starts with "${id}"`
      ).toBe(true)
    }
  })
})
