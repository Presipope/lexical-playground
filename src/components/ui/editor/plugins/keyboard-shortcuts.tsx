'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createCodeNode } from '@lexical/code'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text'
import { $patchStyleText, $setBlocksType } from '@lexical/selection'
import { $getNearestBlockElementAncestorOrThrow, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'
import { useToolbarState } from '../lib/context'
import { IS_APPLE } from '../lib/environment'

// Keyboard shortcut matchers
function isModifierMatch(
  event: KeyboardEvent,
  { ctrlKey = false, metaKey = false, altKey = false, shiftKey = false }: {
    ctrlKey?: boolean
    metaKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
  }
): boolean {
  return (
    event.ctrlKey === ctrlKey &&
    event.metaKey === metaKey &&
    event.altKey === altKey &&
    event.shiftKey === shiftKey
  )
}

const CONTROL_OR_META = { ctrlKey: !IS_APPLE, metaKey: IS_APPLE }

function isFormatParagraph(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    (code === 'Numpad0' || code === 'Digit0') &&
    isModifierMatch(event, { ...CONTROL_OR_META, altKey: true })
  )
}

function isFormatHeading(event: KeyboardEvent): boolean {
  const { code } = event
  if (!code) return false
  const keyNumber = code[code.length - 1]
  return (
    ['1', '2', '3', '4', '5', '6'].includes(keyNumber) &&
    isModifierMatch(event, { ...CONTROL_OR_META, altKey: true })
  )
}

function isFormatNumberedList(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    (code === 'Numpad7' || code === 'Digit7') &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isFormatBulletList(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    (code === 'Numpad8' || code === 'Digit8') &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isFormatCheckList(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    (code === 'Numpad9' || code === 'Digit9') &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isFormatCode(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyC' &&
    isModifierMatch(event, { ...CONTROL_OR_META, altKey: true })
  )
}

function isFormatQuote(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyQ' &&
    isModifierMatch(event, { ctrlKey: true, shiftKey: true })
  )
}

function isStrikeThrough(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyX' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isIndent(event: KeyboardEvent): boolean {
  const { code } = event
  return code === 'BracketRight' && isModifierMatch(event, CONTROL_OR_META)
}

function isOutdent(event: KeyboardEvent): boolean {
  const { code } = event
  return code === 'BracketLeft' && isModifierMatch(event, CONTROL_OR_META)
}

function isCenterAlign(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyE' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isLeftAlign(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyL' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isRightAlign(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyR' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isJustifyAlign(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyJ' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isSubscript(event: KeyboardEvent): boolean {
  const { code } = event
  return code === 'Comma' && isModifierMatch(event, CONTROL_OR_META)
}

function isSuperscript(event: KeyboardEvent): boolean {
  const { code } = event
  return code === 'Period' && isModifierMatch(event, CONTROL_OR_META)
}

function isInsertCodeBlock(event: KeyboardEvent): boolean {
  const { code } = event
  return (
    code === 'KeyC' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  )
}

function isClearFormatting(event: KeyboardEvent): boolean {
  const { code } = event
  return code === 'Backslash' && isModifierMatch(event, CONTROL_OR_META)
}

function isInsertLink(event: KeyboardEvent): boolean {
  const { code } = event
  return code === 'KeyK' && isModifierMatch(event, CONTROL_OR_META)
}

// Basic Lexical shortcuts that we just need to stop propagation for
// (Lexical handles the actual formatting)
function isBold(event: KeyboardEvent): boolean {
  return event.code === 'KeyB' && isModifierMatch(event, CONTROL_OR_META)
}

function isItalic(event: KeyboardEvent): boolean {
  return event.code === 'KeyI' && isModifierMatch(event, CONTROL_OR_META)
}

function isUnderline(event: KeyboardEvent): boolean {
  return event.code === 'KeyU' && isModifierMatch(event, CONTROL_OR_META)
}

function isUndo(event: KeyboardEvent): boolean {
  return event.code === 'KeyZ' && isModifierMatch(event, CONTROL_OR_META)
}

function isRedo(event: KeyboardEvent): boolean {
  return (
    (event.code === 'KeyZ' && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })) ||
    (event.code === 'KeyY' && isModifierMatch(event, CONTROL_OR_META))
  )
}

// Formatting utility functions
function formatParagraph(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection()
    $setBlocksType(selection, () => $createParagraphNode())
  })
}

function formatHeading(
  editor: LexicalEditor,
  blockType: string,
  headingSize: HeadingTagType
) {
  if (blockType !== headingSize) {
    editor.update(() => {
      const selection = $getSelection()
      $setBlocksType(selection, () => $createHeadingNode(headingSize))
    })
  }
}

function formatBulletList(editor: LexicalEditor, blockType: string) {
  if (blockType !== 'bullet') {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
  } else {
    formatParagraph(editor)
  }
}

function formatCheckList(editor: LexicalEditor, blockType: string) {
  if (blockType !== 'check') {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
  } else {
    formatParagraph(editor)
  }
}

function formatNumberedList(editor: LexicalEditor, blockType: string) {
  if (blockType !== 'number') {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
  } else {
    formatParagraph(editor)
  }
}

function formatQuote(editor: LexicalEditor, blockType: string) {
  if (blockType !== 'quote') {
    editor.update(() => {
      const selection = $getSelection()
      $setBlocksType(selection, () => $createQuoteNode())
    })
  }
}

function formatCode(editor: LexicalEditor, blockType: string) {
  if (blockType !== 'code') {
    editor.update(() => {
      let selection = $getSelection()
      if (!selection) return

      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        $setBlocksType(selection, () => $createCodeNode())
      } else {
        const textContent = selection.getTextContent()
        const codeNode = $createCodeNode()
        selection.insertNodes([codeNode])
        selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertRawText(textContent)
        }
      }
    })
  }
}

function clearFormatting(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
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
        }
      })
    }
  })
}

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext()
  const { toolbarState, setIsLinkEditMode } = useToolbarState()

  useEffect(() => {
    const keyboardShortcutsHandler = (event: KeyboardEvent) => {
      // Check if any modifier key is pressed
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        return false
      }

      // Stop propagation for basic Lexical shortcuts (bold, italic, underline, undo, redo)
      // but let Lexical handle them by returning false
      if (isBold(event) || isItalic(event) || isUnderline(event) || isUndo(event) || isRedo(event)) {
        event.stopPropagation()
        return false // Let Lexical's handlers process this
      }

      let handled = false

      if (isFormatParagraph(event)) {
        formatParagraph(editor)
        handled = true
      } else if (isFormatHeading(event)) {
        const { code } = event
        const headingSize = `h${code[code.length - 1]}` as HeadingTagType
        formatHeading(editor, toolbarState.blockType, headingSize)
        handled = true
      } else if (isFormatBulletList(event)) {
        formatBulletList(editor, toolbarState.blockType)
        handled = true
      } else if (isFormatNumberedList(event)) {
        formatNumberedList(editor, toolbarState.blockType)
        handled = true
      } else if (isFormatCheckList(event)) {
        formatCheckList(editor, toolbarState.blockType)
        handled = true
      } else if (isFormatCode(event)) {
        formatCode(editor, toolbarState.blockType)
        handled = true
      } else if (isFormatQuote(event)) {
        formatQuote(editor, toolbarState.blockType)
        handled = true
      } else if (isStrikeThrough(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        handled = true
      } else if (isIndent(event)) {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        handled = true
      } else if (isOutdent(event)) {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        handled = true
      } else if (isCenterAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
        handled = true
      } else if (isLeftAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
        handled = true
      } else if (isRightAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
        handled = true
      } else if (isJustifyAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
        handled = true
      } else if (isSubscript(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
        handled = true
      } else if (isSuperscript(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
        handled = true
      } else if (isInsertCodeBlock(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
        handled = true
      } else if (isClearFormatting(event)) {
        clearFormatting(editor)
        handled = true
      } else if (isInsertLink(event)) {
        const url = toolbarState.isLink ? null : 'https://'
        setIsLinkEditMode(!toolbarState.isLink)
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
        handled = true
      }

      if (handled) {
        event.preventDefault()
        event.stopPropagation()
        return true
      }

      return false
    }

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      keyboardShortcutsHandler,
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor, toolbarState.blockType, toolbarState.isLink, setIsLinkEditMode])

  return null
}
