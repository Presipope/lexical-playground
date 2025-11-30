'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isCodeHighlightNode } from '@lexical/code'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isAtNodeEnd } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  RangeSelection,
  TextNode,
  ElementNode,
} from 'lexical'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  CaseUpper,
  CaseLower,
  CaseSensitive,
  Code,
  Link,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Get DOM selection rectangle
function getDOMRangeRect(
  nativeSelection: Selection,
  rootElement: HTMLElement
): DOMRect {
  const domRange = nativeSelection.getRangeAt(0)

  let rect
  if (nativeSelection.anchorNode === rootElement) {
    let inner = rootElement
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild as HTMLElement
    }
    rect = inner.getBoundingClientRect()
  } else {
    rect = domRange.getBoundingClientRect()
  }

  return rect
}

// Position floating element relative to selection
function setFloatingElemPosition(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  isLink: boolean = false,
  verticalGap: number = 10,
  horizontalOffset: number = 5
): void {
  const scrollerElem = anchorElem.parentElement

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = '0'
    floatingElem.style.transform = 'translate(-10000px, -10000px)'
    return
  }

  const floatingElemRect = floatingElem.getBoundingClientRect()
  const anchorElementRect = anchorElem.getBoundingClientRect()
  const editorScrollerRect = scrollerElem.getBoundingClientRect()

  let top = targetRect.top - floatingElemRect.height - verticalGap
  let left = targetRect.left - horizontalOffset

  // Check if text is end-aligned
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const textNode = range.startContainer
    if (textNode.nodeType === Node.ELEMENT_NODE || textNode.parentElement) {
      const textElement =
        textNode.nodeType === Node.ELEMENT_NODE
          ? (textNode as Element)
          : (textNode.parentElement as Element)
      const textAlign = window.getComputedStyle(textElement).textAlign

      if (textAlign === 'right' || textAlign === 'end') {
        left = targetRect.right - floatingElemRect.width + horizontalOffset
      }
    }
  }

  if (top < editorScrollerRect.top) {
    top +=
      floatingElemRect.height +
      targetRect.height +
      verticalGap * (isLink ? 9 : 2)
  }

  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset
  }

  if (left < editorScrollerRect.left) {
    left = editorScrollerRect.left + horizontalOffset
  }

  top -= anchorElementRect.top
  left -= anchorElementRect.left

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${left}px, ${top}px)`
}

// Get the selected node from a range selection
function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode
  }
}

interface TextFormatFloatingToolbarProps {
  editor: LexicalEditor
  anchorElem: HTMLElement
  isLink: boolean
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isUppercase: boolean
  isLowercase: boolean
  isCapitalize: boolean
  isCode: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  setIsLinkEditMode: Dispatch<SetStateAction<boolean>>
}

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isLink,
  isBold,
  isItalic,
  isUnderline,
  isUppercase,
  isLowercase,
  isCapitalize,
  isCode,
  isStrikethrough,
  isSubscript,
  isSuperscript,
  setIsLinkEditMode,
}: TextFormatFloatingToolbarProps) {
  const popupRef = useRef<HTMLDivElement | null>(null)

  const insertLink = useCallback(() => {
    if (!isLink) {
      setIsLinkEditMode(true)
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://')
    } else {
      setIsLinkEditMode(false)
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink, setIsLinkEditMode])

  // Handle mouse move/up for drag prevention
  function mouseMoveListener(e: MouseEvent) {
    if (popupRef?.current && (e.buttons === 1 || e.buttons === 3)) {
      if (popupRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX
        const y = e.clientY
        const elementUnderMouse = document.elementFromPoint(x, y)

        if (!popupRef.current.contains(elementUnderMouse)) {
          popupRef.current.style.pointerEvents = 'none'
        }
      }
    }
  }

  function mouseUpListener() {
    if (popupRef?.current) {
      if (popupRef.current.style.pointerEvents !== 'auto') {
        popupRef.current.style.pointerEvents = 'auto'
      }
    }
  }

  useEffect(() => {
    if (popupRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener)
      document.addEventListener('mouseup', mouseUpListener)

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener)
        document.removeEventListener('mouseup', mouseUpListener)
      }
    }
  }, [popupRef])

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection()
    const popupElem = popupRef.current
    const nativeSelection = getDOMSelection(editor._window)

    if (popupElem === null) {
      return
    }

    const rootElement = editor.getRootElement()
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement)
      setFloatingElemPosition(rangeRect, popupElem, anchorElem, isLink)
    }
  }, [editor, anchorElem, isLink])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar()
      })
    }

    window.addEventListener('resize', update)
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem])

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar()
    })
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, $updateTextFormatFloatingToolbar])

  return (
    <div
      ref={popupRef}
      className="floating-text-format-toolbar"
    >
      {editor.isEditable() && (
        <>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
            className={cn('floating-toolbar-btn', isBold && 'active')}
            title="Bold (Ctrl+B)"
            aria-label="Format text as bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
            className={cn('floating-toolbar-btn', isItalic && 'active')}
            title="Italic (Ctrl+I)"
            aria-label="Format text as italics"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
            className={cn('floating-toolbar-btn', isUnderline && 'active')}
            title="Underline (Ctrl+U)"
            aria-label="Format text to underlined"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
            className={cn('floating-toolbar-btn', isStrikethrough && 'active')}
            title="Strikethrough"
            aria-label="Format text with strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
            className={cn('floating-toolbar-btn', isSubscript && 'active')}
            title="Subscript"
            aria-label="Format subscript"
          >
            <Subscript className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}
            className={cn('floating-toolbar-btn', isSuperscript && 'active')}
            title="Superscript"
            aria-label="Format superscript"
          >
            <Superscript className="h-4 w-4" />
          </button>
          <div className="floating-toolbar-separator" />
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase')}
            className={cn('floating-toolbar-btn', isUppercase && 'active')}
            title="Uppercase"
            aria-label="Format text to uppercase"
          >
            <CaseUpper className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase')}
            className={cn('floating-toolbar-btn', isLowercase && 'active')}
            title="Lowercase"
            aria-label="Format text to lowercase"
          >
            <CaseLower className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize')}
            className={cn('floating-toolbar-btn', isCapitalize && 'active')}
            title="Capitalize"
            aria-label="Format text to capitalize"
          >
            <CaseSensitive className="h-4 w-4" />
          </button>
          <div className="floating-toolbar-separator" />
          <button
            type="button"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
            className={cn('floating-toolbar-btn', isCode && 'active')}
            title="Insert code block"
            aria-label="Insert code block"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={insertLink}
            className={cn('floating-toolbar-btn', isLink && 'active')}
            title="Insert link (Ctrl+K)"
            aria-label="Insert link"
          >
            <Link className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  setIsLinkEditMode: Dispatch<SetStateAction<boolean>>
): JSX.Element | null {
  const [isText, setIsText] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isUppercase, setIsUppercase] = useState(false)
  const [isLowercase, setIsLowercase] = useState(false)
  const [isCapitalize, setIsCapitalize] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return
      }
      const selection = $getSelection()
      const nativeSelection = getDOMSelection(editor._window)
      const rootElement = editor.getRootElement()

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false)
        return
      }

      if (!$isRangeSelection(selection)) {
        return
      }

      const node = getSelectedNode(selection)

      // Update text format
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsUppercase(selection.hasFormat('uppercase'))
      setIsLowercase(selection.hasFormat('lowercase'))
      setIsCapitalize(selection.hasFormat('capitalize'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsSubscript(selection.hasFormat('subscript'))
      setIsSuperscript(selection.hasFormat('superscript'))
      setIsCode(selection.hasFormat('code'))

      // Update links
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node) || $isParagraphNode(node))
      } else {
        setIsText(false)
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '')
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false)
        return
      }
    })
  }, [editor])

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup)
    return () => {
      document.removeEventListener('selectionchange', updatePopup)
    }
  }, [updatePopup])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup()
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false)
        }
      })
    )
  }, [editor, updatePopup])

  if (!isText) {
    return null
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isLink={isLink}
      isBold={isBold}
      isItalic={isItalic}
      isUppercase={isUppercase}
      isLowercase={isLowercase}
      isCapitalize={isCapitalize}
      isStrikethrough={isStrikethrough}
      isSubscript={isSubscript}
      isSuperscript={isSuperscript}
      isUnderline={isUnderline}
      isCode={isCode}
      setIsLinkEditMode={setIsLinkEditMode}
    />,
    anchorElem
  )
}

export interface FloatingTextFormatToolbarPluginProps {
  anchorElem?: HTMLElement
  setIsLinkEditMode: Dispatch<SetStateAction<boolean>>
}

export function FloatingTextFormatToolbarPlugin({
  anchorElem,
  setIsLinkEditMode,
}: FloatingTextFormatToolbarPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  if (!anchorElem) {
    return null
  }

  return useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode)
}
