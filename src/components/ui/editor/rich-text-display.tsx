'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Text format bit flags matching Lexical's format system
 */
const TEXT_FORMAT = {
  BOLD: 1,
  ITALIC: 2,
  STRIKETHROUGH: 4,
  UNDERLINE: 8,
  CODE: 16,
  SUBSCRIPT: 32,
  SUPERSCRIPT: 64,
  HIGHLIGHT: 128,
} as const

/**
 * Serialized node types from Lexical
 */
interface SerializedBaseNode {
  type: string
  version: number
}

interface SerializedTextNode extends SerializedBaseNode {
  type: 'text'
  text: string
  format: number
  style?: string
  mode?: 'normal' | 'token' | 'segmented'
  detail?: number
}

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

interface SerializedEditorState {
  root: SerializedRootNode
}

/**
 * Theme configuration for the display component
 */
export interface DisplayTheme {
  // Container
  root?: string
  // Block elements
  paragraph?: string
  heading?: {
    h1?: string
    h2?: string
    h3?: string
    h4?: string
    h5?: string
    h6?: string
  }
  quote?: string
  // Text formatting
  text?: {
    bold?: string
    italic?: string
    underline?: string
    strikethrough?: string
    code?: string
    subscript?: string
    superscript?: string
    highlight?: string
  }
  // Link
  link?: string
  // Hashtag
  hashtag?: string
  // Code block
  code?: string
  codeHighlight?: Record<string, string>
  // Lists
  list?: {
    ul?: string
    ol?: string
    listitem?: string
    checklist?: string
    listitemChecked?: string
    listitemUnchecked?: string
  }
  // Table
  table?: string
  tableRow?: string
  tableCell?: string
  tableCellHeader?: string
  // Horizontal rule
  hr?: string
  // Layout
  layoutContainer?: string
  layoutItem?: string
  // Collapsible
  collapsibleContainer?: string
  collapsibleTitle?: string
  collapsibleContent?: string
  // Mention
  mention?: string
}

/**
 * Default theme using Tailwind classes
 */
export const defaultDisplayTheme: DisplayTheme = {
  root: 'rich-text-display',
  paragraph: 'm-0 mb-2 last:mb-0',
  heading: {
    h1: 'text-2xl font-bold m-0 mb-2',
    h2: 'text-xl font-bold m-0 mb-2',
    h3: 'text-lg font-semibold m-0 mb-2',
    h4: 'text-base font-semibold m-0 mb-2',
    h5: 'text-sm font-semibold m-0 mb-2',
    h6: 'text-xs font-semibold m-0 mb-2',
  },
  quote: 'border-l-4 border-border pl-4 my-2 text-muted-foreground italic',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1 py-0.5 rounded font-mono text-sm',
    subscript: 'text-[0.8em] align-sub',
    superscript: 'text-[0.8em] align-super',
    highlight: 'bg-yellow-200 dark:bg-yellow-900',
  },
  link: 'text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer',
  hashtag: 'text-blue-600 dark:text-blue-400',
  code: 'block bg-muted p-4 rounded-md overflow-x-auto font-mono text-sm my-2',
  codeHighlight: {
    atrule: 'text-[#07a]',
    attr: 'text-[#07a]',
    boolean: 'text-[#905]',
    builtin: 'text-[#690]',
    cdata: 'text-slate-500',
    char: 'text-[#690]',
    comment: 'text-slate-500',
    constant: 'text-[#905]',
    function: 'text-[#dd4a68]',
    keyword: 'text-[#07a]',
    number: 'text-[#905]',
    operator: 'text-[#9a6e3a]',
    property: 'text-[#905]',
    punctuation: 'text-[#999]',
    regex: 'text-[#e90]',
    selector: 'text-[#690]',
    string: 'text-[#690]',
    symbol: 'text-[#905]',
    tag: 'text-[#905]',
    variable: 'text-[#e90]',
  },
  list: {
    ul: 'list-disc pl-6 my-2',
    ol: 'list-decimal pl-6 my-2',
    listitem: 'my-1',
    checklist: 'list-none pl-0',
    listitemChecked: 'flex items-start gap-2 my-1 line-through text-muted-foreground',
    listitemUnchecked: 'flex items-start gap-2 my-1',
  },
  table: 'border-collapse w-full my-2',
  tableRow: '',
  tableCell: 'border border-border p-2 text-left align-top',
  tableCellHeader: 'border border-border p-2 text-left align-top font-bold bg-muted',
  hr: 'border-t border-border my-4',
  layoutContainer: 'grid gap-4 my-2',
  layoutItem: 'min-w-0',
  collapsibleContainer: 'border border-border rounded-md my-2',
  collapsibleTitle: 'cursor-pointer p-3 font-semibold bg-muted/50 hover:bg-muted',
  collapsibleContent: 'p-3 border-t border-border',
  mention: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded',
}

// =============================================================================
// PROPS
// =============================================================================

export interface RichTextDisplayProps {
  /**
   * The serialized editor state to display.
   * Can be a JSON string or parsed object.
   */
  value: string | SerializedEditorState | null | undefined

  /**
   * Additional class name for the root container
   */
  className?: string

  /**
   * Theme configuration for styling nodes.
   * Merged with defaultDisplayTheme.
   */
  theme?: Partial<DisplayTheme>

  /**
   * Content to show when value is empty or null
   */
  placeholder?: React.ReactNode

  /**
   * Target attribute for links
   * @default '_blank' for external links
   */
  linkTarget?: '_blank' | '_self' | '_parent' | '_top'

  /**
   * Rel attribute for links.
   * Defaults to 'noopener noreferrer' when linkTarget is '_blank'
   */
  linkRel?: string

  /**
   * Custom click handler for links.
   * Return false to prevent default navigation.
   */
  onLinkClick?: (url: string, event: React.MouseEvent<HTMLAnchorElement>) => void | boolean

  /**
   * Maximum character length before truncation.
   * When set, content will be truncated and ellipsis shown.
   */
  maxLength?: number

  /**
   * Text or element to show when content is truncated
   * @default '...'
   */
  ellipsis?: React.ReactNode

  /**
   * Callback when truncated content should be expanded.
   * When provided, shows a clickable "show more" element.
   */
  onShowMore?: () => void

  /**
   * Custom "show more" text or element
   * @default 'Show more'
   */
  showMoreLabel?: React.ReactNode

  /**
   * Whether checklists are interactive (clickable)
   * @default false
   */
  checklistInteractive?: boolean

  /**
   * Callback when a checklist item is toggled
   */
  onChecklistChange?: (index: number, checked: boolean) => void

  /**
   * Custom node renderer for extending functionality.
   * Return null to use default rendering.
   */
  renderNode?: (node: SerializedNode, defaultRender: () => React.ReactNode) => React.ReactNode | null

  /**
   * Whether to render links as plain text (useful for security)
   * @default false
   */
  disableLinks?: boolean

  /**
   * Whether collapsible sections start expanded
   * @default true (uses saved state from value)
   */
  collapsibleDefaultOpen?: boolean

  /**
   * ID for the root element
   */
  id?: string

  /**
   * Test ID for testing
   */
  'data-testid'?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * RichTextDisplay renders serialized Lexical editor content as read-only HTML.
 *
 * This component is useful for displaying rich text content that was created
 * with the Editor component, such as displaying saved content from a database.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RichTextDisplay value={savedContent} />
 *
 * // With placeholder
 * <RichTextDisplay
 *   value={content}
 *   placeholder={<span className="text-muted-foreground">No content</span>}
 * />
 *
 * // With link handling
 * <RichTextDisplay
 *   value={content}
 *   linkTarget="_blank"
 *   onLinkClick={(url) => {
 *     analytics.track('link_click', { url })
 *   }}
 * />
 *
 * // With truncation
 * <RichTextDisplay
 *   value={longContent}
 *   maxLength={200}
 *   onShowMore={() => setExpanded(true)}
 * />
 * ```
 */
export function RichTextDisplay({
  value,
  className,
  theme: themeProp,
  placeholder,
  linkTarget,
  linkRel,
  onLinkClick,
  maxLength,
  ellipsis = '...',
  onShowMore,
  showMoreLabel = 'Show more',
  checklistInteractive = false,
  onChecklistChange,
  renderNode,
  disableLinks = false,
  collapsibleDefaultOpen,
  id,
  'data-testid': testId,
}: RichTextDisplayProps) {
  // Merge theme with defaults
  const theme = React.useMemo(() => {
    if (!themeProp) return defaultDisplayTheme
    return {
      ...defaultDisplayTheme,
      ...themeProp,
      heading: { ...defaultDisplayTheme.heading, ...themeProp.heading },
      text: { ...defaultDisplayTheme.text, ...themeProp.text },
      list: { ...defaultDisplayTheme.list, ...themeProp.list },
      codeHighlight: { ...defaultDisplayTheme.codeHighlight, ...themeProp.codeHighlight },
    }
  }, [themeProp])

  // Parse value if string
  const editorState = React.useMemo((): SerializedEditorState | null => {
    if (!value) return null
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        console.error('RichTextDisplay: Failed to parse value as JSON')
        return null
      }
    }
    return value
  }, [value])

  // Track character count for truncation
  const charCountRef = React.useRef(0)
  const isTruncatedRef = React.useRef(false)
  const checklistIndexRef = React.useRef(0)

  // Reset refs on each render
  charCountRef.current = 0
  isTruncatedRef.current = false
  checklistIndexRef.current = 0

  // Determine link rel attribute
  const getLinkRel = React.useCallback(
    (target?: string) => {
      if (linkRel) return linkRel
      const effectiveTarget = target || linkTarget
      if (effectiveTarget === '_blank') return 'noopener noreferrer'
      return undefined
    },
    [linkRel, linkTarget]
  )

  // Handle link click
  const handleLinkClick = React.useCallback(
    (url: string, event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disableLinks) {
        event.preventDefault()
        return
      }
      if (onLinkClick) {
        const result = onLinkClick(url, event)
        if (result === false) {
          event.preventDefault()
        }
      }
    },
    [disableLinks, onLinkClick]
  )

  // Get text format classes
  const getTextFormatClasses = React.useCallback(
    (format: number): string => {
      const classes: string[] = []
      if (format & TEXT_FORMAT.BOLD && theme.text?.bold) classes.push(theme.text.bold)
      if (format & TEXT_FORMAT.ITALIC && theme.text?.italic) classes.push(theme.text.italic)
      if (format & TEXT_FORMAT.UNDERLINE && theme.text?.underline) classes.push(theme.text.underline)
      if (format & TEXT_FORMAT.STRIKETHROUGH && theme.text?.strikethrough) classes.push(theme.text.strikethrough)
      if (format & TEXT_FORMAT.CODE && theme.text?.code) classes.push(theme.text.code)
      if (format & TEXT_FORMAT.SUBSCRIPT && theme.text?.subscript) classes.push(theme.text.subscript)
      if (format & TEXT_FORMAT.SUPERSCRIPT && theme.text?.superscript) classes.push(theme.text.superscript)
      if (format & TEXT_FORMAT.HIGHLIGHT && theme.text?.highlight) classes.push(theme.text.highlight)
      return classes.join(' ')
    },
    [theme]
  )

  // Get alignment style
  const getAlignmentStyle = React.useCallback((format?: string | number): React.CSSProperties => {
    if (!format) return {}
    const alignMap: Record<string, string> = {
      left: 'left',
      center: 'center',
      right: 'right',
      justify: 'justify',
      '': 'left',
      '1': 'left',
      '2': 'center',
      '3': 'right',
      '4': 'justify',
    }
    const textAlign = alignMap[String(format)] as React.CSSProperties['textAlign']
    return textAlign ? { textAlign } : {}
  }, [])

  // Get indent style
  const getIndentStyle = React.useCallback((indent?: number): React.CSSProperties => {
    if (!indent) return {}
    return { paddingLeft: `${indent * 2}rem` }
  }, [])

  // Render text with truncation support
  const renderText = React.useCallback(
    (text: string): string => {
      if (!maxLength || isTruncatedRef.current) {
        return isTruncatedRef.current ? '' : text
      }

      const remaining = maxLength - charCountRef.current
      if (remaining <= 0) {
        isTruncatedRef.current = true
        return ''
      }

      if (text.length <= remaining) {
        charCountRef.current += text.length
        return text
      }

      charCountRef.current = maxLength
      isTruncatedRef.current = true
      return text.slice(0, remaining)
    },
    [maxLength]
  )

  // Recursive node renderer
  const renderNodeContent = React.useCallback(
    (node: SerializedNode, key: string | number): React.ReactNode => {
      // Check truncation
      if (maxLength && isTruncatedRef.current) {
        return null
      }

      // Custom renderer override
      if (renderNode) {
        const custom = renderNode(node, () => renderNodeContent(node, key))
        if (custom !== null) return custom
      }

      // Handle different node types
      switch (node.type) {
        case 'root': {
          const rootNode = node as SerializedRootNode
          return (
            <>
              {rootNode.children.map((child, i) => renderNodeContent(child, i))}
            </>
          )
        }

        case 'text': {
          const textNode = node as SerializedTextNode
          const text = renderText(textNode.text)
          if (!text) return null

          const formatClasses = getTextFormatClasses(textNode.format || 0)
          const style: React.CSSProperties = textNode.style
            ? Object.fromEntries(
                textNode.style.split(';').filter(Boolean).map((s) => {
                  const [prop, val] = s.split(':').map((x) => x.trim())
                  // Convert CSS property to camelCase
                  const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
                  return [camelProp, val]
                })
              )
            : {}

          if (formatClasses || Object.keys(style).length > 0) {
            return (
              <span key={key} className={formatClasses || undefined} style={style}>
                {text}
              </span>
            )
          }
          return text
        }

        case 'paragraph': {
          const paragraphNode = node as SerializedParagraphNode
          return (
            <p
              key={key}
              className={theme.paragraph}
              style={{
                ...getAlignmentStyle(paragraphNode.format),
                ...getIndentStyle(paragraphNode.indent),
              }}
            >
              {paragraphNode.children.length === 0 ? (
                <br />
              ) : (
                paragraphNode.children.map((child, i) => renderNodeContent(child, i))
              )}
            </p>
          )
        }

        case 'heading': {
          const headingNode = node as SerializedHeadingNode
          const Tag = headingNode.tag
          const headingClass = theme.heading?.[headingNode.tag]
          return (
            <Tag
              key={key}
              className={headingClass}
              style={{
                ...getAlignmentStyle(headingNode.format),
                ...getIndentStyle(headingNode.indent),
              }}
            >
              {headingNode.children.map((child, i) => renderNodeContent(child, i))}
            </Tag>
          )
        }

        case 'quote': {
          const quoteNode = node as SerializedQuoteNode
          return (
            <blockquote
              key={key}
              className={theme.quote}
              style={getIndentStyle(quoteNode.indent)}
            >
              {quoteNode.children.map((child, i) => renderNodeContent(child, i))}
            </blockquote>
          )
        }

        case 'list': {
          const listNode = node as SerializedListNode
          const isChecklist = listNode.listType === 'check'
          const Tag = listNode.tag === 'ol' ? 'ol' : 'ul'
          const listClass = isChecklist
            ? theme.list?.checklist
            : listNode.tag === 'ol'
            ? theme.list?.ol
            : theme.list?.ul

          return (
            <Tag
              key={key}
              className={listClass}
              start={listNode.start}
            >
              {listNode.children.map((child, i) => renderNodeContent(child, i))}
            </Tag>
          )
        }

        case 'listitem': {
          const listItemNode = node as SerializedListItemNode
          const isChecklist = listItemNode.checked !== undefined

          if (isChecklist) {
            const checklistIndex = checklistIndexRef.current++
            const isChecked = listItemNode.checked === true
            const itemClass = isChecked
              ? theme.list?.listitemChecked
              : theme.list?.listitemUnchecked

            return (
              <li key={key} className={itemClass}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly={!checklistInteractive}
                  disabled={!checklistInteractive}
                  onChange={
                    checklistInteractive && onChecklistChange
                      ? () => onChecklistChange(checklistIndex, !isChecked)
                      : undefined
                  }
                  className="mt-0.5 cursor-pointer disabled:cursor-default"
                />
                <span>
                  {listItemNode.children.map((child, i) => renderNodeContent(child, i))}
                </span>
              </li>
            )
          }

          return (
            <li
              key={key}
              className={theme.list?.listitem}
              value={listItemNode.value}
            >
              {listItemNode.children.map((child, i) => renderNodeContent(child, i))}
            </li>
          )
        }

        case 'link':
        case 'autolink': {
          const linkNode = node as SerializedLinkNode

          if (disableLinks) {
            return (
              <span key={key} className={theme.link}>
                {linkNode.children.map((child, i) => renderNodeContent(child, i))}
              </span>
            )
          }

          return (
            <a
              key={key}
              href={linkNode.url}
              title={linkNode.title}
              target={linkNode.target || linkTarget}
              rel={getLinkRel(linkNode.target)}
              className={theme.link}
              onClick={(e) => handleLinkClick(linkNode.url, e)}
            >
              {linkNode.children.map((child, i) => renderNodeContent(child, i))}
            </a>
          )
        }

        case 'code': {
          const codeNode = node as SerializedCodeNode
          return (
            <pre key={key} className={theme.code} data-language={codeNode.language}>
              <code>
                {codeNode.children.map((child, i) => renderNodeContent(child, i))}
              </code>
            </pre>
          )
        }

        case 'code-highlight': {
          const highlightNode = node as SerializedCodeHighlightNode
          const text = renderText(highlightNode.text)
          if (!text) return null

          const highlightClass = highlightNode.highlightType
            ? theme.codeHighlight?.[highlightNode.highlightType]
            : undefined

          return (
            <span key={key} className={highlightClass}>
              {text}
            </span>
          )
        }

        case 'table': {
          const tableNode = node as SerializedTableNode
          return (
            <table key={key} className={theme.table}>
              <tbody>
                {tableNode.children.map((child, i) => renderNodeContent(child, i))}
              </tbody>
            </table>
          )
        }

        case 'tablerow': {
          const rowNode = node as SerializedTableRowNode
          return (
            <tr key={key} className={theme.tableRow}>
              {rowNode.children.map((child, i) => renderNodeContent(child, i))}
            </tr>
          )
        }

        case 'tablecell': {
          const cellNode = node as SerializedTableCellNode
          const isHeader = (cellNode.headerState ?? 0) > 0
          const Tag = isHeader ? 'th' : 'td'
          const cellClass = isHeader ? theme.tableCellHeader : theme.tableCell

          return (
            <Tag
              key={key}
              className={cellClass}
              colSpan={cellNode.colSpan}
              rowSpan={cellNode.rowSpan}
              style={cellNode.backgroundColor ? { backgroundColor: cellNode.backgroundColor } : undefined}
            >
              {cellNode.children.map((child, i) => renderNodeContent(child, i))}
            </Tag>
          )
        }

        case 'horizontalrule': {
          return <hr key={key} className={theme.hr} />
        }

        case 'collapsible-container': {
          const containerNode = node as SerializedCollapsibleContainerNode
          const isOpen = collapsibleDefaultOpen !== undefined
            ? collapsibleDefaultOpen
            : containerNode.open !== false

          return (
            <details key={key} className={theme.collapsibleContainer} open={isOpen}>
              {containerNode.children.map((child, i) => renderNodeContent(child, i))}
            </details>
          )
        }

        case 'collapsible-title': {
          const titleNode = node as SerializedCollapsibleTitleNode
          return (
            <summary key={key} className={theme.collapsibleTitle}>
              {titleNode.children.map((child, i) => renderNodeContent(child, i))}
            </summary>
          )
        }

        case 'collapsible-content': {
          const contentNode = node as SerializedCollapsibleContentNode
          return (
            <div key={key} className={theme.collapsibleContent}>
              {contentNode.children.map((child, i) => renderNodeContent(child, i))}
            </div>
          )
        }

        case 'layout-container': {
          const layoutNode = node as SerializedLayoutContainerNode
          return (
            <div
              key={key}
              className={theme.layoutContainer}
              style={{
                gridTemplateColumns: layoutNode.templateColumns || '1fr 1fr',
              }}
            >
              {layoutNode.children.map((child, i) => renderNodeContent(child, i))}
            </div>
          )
        }

        case 'layout-item': {
          const layoutItemNode = node as SerializedLayoutItemNode
          return (
            <div key={key} className={theme.layoutItem}>
              {layoutItemNode.children.map((child, i) => renderNodeContent(child, i))}
            </div>
          )
        }

        case 'mention': {
          const mentionNode = node as SerializedMentionNode
          const text = renderText(mentionNode.mentionName || mentionNode.text)
          if (!text) return null

          return (
            <span key={key} className={theme.mention}>
              @{text}
            </span>
          )
        }

        case 'hashtag': {
          const hashtagNode = node as SerializedHashtagNode
          const text = renderText(hashtagNode.text)
          if (!text) return null

          return (
            <span key={key} className={theme.hashtag}>
              {text}
            </span>
          )
        }

        case 'linebreak': {
          return <br key={key} />
        }

        case 'tab': {
          return <span key={key}>{'\t'}</span>
        }

        default: {
          // Try to render as a generic element with children
          const elementNode = node as SerializedElementNode
          if ('children' in elementNode && Array.isArray(elementNode.children)) {
            return (
              <React.Fragment key={key}>
                {elementNode.children.map((child, i) => renderNodeContent(child, i))}
              </React.Fragment>
            )
          }
          // Unknown node type, render nothing
          console.warn(`RichTextDisplay: Unknown node type "${node.type}"`)
          return null
        }
      }
    },
    [
      theme,
      maxLength,
      renderNode,
      renderText,
      getTextFormatClasses,
      getAlignmentStyle,
      getIndentStyle,
      disableLinks,
      linkTarget,
      getLinkRel,
      handleLinkClick,
      checklistInteractive,
      onChecklistChange,
      collapsibleDefaultOpen,
    ]
  )

  // Handle empty/null value
  if (!editorState || !editorState.root) {
    if (placeholder) {
      return (
        <div
          id={id}
          data-testid={testId}
          className={cn(theme.root, className)}
        >
          {placeholder}
        </div>
      )
    }
    return null
  }

  // Render content
  const content = renderNodeContent(editorState.root, 'root')
  const showTruncationIndicator = maxLength && isTruncatedRef.current

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(theme.root, className)}
    >
      {content}
      {showTruncationIndicator && (
        <>
          {ellipsis}
          {onShowMore && (
            <button
              type="button"
              onClick={onShowMore}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
            >
              {showMoreLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default RichTextDisplay
