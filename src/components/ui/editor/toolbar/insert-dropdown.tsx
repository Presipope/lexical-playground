'use client'

import { useCallback, useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { INSERT_TABLE_COMMAND } from '@lexical/table'
import {
  Plus,
  ChevronDown,
  SeparatorHorizontal,
  Table,
  Columns,
  FoldVertical,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSERT_COLLAPSIBLE_COMMAND } from '../plugins/collapsible-plugin'
import { INSERT_LAYOUT_COMMAND } from '../plugins/layout-plugin'

// Context for managing dropdown state
interface InsertDropdownContextValue {
  closeDropdown: () => void
  isEditable: boolean
}

const InsertDropdownContext = createContext<InsertDropdownContextValue | null>(null)

function useInsertDropdown() {
  const context = useContext(InsertDropdownContext)
  if (!context) {
    throw new Error('Insert items must be used within InsertDropdown')
  }
  return context
}

// ============================================================================
// INSERT DROPDOWN CONTAINER
// ============================================================================

export interface InsertDropdownProps {
  className?: string
  /**
   * Custom children to render in the dropdown.
   * If provided, replaces the default items.
   * Use InsertHorizontalRule, InsertTable, InsertColumns, InsertCollapsible,
   * or custom InsertItem components.
   */
  children?: ReactNode
  /**
   * Label for the dropdown button
   * @default "Insert"
   */
  label?: string
  /**
   * Whether to show the label text (icon is always shown)
   * @default true
   */
  showLabel?: boolean
}

export function InsertDropdown({
  className,
  children,
  label = 'Insert',
  showLabel = true,
}: InsertDropdownProps) {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable)
    })
  }, [editor])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
  }, [])

  const contextValue: InsertDropdownContextValue = {
    closeDropdown,
    isEditable,
  }

  // If no children provided, render default items
  const content = children ?? (
    <>
      <InsertHorizontalRule />
      <InsertTable />
      <InsertColumns />
      <InsertCollapsible />
    </>
  )

  return (
    <InsertDropdownContext.Provider value={contextValue}>
      <div className={cn('editor-dropdown', className)} ref={dropdownRef}>
        <button
          type="button"
          disabled={!isEditable}
          onClick={() => setIsOpen(!isOpen)}
          className="editor-dropdown-button"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Plus className="h-4 w-4" />
          {showLabel && <span className="text-sm">{label}</span>}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>

        {isOpen && (
          <div className="editor-dropdown-content mt-1 min-w-[180px]">
            {content}
          </div>
        )}
      </div>
    </InsertDropdownContext.Provider>
  )
}

// ============================================================================
// GENERIC INSERT ITEM
// ============================================================================

export interface InsertItemProps {
  /**
   * Icon component to display
   */
  icon: LucideIcon
  /**
   * Label text for the item
   */
  label: string
  /**
   * Click handler - called when item is clicked
   */
  onClick: () => void
  /**
   * Additional class name
   */
  className?: string
  /**
   * Whether to close the dropdown after clicking
   * @default true
   */
  closeOnClick?: boolean
}

/**
 * Generic insert item for creating custom dropdown options.
 *
 * @example
 * ```tsx
 * <InsertDropdown>
 *   <InsertItem
 *     icon={Image}
 *     label="Image"
 *     onClick={() => editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: '' })}
 *   />
 * </InsertDropdown>
 * ```
 */
export function InsertItem({
  icon: Icon,
  label,
  onClick,
  className,
  closeOnClick = true,
}: InsertItemProps) {
  const { closeDropdown, isEditable } = useInsertDropdown()

  const handleClick = useCallback(() => {
    onClick()
    if (closeOnClick) {
      closeDropdown()
    }
  }, [onClick, closeOnClick, closeDropdown])

  return (
    <button
      type="button"
      className={cn('editor-dropdown-item w-full', className)}
      onClick={handleClick}
      disabled={!isEditable}
    >
      <Icon className="h-4 w-4 mr-2" />
      <span>{label}</span>
    </button>
  )
}

// ============================================================================
// BUILT-IN INSERT ITEMS
// ============================================================================

export interface InsertHorizontalRuleProps {
  className?: string
}

export function InsertHorizontalRule({ className }: InsertHorizontalRuleProps) {
  const [editor] = useLexicalComposerContext()
  const { closeDropdown, isEditable } = useInsertDropdown()

  const onClick = useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
    closeDropdown()
  }, [editor, closeDropdown])

  return (
    <button
      type="button"
      className={cn('editor-dropdown-item w-full', className)}
      onClick={onClick}
      disabled={!isEditable}
    >
      <SeparatorHorizontal className="h-4 w-4 mr-2" />
      <span>Horizontal Rule</span>
    </button>
  )
}

export interface InsertTableProps {
  className?: string
  /**
   * Maximum rows for the table picker
   * @default 6
   */
  maxRows?: number
  /**
   * Maximum columns for the table picker
   * @default 6
   */
  maxCols?: number
}

export function InsertTable({ className, maxRows = 6, maxCols = 6 }: InsertTableProps) {
  const [editor] = useLexicalComposerContext()
  const { closeDropdown, isEditable } = useInsertDropdown()
  const [isExpanded, setIsExpanded] = useState(false)

  const insertTable = useCallback((rows: number, columns: number) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(columns) })
    closeDropdown()
    setIsExpanded(false)
  }, [editor, closeDropdown])

  return (
    <>
      <button
        type="button"
        className={cn('editor-dropdown-item w-full', className)}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={!isEditable}
      >
        <Table className="h-4 w-4 mr-2" />
        <span>Table</span>
      </button>
      {isExpanded && (
        <div className="px-2 py-2 border-t border-border">
          <TableSizePicker onSelect={insertTable} maxRows={maxRows} maxCols={maxCols} />
        </div>
      )}
    </>
  )
}

export interface InsertColumnsProps {
  className?: string
  /**
   * Custom layout templates
   */
  layouts?: Array<{ label: string; template: string; preview: string[] }>
}

const defaultLayouts = [
  { label: '2 columns (equal)', template: '1fr 1fr', preview: ['50%', '50%'] },
  { label: '3 columns (equal)', template: '1fr 1fr 1fr', preview: ['33%', '33%', '33%'] },
  { label: '2 columns (67/33)', template: '2fr 1fr', preview: ['67%', '33%'] },
  { label: '2 columns (33/67)', template: '1fr 2fr', preview: ['33%', '67%'] },
  { label: '3 columns (25/50/25)', template: '1fr 2fr 1fr', preview: ['25%', '50%', '25%'] },
]

export function InsertColumns({ className, layouts = defaultLayouts }: InsertColumnsProps) {
  const [editor] = useLexicalComposerContext()
  const { closeDropdown, isEditable } = useInsertDropdown()
  const [isExpanded, setIsExpanded] = useState(false)

  const insertLayout = useCallback((template: string) => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, template)
    closeDropdown()
    setIsExpanded(false)
  }, [editor, closeDropdown])

  return (
    <>
      <button
        type="button"
        className={cn('editor-dropdown-item w-full', className)}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={!isEditable}
      >
        <Columns className="h-4 w-4 mr-2" />
        <span>Columns Layout</span>
      </button>
      {isExpanded && (
        <div className="px-2 py-2 border-t border-border">
          <LayoutPicker layouts={layouts} onSelect={insertLayout} />
        </div>
      )}
    </>
  )
}

export interface InsertCollapsibleProps {
  className?: string
}

export function InsertCollapsible({ className }: InsertCollapsibleProps) {
  const [editor] = useLexicalComposerContext()
  const { closeDropdown, isEditable } = useInsertDropdown()

  const onClick = useCallback(() => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
    closeDropdown()
  }, [editor, closeDropdown])

  return (
    <button
      type="button"
      className={cn('editor-dropdown-item w-full', className)}
      onClick={onClick}
      disabled={!isEditable}
    >
      <FoldVertical className="h-4 w-4 mr-2" />
      <span>Collapsible</span>
    </button>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface TableSizePickerProps {
  onSelect: (rows: number, cols: number) => void
  maxRows?: number
  maxCols?: number
}

function TableSizePicker({ onSelect, maxRows = 6, maxCols = 6 }: TableSizePickerProps) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2 text-center">
        {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol}` : 'Select size'}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
        onMouseLeave={() => { setHoverRow(0); setHoverCol(0) }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, index) => {
          const row = Math.floor(index / maxCols) + 1
          const col = (index % maxCols) + 1
          const isHighlighted = row <= hoverRow && col <= hoverCol
          return (
            <button
              key={index}
              type="button"
              className={cn(
                'w-5 h-5 border rounded-theme-sm transition-colors',
                isHighlighted
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border hover:border-primary'
              )}
              onMouseEnter={() => { setHoverRow(row); setHoverCol(col) }}
              onClick={() => onSelect(row, col)}
            />
          )
        })}
      </div>
    </div>
  )
}

interface LayoutPickerProps {
  layouts: Array<{ label: string; template: string; preview: string[] }>
  onSelect: (template: string) => void
}

function LayoutPicker({ layouts, onSelect }: LayoutPickerProps) {
  return (
    <div className="space-y-1">
      {layouts.map(({ label, template, preview }) => (
        <button
          key={template}
          type="button"
          className="editor-dropdown-item w-full flex-col items-start gap-1 py-2"
          onClick={() => onSelect(template)}
        >
          <span className="text-xs">{label}</span>
          <div className="flex w-full gap-0.5 h-3">
            {preview.map((width, i) => (
              <div
                key={i}
                className="bg-muted-foreground/30 rounded-theme-sm h-full"
                style={{ width }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// SEPARATOR
// ============================================================================

export interface InsertSeparatorProps {
  className?: string
}

/**
 * A visual separator for grouping items in the insert dropdown.
 */
export function InsertSeparator({ className }: InsertSeparatorProps) {
  return <div className={cn('my-1 h-px bg-border', className)} />
}
