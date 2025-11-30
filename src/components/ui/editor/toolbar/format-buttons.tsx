'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister, $getNearestNodeOfType, $findMatchingParent } from '@lexical/utils'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Subscript,
  Superscript,
  Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = anchor.getNode()
  const focusNode = focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  return isBackward ? focusNode : anchorNode
}

export interface FormatButtonsProps {
  className?: string
  /**
   * Which format buttons to show
   */
  formats?: Array<'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'subscript' | 'superscript' | 'highlight'>
}

const defaultFormats: FormatButtonsProps['formats'] = [
  'bold',
  'italic',
  'underline',
  'code',
  'link',
]

export function FormatButtons({
  className,
  formats = defaultFormats,
}: FormatButtonsProps) {
  const [editor] = useLexicalComposerContext()
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  // Format states
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsCode(selection.hasFormat('code'))
      setIsSubscript(selection.hasFormat('subscript'))
      setIsSuperscript(selection.hasFormat('superscript'))
      setIsHighlight(selection.hasFormat('highlight'))

      const node = getSelectedNode(selection)
      if (node) {
        const parent = node.getParent()
        setIsLink($isLinkNode(parent) || $isLinkNode(node))
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

  const formatText = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'subscript' | 'superscript' | 'highlight') => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    },
    [editor]
  )

  const toggleLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://')
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink])

  const buttons = {
    bold: {
      icon: Bold,
      active: isBold,
      onClick: () => formatText('bold'),
      title: 'Bold (Ctrl+B)',
      label: 'Format Bold',
    },
    italic: {
      icon: Italic,
      active: isItalic,
      onClick: () => formatText('italic'),
      title: 'Italic (Ctrl+I)',
      label: 'Format Italic',
    },
    underline: {
      icon: Underline,
      active: isUnderline,
      onClick: () => formatText('underline'),
      title: 'Underline (Ctrl+U)',
      label: 'Format Underline',
    },
    strikethrough: {
      icon: Strikethrough,
      active: isStrikethrough,
      onClick: () => formatText('strikethrough'),
      title: 'Strikethrough',
      label: 'Format Strikethrough',
    },
    code: {
      icon: Code,
      active: isCode,
      onClick: () => formatText('code'),
      title: 'Code',
      label: 'Format Code',
    },
    link: {
      icon: Link,
      active: isLink,
      onClick: toggleLink,
      title: 'Insert Link (Ctrl+K)',
      label: 'Insert Link',
    },
    subscript: {
      icon: Subscript,
      active: isSubscript,
      onClick: () => formatText('subscript'),
      title: 'Subscript',
      label: 'Format Subscript',
    },
    superscript: {
      icon: Superscript,
      active: isSuperscript,
      onClick: () => formatText('superscript'),
      title: 'Superscript',
      label: 'Format Superscript',
    },
    highlight: {
      icon: Highlighter,
      active: isHighlight,
      onClick: () => formatText('highlight'),
      title: 'Highlight',
      label: 'Format Highlight',
    },
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {formats.map((format) => {
        const button = buttons[format]
        const Icon = button.icon
        return (
          <button
            key={format}
            type="button"
            disabled={!isEditable}
            onClick={button.onClick}
            className={cn(
              'editor-toolbar-item editor-toolbar-button',
              button.active && 'active'
            )}
            title={button.title}
            aria-label={button.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
