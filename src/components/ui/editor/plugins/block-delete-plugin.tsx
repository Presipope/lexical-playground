'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { $isHorizontalRuleNode, HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $isTableNode, TableNode } from '@lexical/table'
import { mergeRegister } from '@lexical/utils'
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'

import { $isCollapsibleContainerNode, CollapsibleContainerNode } from '../nodes/collapsible-container-node'
import { $isLayoutContainerNode, LayoutContainerNode } from '../nodes/layout-container-node'

const DELETABLE_BLOCK_TYPES = [
  'horizontal-rule',
  'table',
  'collapsible-container',
  'layout-container',
]

function BlockDeleteButton({
  anchorElem,
}: {
  anchorElem: HTMLElement
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const updateButton = useCallback(() => {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) {
      setIsVisible(false)
      return
    }

    const anchorNode = selection.anchor.getNode()
    const element = anchorNode.getKey() === 'root'
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow()

    const elementKey = element.getKey()
    const elementDOM = editor.getElementByKey(elementKey)

    if (elementDOM === null) {
      setIsVisible(false)
      return
    }

    // Check if the element is one of our deletable types
    const isDeletable =
      $isHorizontalRuleNode(element) ||
      $isTableNode(element) ||
      $isCollapsibleContainerNode(element) ||
      $isLayoutContainerNode(element)

    if (!isDeletable) {
      setIsVisible(false)
      return
    }

    setTargetElement(elementDOM)
    setIsVisible(true)
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateButton()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateButton()
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, updateButton])

  // Position the button
  useEffect(() => {
    const button = buttonRef.current
    if (!button || !targetElement || !isVisible) {
      return
    }

    const targetRect = targetElement.getBoundingClientRect()
    const anchorRect = anchorElem.getBoundingClientRect()

    const top = targetRect.top - anchorRect.top + 4
    const right = anchorRect.right - targetRect.right + 4

    button.style.top = `${top}px`
    button.style.right = `${right}px`
  }, [targetElement, anchorElem, isVisible])

  const handleDelete = useCallback(() => {
    if (!targetElement) return

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(targetElement)
      if (node) {
        // Find the actual deletable parent node
        let targetNode = node

        // For table cells, we need to find the table node
        if ($isTableNode(targetNode)) {
          targetNode.remove()
        } else if ($isHorizontalRuleNode(targetNode)) {
          targetNode.remove()
        } else if ($isCollapsibleContainerNode(targetNode)) {
          targetNode.remove()
        } else if ($isLayoutContainerNode(targetNode)) {
          targetNode.remove()
        } else {
          // Try to find parent that matches
          const parent = targetNode.getParent()
          if (parent && (
            $isTableNode(parent) ||
            $isCollapsibleContainerNode(parent) ||
            $isLayoutContainerNode(parent)
          )) {
            parent.remove()
          }
        }
      }
    })
    setIsVisible(false)
  }, [editor, targetElement])

  if (!isVisible) {
    return null
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="block-delete-button"
      onClick={handleDelete}
      aria-label="Delete block"
      title="Delete block"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}

// Also handle hover-based visibility
function BlockDeleteHoverHandler({
  anchorElem,
}: {
  anchorElem: HTMLElement
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Find the closest deletable block
      const hr = target.closest('hr')
      const table = target.closest('table')
      const collapsible = target.closest('.Collapsible__container')
      const layout = target.closest('.editor-layout-container')

      const blockElement = hr || table || collapsible || layout

      if (blockElement && rootElement.contains(blockElement)) {
        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        setHoveredElement(blockElement as HTMLElement)

        // Get the node key
        editor.getEditorState().read(() => {
          const node = $getNearestNodeFromDOMNode(blockElement)
          if (node) {
            setHoveredNodeKey(node.getKey())
          }
        })
      } else {
        // Delay hiding to allow moving to the button
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setHoveredElement(null)
          setHoveredNodeKey(null)
        }, 200)
      }
    }

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setHoveredElement(null)
        setHoveredNodeKey(null)
      }, 200)
    }

    rootElement.addEventListener('mousemove', handleMouseMove)
    rootElement.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      rootElement.removeEventListener('mousemove', handleMouseMove)
      rootElement.removeEventListener('mouseleave', handleMouseLeave)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [editor])

  // Position the button
  useEffect(() => {
    const button = buttonRef.current
    if (!button || !hoveredElement) {
      return
    }

    const targetRect = hoveredElement.getBoundingClientRect()
    const anchorRect = anchorElem.getBoundingClientRect()

    const top = targetRect.top - anchorRect.top + 4
    const right = anchorRect.right - targetRect.right + 4

    button.style.top = `${top}px`
    button.style.right = `${right}px`
  }, [hoveredElement, anchorElem])

  const handleDelete = useCallback(() => {
    if (!hoveredNodeKey) return

    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(hoveredNodeKey)
      if (node) {
        node.remove()
      }
    })
    setHoveredElement(null)
    setHoveredNodeKey(null)
  }, [editor, hoveredNodeKey])

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredElement(null)
      setHoveredNodeKey(null)
    }, 200)
  }, [])

  if (!hoveredElement) {
    return null
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="block-delete-button"
      onClick={handleDelete}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Delete block"
      title="Delete block"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}

export function BlockDeletePlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): React.ReactPortal | null {
  const isEditable = useLexicalEditable()

  return isEditable
    ? createPortal(
        <BlockDeleteHoverHandler anchorElem={anchorElem} />,
        anchorElem
      )
    : null
}

export default BlockDeletePlugin
