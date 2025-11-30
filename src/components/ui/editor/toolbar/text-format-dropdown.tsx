'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  TextFormatType,
} from 'lexical'
import { $isTableSelection } from '@lexical/table'
import { $getNearestBlockElementAncestorOrThrow } from '@lexical/utils'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $patchStyleText } from '@lexical/selection'
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { mergeRegister } from '@lexical/utils'
import {
  ALargeSmall,
  CaseLower,
  CaseUpper,
  Type,
  Strikethrough,
  Subscript,
  Superscript,
  Highlighter,
  RemoveFormatting,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IS_APPLE } from '../lib/environment'

// Keyboard shortcuts
const SHORTCUTS = {
  LOWERCASE: IS_APPLE ? '⌃+Shift+1' : 'Ctrl+Shift+1',
  UPPERCASE: IS_APPLE ? '⌃+Shift+2' : 'Ctrl+Shift+2',
  CAPITALIZE: IS_APPLE ? '⌃+Shift+3' : 'Ctrl+Shift+3',
  STRIKETHROUGH: IS_APPLE ? '⌘+Shift+X' : 'Ctrl+Shift+X',
  SUBSCRIPT: IS_APPLE ? '⌘+,' : 'Ctrl+,',
  SUPERSCRIPT: IS_APPLE ? '⌘+.' : 'Ctrl+.',
  CLEAR_FORMATTING: IS_APPLE ? '⌘+\\' : 'Ctrl+\\',
}

type TextFormatOption = 'lowercase' | 'uppercase' | 'capitalize' | 'strikethrough' | 'subscript' | 'superscript' | 'highlight' | 'clear'

const formatOptions: {
  type: TextFormatOption
  label: string
  icon: typeof Type
  shortcut?: string
}[] = [
  { type: 'lowercase', label: 'Lowercase', icon: CaseLower, shortcut: SHORTCUTS.LOWERCASE },
  { type: 'uppercase', label: 'Uppercase', icon: CaseUpper, shortcut: SHORTCUTS.UPPERCASE },
  { type: 'capitalize', label: 'Capitalize', icon: Type, shortcut: SHORTCUTS.CAPITALIZE },
  { type: 'strikethrough', label: 'Strikethrough', icon: Strikethrough, shortcut: SHORTCUTS.STRIKETHROUGH },
  { type: 'subscript', label: 'Subscript', icon: Subscript, shortcut: SHORTCUTS.SUBSCRIPT },
  { type: 'superscript', label: 'Superscript', icon: Superscript, shortcut: SHORTCUTS.SUPERSCRIPT },
  { type: 'highlight', label: 'Highlight', icon: Highlighter },
  { type: 'clear', label: 'Clear Formatting', icon: RemoveFormatting, shortcut: SHORTCUTS.CLEAR_FORMATTING },
]

export interface TextFormatDropdownProps {
  className?: string
}

export function TextFormatDropdown({ className }: TextFormatDropdownProps) {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const formats = new Set<TextFormatType>()
      if (selection.hasFormat('strikethrough')) formats.add('strikethrough')
      if (selection.hasFormat('subscript')) formats.add('subscript')
      if (selection.hasFormat('superscript')) formats.add('superscript')
      if (selection.hasFormat('highlight')) formats.add('highlight')
      setActiveFormats(formats)
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
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      })
    )
  }, [editor, updateToolbar])

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

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection()
        if (selection !== null) {
          $patchStyleText(selection, styles)
        }
      })
    },
    [editor]
  )

  const clearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        const anchor = selection.anchor
        const focus = selection.focus
        const nodes = selection.getNodes()
        const extractedNodes = selection.extract()

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return
        }

        nodes.forEach((node, idx) => {
          if ($isTextNode(node)) {
            let textNode = node
            if (idx === 0 && anchor.offset !== 0) {
              textNode = textNode.splitText(anchor.offset)[1] || textNode
            }
            if (idx === nodes.length - 1) {
              textNode = textNode.splitText(focus.offset)[0] || textNode
            }

            const extractedTextNode = extractedNodes[0]
            if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
              textNode = extractedTextNode
            }

            if (textNode.__style !== '') {
              textNode.setStyle('')
            }
            if (textNode.__format !== 0) {
              textNode.setFormat(0)
            }
            const nearestBlockElement = $getNearestBlockElementAncestorOrThrow(textNode)
            if (nearestBlockElement.__format !== 0) {
              nearestBlockElement.setFormat('')
            }
            if (nearestBlockElement.__indent !== 0) {
              nearestBlockElement.setIndent(0)
            }
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true)
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat('')
          }
        })
      }
    })
  }, [editor])

  const handleFormat = useCallback(
    (type: TextFormatOption) => {
      switch (type) {
        case 'lowercase':
          applyStyleText({ 'text-transform': 'lowercase' })
          break
        case 'uppercase':
          applyStyleText({ 'text-transform': 'uppercase' })
          break
        case 'capitalize':
          applyStyleText({ 'text-transform': 'capitalize' })
          break
        case 'strikethrough':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
          break
        case 'subscript':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
          break
        case 'superscript':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
          break
        case 'highlight':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')
          break
        case 'clear':
          clearFormatting()
          break
      }
      setIsOpen(false)
    },
    [editor, applyStyleText, clearFormatting]
  )

  const isActive = (type: TextFormatOption): boolean => {
    if (type === 'strikethrough') return activeFormats.has('strikethrough')
    if (type === 'subscript') return activeFormats.has('subscript')
    if (type === 'superscript') return activeFormats.has('superscript')
    if (type === 'highlight') return activeFormats.has('highlight')
    return false
  }

  return (
    <div className={cn('editor-dropdown', className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={!isEditable}
        onClick={() => setIsOpen(!isOpen)}
        className="editor-dropdown-button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Text formatting"
      >
        <ALargeSmall className="h-4 w-4" />
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="editor-dropdown-content mt-1 min-w-[200px]">
          {formatOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                type="button"
                className={cn(
                  'editor-dropdown-item w-full justify-between',
                  isActive(option.type) && 'bg-accent'
                )}
                onClick={() => handleFormat(option.type)}
              >
                <span className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  <span>{option.label}</span>
                </span>
                {option.shortcut && (
                  <span className="text-xs text-muted-foreground ml-4">{option.shortcut}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
