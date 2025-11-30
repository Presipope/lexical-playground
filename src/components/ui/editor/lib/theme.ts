import type { EditorThemeClasses } from 'lexical'

/**
 * Editor theme using Tailwind CSS classes
 * This theme maps Lexical node types to Tailwind utility classes
 */
export const editorTheme: EditorThemeClasses = {
  // Paragraph
  paragraph: 'm-0 relative',

  // Headings
  heading: {
    h1: 'text-2xl text-foreground font-normal m-0',
    h2: 'text-sm text-muted-foreground font-bold m-0 uppercase',
    h3: 'text-xs m-0 uppercase',
    h4: 'text-xs m-0',
    h5: 'text-xs m-0',
    h6: 'text-xs m-0',
  },

  // Quote
  quote: 'm-0 ml-5 mb-2.5 text-sm text-muted-foreground border-l-4 border-border pl-4',

  // Text formatting
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
    subscript: 'text-[0.8em] align-sub',
    superscript: 'text-[0.8em] align-super',
    code: 'bg-muted px-1 font-mono text-[94%]',
    highlight: 'editor-text-highlight',
    lowercase: 'lowercase',
    uppercase: 'uppercase',
    capitalize: 'capitalize',
  },

  // Links
  link: 'text-primary no-underline hover:underline cursor-pointer',

  // Hashtags
  hashtag: 'editor-hashtag',

  // Code blocks
  code: 'editor-code-block',
  codeHighlight: {
    atrule: 'text-[#07a]',
    attr: 'text-[#07a]',
    boolean: 'text-[#905]',
    builtin: 'text-[#690]',
    cdata: 'text-slate-500',
    char: 'text-[#690]',
    class: 'text-[#dd4a68]',
    'class-name': 'text-[#dd4a68]',
    comment: 'text-slate-500',
    constant: 'text-[#905]',
    deleted: 'editor-token-deleted',
    doctype: 'text-slate-500',
    entity: 'text-[#9a6e3a]',
    function: 'text-[#dd4a68]',
    important: 'text-[#e90]',
    inserted: 'editor-token-inserted',
    keyword: 'text-[#07a]',
    namespace: 'text-[#e90]',
    number: 'text-[#905]',
    operator: 'text-[#9a6e3a]',
    prolog: 'text-slate-500',
    property: 'text-[#905]',
    punctuation: 'text-[#999]',
    regex: 'text-[#e90]',
    selector: 'text-[#690]',
    string: 'text-[#690]',
    symbol: 'text-[#905]',
    tag: 'text-[#905]',
    unchanged: 'editor-token-unchanged',
    url: 'text-[#9a6e3a]',
    variable: 'text-[#e90]',
  },

  // Lists
  list: {
    ul: 'p-0 m-0 list-outside',
    ol: 'p-0 m-0 list-outside',
    olDepth: [
      'p-0 m-0 list-outside list-decimal',
      'p-0 m-0 list-outside list-[upper-alpha]',
      'p-0 m-0 list-outside list-[lower-alpha]',
      'p-0 m-0 list-outside list-[upper-roman]',
      'p-0 m-0 list-outside list-[lower-roman]',
    ],
    listitem: 'mx-8',
    listitemChecked: 'editor-list-item-checked',
    listitemUnchecked: 'editor-list-item-unchecked',
    nested: {
      listitem: 'list-none before:hidden after:hidden',
    },
    checklist: 'editor-checklist',
  },

  // Tables
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableCellHeader: 'editor-table-cell-header',
  tableCellSelected: 'editor-table-cell-selected',
  tableSelected: 'outline-2 outline-primary outline',
  tableSelection: '[&_*::selection]:bg-transparent',
  tableScrollableWrapper: 'overflow-x-auto mx-0 my-0 mr-6 mb-8',
  tableAddColumns: 'editor-table-add-columns',
  tableAddRows: 'editor-table-add-rows',
  tableCellActionButton: 'editor-table-cell-action-button',
  tableCellActionButtonContainer: 'editor-table-cell-action-button-container',
  tableCellResizer: 'editor-table-cell-resizer',
  tableAlignment: {
    center: 'mx-auto',
    right: 'ml-auto',
  },
  tableFrozenColumn: 'editor-table-frozen-column',
  tableFrozenRow: 'editor-table-frozen-row',
  tableRowStriping: 'editor-table-row-striping',

  // Horizontal rule
  hr: 'editor-hr',
  hrSelected: 'editor-hr-selected',

  // Layout
  layoutContainer: 'grid gap-2.5 my-2.5',
  layoutItem: 'border border-dashed border-border p-2 px-4 min-w-0 max-w-full',

  // Indentation
  indent: 'editor-indent',

  // Block cursor
  blockCursor: 'editor-block-cursor',

  // Autocomplete
  autocomplete: 'text-muted-foreground',

  // Character limit
  characterLimit: 'inline bg-destructive/20',

  // Embed blocks
  embedBlock: {
    base: 'select-none',
    focus: 'outline-2 outline-primary outline',
  },

  // Mark (annotations)
  mark: 'editor-mark',
  markOverlap: 'editor-mark-overlap',

  // Special text
  specialText: 'bg-yellow-300 font-bold',

  // Tab node
  tab: 'editor-tab-node',

  // Image (if needed later)
  image: 'editor-image',
}

export default editorTheme
