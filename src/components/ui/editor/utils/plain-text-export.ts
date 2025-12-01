/**
 * Plain Text Export Utility
 *
 * Converts serialized Lexical editor state to plain text format.
 * This utility produces ASCII-only output suitable for display in any
 * plain text environment (Notepad, terminal, etc.).
 *
 * Features:
 * - Preserves document structure with appropriate spacing
 * - Converts tables to ASCII table format
 * - Handles lists, quotes, code blocks, and other elements
 * - Supports collapsible sections and layouts
 * - Pure function with no side effects
 *
 * @example
 * ```ts
 * import { generatePlainText } from '@/components/ui/editor'
 *
 * // From editor state JSON
 * const plainText = generatePlainText(editorState.toJSON())
 *
 * // From stored JSON string
 * const plainText = generatePlainText(savedJsonString)
 * ```
 *
 * @module plain-text-export
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base node interface matching Lexical's serialization format
 */
interface SerializedBaseNode {
  type: string
  version: number
}

/**
 * Text node with formatting information
 */
interface SerializedTextNode extends SerializedBaseNode {
  type: 'text'
  text: string
  format: number
  style?: string
  mode?: 'normal' | 'token' | 'segmented'
  detail?: number
}

/**
 * Element node with children
 */
interface SerializedElementNode extends SerializedBaseNode {
  children: SerializedNode[]
  direction?: 'ltr' | 'rtl' | null
  format?: string | number
  indent?: number
}

interface SerializedParagraphNode extends SerializedElementNode {
  type: 'paragraph'
  textFormat?: number
  textStyle?: string
}

interface SerializedHeadingNode extends SerializedElementNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

interface SerializedQuoteNode extends SerializedElementNode {
  type: 'quote'
}

interface SerializedListNode extends SerializedElementNode {
  type: 'list'
  listType: 'bullet' | 'number' | 'check'
  start?: number
  tag: 'ul' | 'ol'
}

interface SerializedListItemNode extends SerializedElementNode {
  type: 'listitem'
  checked?: boolean
  value?: number
}

interface SerializedLinkNode extends SerializedElementNode {
  type: 'link' | 'autolink'
  url: string
  title?: string
  target?: string
  rel?: string
}

interface SerializedCodeNode extends SerializedElementNode {
  type: 'code'
  language?: string
}

interface SerializedCodeHighlightNode extends Omit<SerializedTextNode, 'type'> {
  type: 'code-highlight'
  highlightType?: string
}

interface SerializedTableNode extends SerializedElementNode {
  type: 'table'
}

interface SerializedTableRowNode extends SerializedElementNode {
  type: 'tablerow'
}

interface SerializedTableCellNode extends SerializedElementNode {
  type: 'tablecell'
  colSpan?: number
  rowSpan?: number
  headerState?: number
  backgroundColor?: string
}

interface SerializedHorizontalRuleNode extends SerializedBaseNode {
  type: 'horizontalrule'
}

interface SerializedCollapsibleContainerNode extends SerializedElementNode {
  type: 'collapsible-container'
  open?: boolean
}

interface SerializedCollapsibleTitleNode extends SerializedElementNode {
  type: 'collapsible-title'
}

interface SerializedCollapsibleContentNode extends SerializedElementNode {
  type: 'collapsible-content'
}

interface SerializedLayoutContainerNode extends SerializedElementNode {
  type: 'layout-container'
  templateColumns?: string
}

interface SerializedLayoutItemNode extends SerializedElementNode {
  type: 'layout-item'
}

interface SerializedMentionNode extends Omit<SerializedTextNode, 'type'> {
  type: 'mention'
  mentionName: string
}

interface SerializedHashtagNode extends Omit<SerializedTextNode, 'type'> {
  type: 'hashtag'
}

interface SerializedRootNode extends SerializedElementNode {
  type: 'root'
}

type SerializedNode =
  | SerializedTextNode
  | SerializedParagraphNode
  | SerializedHeadingNode
  | SerializedQuoteNode
  | SerializedListNode
  | SerializedListItemNode
  | SerializedLinkNode
  | SerializedCodeNode
  | SerializedCodeHighlightNode
  | SerializedTableNode
  | SerializedTableRowNode
  | SerializedTableCellNode
  | SerializedHorizontalRuleNode
  | SerializedCollapsibleContainerNode
  | SerializedCollapsibleTitleNode
  | SerializedCollapsibleContentNode
  | SerializedLayoutContainerNode
  | SerializedLayoutItemNode
  | SerializedMentionNode
  | SerializedHashtagNode
  | SerializedRootNode
  | SerializedElementNode
  | SerializedBaseNode

/**
 * Serialized editor state from Lexical
 */
interface SerializedEditorState {
  root: SerializedRootNode
}

/**
 * Configuration options for plain text generation
 */
export interface PlainTextOptions {
  /**
   * Character(s) to use for line breaks
   * @default '\n'
   */
  lineBreak?: string

  /**
   * Number of spaces for each indent level
   * @default 2
   */
  indentSize?: number

  /**
   * Whether to include URLs inline with link text
   * Format: "link text (https://example.com)"
   * @default true
   */
  includeUrls?: boolean

  /**
   * Whether to show collapsible section indicators
   * Format: "[+] Title" or "[-] Title"
   * @default true
   */
  showCollapsibleIndicators?: boolean

  /**
   * Character to use for horizontal rules
   * @default '-'
   */
  horizontalRuleChar?: string

  /**
   * Width of horizontal rules
   * @default 40
   */
  horizontalRuleWidth?: number

  /**
   * Minimum width for table columns
   * @default 3
   */
  tableMinColumnWidth?: number

  /**
   * Maximum width for table columns (content will wrap)
   * @default 30
   */
  tableMaxColumnWidth?: number

  /**
   * Character to use for table column separators
   * @default '|'
   */
  tableColumnSeparator?: string

  /**
   * Character to use for table header underlines
   * @default '-'
   */
  tableHeaderUnderline?: string
}

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: Required<PlainTextOptions> = {
  lineBreak: '\n',
  indentSize: 2,
  includeUrls: true,
  showCollapsibleIndicators: true,
  horizontalRuleChar: '-',
  horizontalRuleWidth: 40,
  tableMinColumnWidth: 3,
  tableMaxColumnWidth: 30,
  tableColumnSeparator: '|',
  tableHeaderUnderline: '-',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates an indentation string
 */
function createIndent(level: number, size: number): string {
  return ' '.repeat(level * size)
}

/**
 * Pads a string to a specified width
 */
function padString(str: string, width: number): string {
  if (str.length >= width) return str
  return str + ' '.repeat(width - str.length)
}

/**
 * Wraps text to fit within a maximum width
 */
function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text]

  const lines: string[] = []
  let remaining = text

  while (remaining.length > maxWidth) {
    // Find a good break point
    let breakPoint = remaining.lastIndexOf(' ', maxWidth)
    if (breakPoint === -1 || breakPoint === 0) {
      breakPoint = maxWidth
    }

    lines.push(remaining.slice(0, breakPoint).trim())
    remaining = remaining.slice(breakPoint).trim()
  }

  if (remaining) {
    lines.push(remaining)
  }

  return lines
}

// =============================================================================
// NODE PROCESSORS
// =============================================================================

/**
 * Context passed during node processing
 */
interface ProcessContext {
  options: Required<PlainTextOptions>
  indent: number
  listCounters: number[]
  inCodeBlock: boolean
}

/**
 * Extracts plain text from a text node
 */
function processTextNode(node: SerializedTextNode): string {
  return node.text
}

/**
 * Processes a paragraph node
 */
function processParagraph(
  node: SerializedParagraphNode,
  ctx: ProcessContext
): string {
  const indent = createIndent(node.indent || 0, ctx.options.indentSize)
  const content = processChildren(node.children, ctx)
  return indent + content
}

/**
 * Processes a heading node
 */
function processHeading(
  node: SerializedHeadingNode,
  ctx: ProcessContext
): string {
  const content = processChildren(node.children, ctx)

  // Add underline for h1 and h2, prefix for others
  switch (node.tag) {
    case 'h1':
      return content + ctx.options.lineBreak + '='.repeat(content.length)
    case 'h2':
      return content + ctx.options.lineBreak + '-'.repeat(content.length)
    case 'h3':
      return '### ' + content
    case 'h4':
      return '#### ' + content
    case 'h5':
      return '##### ' + content
    case 'h6':
      return '###### ' + content
    default:
      return content
  }
}

/**
 * Processes a quote node
 */
function processQuote(node: SerializedQuoteNode, ctx: ProcessContext): string {
  const content = processChildren(node.children, ctx)
  // Prefix each line with >
  return content
    .split(ctx.options.lineBreak)
    .map((line) => '> ' + line)
    .join(ctx.options.lineBreak)
}

/**
 * Processes a list node
 */
function processList(node: SerializedListNode, ctx: ProcessContext): string {
  const items: string[] = []
  const startNumber = node.start || 1

  // Push a new counter for numbered lists
  if (node.listType === 'number') {
    ctx.listCounters.push(startNumber)
  }

  for (const child of node.children) {
    if (child.type === 'listitem') {
      items.push(processListItem(child as SerializedListItemNode, node, ctx))
    }
  }

  // Pop the counter
  if (node.listType === 'number') {
    ctx.listCounters.pop()
  }

  return items.join(ctx.options.lineBreak)
}

/**
 * Processes a list item node
 */
function processListItem(
  node: SerializedListItemNode,
  parent: SerializedListNode,
  ctx: ProcessContext
): string {
  const indent = createIndent(node.indent || 0, ctx.options.indentSize)
  const content = processChildren(node.children, ctx)

  let prefix: string
  switch (parent.listType) {
    case 'bullet':
      prefix = '- '
      break
    case 'number': {
      const counter = ctx.listCounters[ctx.listCounters.length - 1]++
      prefix = `${counter}. `
      break
    }
    case 'check':
      prefix = node.checked ? '[x] ' : '[ ] '
      break
    default:
      prefix = '- '
  }

  return indent + prefix + content
}

/**
 * Processes a link node
 */
function processLink(node: SerializedLinkNode, ctx: ProcessContext): string {
  const text = processChildren(node.children, ctx)

  if (ctx.options.includeUrls && node.url && node.url !== text) {
    return `${text} (${node.url})`
  }

  return text
}

/**
 * Processes a code block node
 */
function processCode(node: SerializedCodeNode, ctx: ProcessContext): string {
  const prevInCode = ctx.inCodeBlock
  ctx.inCodeBlock = true

  const content = processChildren(node.children, ctx)

  ctx.inCodeBlock = prevInCode

  const border = '```'
  const lang = node.language || ''

  return border + lang + ctx.options.lineBreak + content + ctx.options.lineBreak + border
}

/**
 * Processes a code highlight node (inside code blocks)
 */
function processCodeHighlight(node: SerializedCodeHighlightNode): string {
  return node.text
}

/**
 * Processes a table node into ASCII format
 */
function processTable(node: SerializedTableNode, ctx: ProcessContext): string {
  const rows: string[][] = []
  let headerRowIndex = -1

  // First pass: collect all cell contents and find header row
  for (let rowIdx = 0; rowIdx < node.children.length; rowIdx++) {
    const row = node.children[rowIdx]
    if (row.type !== 'tablerow') continue

    const tableRow = row as SerializedTableRowNode
    const cells: string[] = []
    let isHeaderRow = false

    for (const cell of tableRow.children) {
      if (cell.type !== 'tablecell') continue

      const tableCell = cell as SerializedTableCellNode
      const cellContent = processChildren(tableCell.children, ctx).trim()
      cells.push(cellContent)

      // Check if this is a header cell
      if ((tableCell.headerState ?? 0) > 0) {
        isHeaderRow = true
      }
    }

    if (isHeaderRow && headerRowIndex === -1) {
      headerRowIndex = rows.length
    }

    rows.push(cells)
  }

  if (rows.length === 0) return ''

  // Calculate column widths
  const columnCount = Math.max(...rows.map((r) => r.length))
  const columnWidths: number[] = []

  for (let col = 0; col < columnCount; col++) {
    let maxWidth = ctx.options.tableMinColumnWidth

    for (const row of rows) {
      const cellContent = row[col] || ''
      maxWidth = Math.max(maxWidth, Math.min(cellContent.length, ctx.options.tableMaxColumnWidth))
    }

    columnWidths.push(maxWidth)
  }

  // Build the table
  const lines: string[] = []
  const sep = ' ' + ctx.options.tableColumnSeparator + ' '

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    const cells: string[] = []

    for (let col = 0; col < columnCount; col++) {
      const content = row[col] || ''
      // Truncate if too long
      const truncated =
        content.length > columnWidths[col]
          ? content.slice(0, columnWidths[col] - 1) + '…'
          : content
      cells.push(padString(truncated, columnWidths[col]))
    }

    lines.push(cells.join(sep))

    // Add separator line after header row
    if (rowIdx === headerRowIndex) {
      const separatorCells = columnWidths.map((w) =>
        ctx.options.tableHeaderUnderline.repeat(w)
      )
      lines.push(separatorCells.join(sep))
    }
  }

  return lines.join(ctx.options.lineBreak)
}

/**
 * Processes a horizontal rule node
 */
function processHorizontalRule(ctx: ProcessContext): string {
  return ctx.options.horizontalRuleChar.repeat(ctx.options.horizontalRuleWidth)
}

/**
 * Processes a collapsible container node
 */
function processCollapsible(
  node: SerializedCollapsibleContainerNode,
  ctx: ProcessContext
): string {
  let title = ''
  let content = ''

  for (const child of node.children) {
    if (child.type === 'collapsible-title') {
      title = processChildren(
        (child as SerializedCollapsibleTitleNode).children,
        ctx
      )
    } else if (child.type === 'collapsible-content') {
      content = processChildren(
        (child as SerializedCollapsibleContentNode).children,
        ctx
      )
    }
  }

  if (ctx.options.showCollapsibleIndicators) {
    const indicator = node.open !== false ? '[-]' : '[+]'
    return (
      indicator +
      ' ' +
      title +
      ctx.options.lineBreak +
      createIndent(1, ctx.options.indentSize) +
      content.split(ctx.options.lineBreak).join(
        ctx.options.lineBreak + createIndent(1, ctx.options.indentSize)
      )
    )
  }

  return title + ctx.options.lineBreak + content
}

/**
 * Processes a layout container node
 */
function processLayout(
  node: SerializedLayoutContainerNode,
  ctx: ProcessContext
): string {
  // For plain text, we just render layout items sequentially with separators
  const items: string[] = []

  for (const child of node.children) {
    if (child.type === 'layout-item') {
      const content = processChildren(
        (child as SerializedLayoutItemNode).children,
        ctx
      )
      if (content.trim()) {
        items.push(content)
      }
    }
  }

  // Separate layout columns with a visual divider
  return items.join(
    ctx.options.lineBreak +
      ctx.options.lineBreak +
      '---' +
      ctx.options.lineBreak +
      ctx.options.lineBreak
  )
}

/**
 * Processes a mention node
 */
function processMention(node: SerializedMentionNode): string {
  return '@' + (node.mentionName || node.text)
}

/**
 * Processes a hashtag node
 */
function processHashtag(node: SerializedHashtagNode): string {
  return node.text
}

/**
 * Processes child nodes and joins them
 */
function processChildren(
  children: SerializedNode[],
  ctx: ProcessContext
): string {
  const parts: string[] = []

  for (const child of children) {
    const result = processNode(child, ctx)
    if (result !== null) {
      parts.push(result)
    }
  }

  return parts.join('')
}

/**
 * Processes a single node based on its type
 */
function processNode(node: SerializedNode, ctx: ProcessContext): string | null {
  switch (node.type) {
    case 'root': {
      const rootNode = node as SerializedRootNode
      const blocks: string[] = []

      for (const child of rootNode.children) {
        const result = processNode(child, ctx)
        if (result !== null) {
          blocks.push(result)
        }
      }

      return blocks.join(ctx.options.lineBreak + ctx.options.lineBreak)
    }

    case 'text':
      return processTextNode(node as SerializedTextNode)

    case 'paragraph':
      return processParagraph(node as SerializedParagraphNode, ctx)

    case 'heading':
      return processHeading(node as SerializedHeadingNode, ctx)

    case 'quote':
      return processQuote(node as SerializedQuoteNode, ctx)

    case 'list':
      return processList(node as SerializedListNode, ctx)

    case 'listitem':
      // List items are handled by processList
      return null

    case 'link':
    case 'autolink':
      return processLink(node as SerializedLinkNode, ctx)

    case 'code':
      return processCode(node as SerializedCodeNode, ctx)

    case 'code-highlight':
      return processCodeHighlight(node as SerializedCodeHighlightNode)

    case 'table':
      return processTable(node as SerializedTableNode, ctx)

    case 'tablerow':
    case 'tablecell':
      // These are handled by processTable
      return null

    case 'horizontalrule':
      return processHorizontalRule(ctx)

    case 'collapsible-container':
      return processCollapsible(
        node as SerializedCollapsibleContainerNode,
        ctx
      )

    case 'collapsible-title':
    case 'collapsible-content':
      // These are handled by processCollapsible
      return null

    case 'layout-container':
      return processLayout(node as SerializedLayoutContainerNode, ctx)

    case 'layout-item':
      // Handled by processLayout
      return null

    case 'mention':
      return processMention(node as SerializedMentionNode)

    case 'hashtag':
      return processHashtag(node as SerializedHashtagNode)

    case 'linebreak':
      return ctx.options.lineBreak

    case 'tab':
      return '\t'

    default: {
      // Try to process as a generic element with children
      const elementNode = node as SerializedElementNode
      if ('children' in elementNode && Array.isArray(elementNode.children)) {
        return processChildren(elementNode.children, ctx)
      }
      return null
    }
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generates plain text from a serialized Lexical editor state.
 *
 * This function converts rich text content to ASCII-only plain text that
 * can be displayed in any text environment (Notepad, terminal, etc.).
 *
 * @param value - The serialized editor state (JSON string or object)
 * @param options - Configuration options for the output
 * @returns Plain text representation of the content
 *
 * @example
 * ```ts
 * // Basic usage
 * const plainText = generatePlainText(editorState)
 *
 * // With custom options
 * const plainText = generatePlainText(editorState, {
 *   includeUrls: false,
 *   tableMaxColumnWidth: 20,
 * })
 * ```
 */
export function generatePlainText(
  value: string | SerializedEditorState | null | undefined,
  options?: PlainTextOptions
): string {
  if (!value) return ''

  // Parse if string
  let editorState: SerializedEditorState

  if (typeof value === 'string') {
    try {
      editorState = JSON.parse(value)
    } catch {
      // If it's not valid JSON, return as-is
      return value
    }
  } else {
    editorState = value
  }

  // Validate structure
  if (!editorState.root || editorState.root.type !== 'root') {
    return ''
  }

  // Merge options with defaults
  const mergedOptions: Required<PlainTextOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  // Create processing context
  const ctx: ProcessContext = {
    options: mergedOptions,
    indent: 0,
    listCounters: [],
    inCodeBlock: false,
  }

  // Process the root node
  const result = processNode(editorState.root, ctx)

  return result || ''
}

/**
 * Type guard to check if a value is a valid serialized editor state
 */
export function isSerializedEditorState(
  value: unknown
): value is SerializedEditorState {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  if (!obj.root || typeof obj.root !== 'object') return false
  const root = obj.root as Record<string, unknown>
  return root.type === 'root' && Array.isArray(root.children)
}

/**
 * Extracts just the text content without any formatting or structure.
 * Similar to Lexical's $getRoot().getTextContent() but works on serialized state.
 *
 * @param value - The serialized editor state
 * @returns Raw text content
 */
export function extractTextContent(
  value: string | SerializedEditorState | null | undefined
): string {
  if (!value) return ''

  let editorState: SerializedEditorState

  if (typeof value === 'string') {
    try {
      editorState = JSON.parse(value)
    } catch {
      return value
    }
  } else {
    editorState = value
  }

  if (!editorState.root) return ''

  function extractFromNode(node: SerializedNode): string {
    if (node.type === 'text') {
      return (node as SerializedTextNode).text
    }

    if (node.type === 'code-highlight') {
      return (node as SerializedCodeHighlightNode).text
    }

    if (node.type === 'mention') {
      const mentionNode = node as SerializedMentionNode
      return '@' + (mentionNode.mentionName || mentionNode.text)
    }

    if (node.type === 'hashtag') {
      return (node as SerializedHashtagNode).text
    }

    if (node.type === 'linebreak') {
      return '\n'
    }

    if (node.type === 'tab') {
      return '\t'
    }

    const elementNode = node as SerializedElementNode
    if ('children' in elementNode && Array.isArray(elementNode.children)) {
      const texts = elementNode.children.map(extractFromNode)
      // Add newlines between block-level elements
      if (['paragraph', 'heading', 'quote', 'listitem', 'code'].includes(node.type)) {
        return texts.join('') + '\n'
      }
      return texts.join('')
    }

    return ''
  }

  return extractFromNode(editorState.root).trim()
}
