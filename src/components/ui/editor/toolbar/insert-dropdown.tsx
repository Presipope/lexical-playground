'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSERT_COLLAPSIBLE_COMMAND } from '../plugins/collapsible-plugin'
import { INSERT_LAYOUT_COMMAND } from '../plugins/layout-plugin'

export interface InsertDropdownProps {
  className?: string
}

export function InsertDropdown({ className }: InsertDropdownProps) {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'table' | 'columns' | null>(null)
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
        setActiveSubmenu(null)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const insertHorizontalRule = useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
    setIsOpen(false)
  }, [editor])

  const insertTable = useCallback((rows: number, columns: number) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(columns) })
    setIsOpen(false)
    setActiveSubmenu(null)
  }, [editor])

  const insertCollapsible = useCallback(() => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
    setIsOpen(false)
  }, [editor])

  const insertLayout = useCallback((template: string) => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, template)
    setIsOpen(false)
    setActiveSubmenu(null)
  }, [editor])

  return (
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
        <span className="text-sm">Insert</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="editor-dropdown-content mt-1 min-w-[180px]">
          {/* Horizontal Rule */}
          <button
            type="button"
            className="editor-dropdown-item w-full"
            onClick={insertHorizontalRule}
          >
            <SeparatorHorizontal className="h-4 w-4 mr-2" />
            <span>Horizontal Rule</span>
          </button>

          {/* Table */}
          <button
            type="button"
            className="editor-dropdown-item w-full"
            onClick={() => setActiveSubmenu(activeSubmenu === 'table' ? null : 'table')}
          >
            <Table className="h-4 w-4 mr-2" />
            <span>Table</span>
          </button>
          {activeSubmenu === 'table' && (
            <div className="px-2 py-2 border-t border-border">
              <TableSizePicker onSelect={insertTable} />
            </div>
          )}

          {/* Columns Layout */}
          <button
            type="button"
            className="editor-dropdown-item w-full"
            onClick={() => setActiveSubmenu(activeSubmenu === 'columns' ? null : 'columns')}
          >
            <Columns className="h-4 w-4 mr-2" />
            <span>Columns Layout</span>
          </button>
          {activeSubmenu === 'columns' && (
            <div className="px-2 py-2 border-t border-border">
              <LayoutPicker onSelect={insertLayout} />
            </div>
          )}

          {/* Collapsible */}
          <button
            type="button"
            className="editor-dropdown-item w-full"
            onClick={insertCollapsible}
          >
            <FoldVertical className="h-4 w-4 mr-2" />
            <span>Collapsible</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Table size picker component
function TableSizePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const maxRows = 6
  const maxCols = 6

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

// Layout picker component
function LayoutPicker({ onSelect }: { onSelect: (template: string) => void }) {
  const layouts = [
    { label: '2 columns (equal)', template: '1fr 1fr', preview: ['50%', '50%'] },
    { label: '3 columns (equal)', template: '1fr 1fr 1fr', preview: ['33%', '33%', '33%'] },
    { label: '2 columns (67/33)', template: '2fr 1fr', preview: ['67%', '33%'] },
    { label: '2 columns (33/67)', template: '1fr 2fr', preview: ['33%', '67%'] },
    { label: '3 columns (25/50/25)', template: '1fr 2fr 1fr', preview: ['25%', '50%', '25%'] },
  ]

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
