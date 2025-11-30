'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { INSERT_TABLE_COMMAND } from '@lexical/table'
import {
  Plus,
  ChevronDown,
  Minus,
  Table,
  Columns,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSERT_COLLAPSIBLE_COMMAND } from '../plugins/collapsible-plugin'
import { INSERT_LAYOUT_COMMAND } from '../plugins/layout-plugin'

type InsertType = 'horizontal-rule' | 'table' | 'columns' | 'collapsible'

const insertTypeToName: Record<InsertType, string> = {
  'horizontal-rule': 'Horizontal Rule',
  'table': 'Table',
  'columns': 'Columns Layout',
  'collapsible': 'Collapsible',
}

const insertTypeToIcon: Record<InsertType, typeof Plus> = {
  'horizontal-rule': Minus,
  'table': Table,
  'columns': Columns,
  'collapsible': ChevronRight,
}

export interface InsertDropdownProps {
  className?: string
}

export function InsertDropdown({ className }: InsertDropdownProps) {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [showLayoutPicker, setShowLayoutPicker] = useState(false)
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
        setShowTablePicker(false)
        setShowLayoutPicker(false)
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
    setShowTablePicker(false)
  }, [editor])

  const insertCollapsible = useCallback(() => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
    setIsOpen(false)
  }, [editor])

  const insertLayout = useCallback((template: string) => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, template)
    setIsOpen(false)
    setShowLayoutPicker(false)
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
        <div className="editor-dropdown-content mt-1 min-w-[200px]">
          {/* Horizontal Rule */}
          <button
            type="button"
            className="editor-dropdown-item w-full"
            onClick={insertHorizontalRule}
          >
            <Minus className="h-4 w-4 mr-2" />
            <span>Horizontal Rule</span>
          </button>

          {/* Table with submenu */}
          <div className="relative">
            <button
              type="button"
              className="editor-dropdown-item w-full justify-between"
              onClick={() => setShowTablePicker(!showTablePicker)}
            >
              <span className="flex items-center">
                <Table className="h-4 w-4 mr-2" />
                <span>Table</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            {showTablePicker && (
              <div className="editor-dropdown-content absolute left-full top-0 ml-1 p-2">
                <TableSizePicker onSelect={insertTable} />
              </div>
            )}
          </div>

          {/* Columns Layout with submenu */}
          <div className="relative">
            <button
              type="button"
              className="editor-dropdown-item w-full justify-between"
              onClick={() => setShowLayoutPicker(!showLayoutPicker)}
            >
              <span className="flex items-center">
                <Columns className="h-4 w-4 mr-2" />
                <span>Columns Layout</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            {showLayoutPicker && (
              <div className="editor-dropdown-content absolute left-full top-0 ml-1 p-2 min-w-[160px]">
                <LayoutPicker onSelect={insertLayout} />
              </div>
            )}
          </div>

          {/* Collapsible */}
          <button
            type="button"
            className="editor-dropdown-item w-full"
            onClick={insertCollapsible}
          >
            <ChevronRight className="h-4 w-4 mr-2" />
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
                'w-5 h-5 border rounded-sm transition-colors',
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
                className="bg-muted-foreground/30 rounded-sm h-full"
                style={{ width }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
