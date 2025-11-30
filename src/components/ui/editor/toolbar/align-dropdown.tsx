'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  ElementFormatType,
} from 'lexical'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Outdent,
  Indent,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IS_APPLE } from '../lib/environment'

// Keyboard shortcuts
const SHORTCUTS = {
  LEFT_ALIGN: IS_APPLE ? '⌘+Shift+L' : 'Ctrl+Shift+L',
  CENTER_ALIGN: IS_APPLE ? '⌘+Shift+E' : 'Ctrl+Shift+E',
  RIGHT_ALIGN: IS_APPLE ? '⌘+Shift+R' : 'Ctrl+Shift+R',
  JUSTIFY_ALIGN: IS_APPLE ? '⌘+Shift+J' : 'Ctrl+Shift+J',
  OUTDENT: IS_APPLE ? '⌘+[' : 'Ctrl+[',
  INDENT: IS_APPLE ? '⌘+]' : 'Ctrl+]',
}

type AlignType = 'left' | 'center' | 'right' | 'justify' | 'start' | 'end'

const alignTypeToName: Record<AlignType | 'outdent' | 'indent', string> = {
  left: 'Left Align',
  center: 'Center Align',
  right: 'Right Align',
  justify: 'Justify Align',
  start: 'Start Align',
  end: 'End Align',
  outdent: 'Outdent',
  indent: 'Indent',
}

const alignTypeToIcon: Record<AlignType | 'outdent' | 'indent', typeof AlignLeft> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  justify: AlignJustify,
  start: AlignLeft,
  end: AlignRight,
  outdent: Outdent,
  indent: Indent,
}

const alignTypeToShortcut: Partial<Record<AlignType | 'outdent' | 'indent', string>> = {
  left: SHORTCUTS.LEFT_ALIGN,
  center: SHORTCUTS.CENTER_ALIGN,
  right: SHORTCUTS.RIGHT_ALIGN,
  justify: SHORTCUTS.JUSTIFY_ALIGN,
  outdent: SHORTCUTS.OUTDENT,
  indent: SHORTCUTS.INDENT,
}

export interface AlignDropdownProps {
  className?: string
  /**
   * Which alignment options to show in the dropdown
   */
  alignments?: Array<AlignType | 'outdent' | 'indent'>
}

const defaultAlignments: Array<AlignType | 'outdent' | 'indent'> = [
  'left',
  'center',
  'right',
  'justify',
  'start',
  'end',
  'outdent',
  'indent',
]

export function AlignDropdown({
  className,
  alignments = defaultAlignments,
}: AlignDropdownProps) {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || $isNodeSelection(selection)) {
      // Get the element format from the selection
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode()
        let element = anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && parent.getKey() === 'root'
            })

        if (element === null) {
          element = anchorNode.getTopLevelElementOrThrow()
        }

        const format = ('getFormatType' in element)
          ? (element as any).getFormatType()
          : 'left'
        setElementFormat(format || 'left')
      }
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable)
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(() => {
        editor.read(() => {
          $updateToolbar()
        })
      })
    )
  }, [editor, $updateToolbar])

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

  const formatAlign = useCallback(
    (alignment: AlignType) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
    },
    [editor]
  )

  const handleOutdent = useCallback(() => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
  }, [editor])

  const handleIndent = useCallback(() => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
  }, [editor])

  const handleSelect = (type: AlignType | 'outdent' | 'indent') => {
    if (type === 'outdent') {
      handleOutdent()
    } else if (type === 'indent') {
      handleIndent()
    } else {
      formatAlign(type)
    }
    setIsOpen(false)
  }

  // Current icon based on alignment state
  const currentFormat = elementFormat || 'left'
  const CurrentIcon = alignTypeToIcon[currentFormat as AlignType] || AlignLeft

  return (
    <div className={cn('editor-dropdown', className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={!isEditable}
        onClick={() => setIsOpen(!isOpen)}
        className="editor-dropdown-button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Align"
      >
        <CurrentIcon className="h-4 w-4" />
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="editor-dropdown-content mt-1 min-w-[200px]">
          {alignments.map((type) => {
            const Icon = alignTypeToIcon[type]
            const shortcut = alignTypeToShortcut[type]
            const isActive = type !== 'outdent' && type !== 'indent' && elementFormat === type
            return (
              <button
                key={type}
                type="button"
                className={cn(
                  'editor-dropdown-item w-full justify-between',
                  isActive && 'bg-accent'
                )}
                onClick={() => handleSelect(type)}
              >
                <span className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  <span>{alignTypeToName[type]}</span>
                </span>
                {shortcut && (
                  <span className="text-xs text-muted-foreground ml-4">{shortcut}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
