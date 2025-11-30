'use client'

import { useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin'
import { $createParagraphNode, $getNearestNodeFromDOMNode } from 'lexical'
import { GripVertical, Plus } from 'lucide-react'

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`)
}

export function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null
  )

  function insertBlock(e: React.MouseEvent) {
    if (!draggableElement || !editor) {
      return
    }

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableElement)
      if (!node) {
        return
      }

      const pNode = $createParagraphNode()
      // Alt or Ctrl click inserts before, regular click inserts after
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode)
      } else {
        node.insertAfter(pNode)
      }
      pNode.select()
    })
  }

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className={DRAGGABLE_BLOCK_MENU_CLASSNAME}>
          <button
            type="button"
            title="Click to add block below (Alt/Ctrl+click for above)"
            className="draggable-block-menu-button"
            onClick={insertBlock}
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="draggable-block-menu-handle">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
      onElementChanged={setDraggableElement}
    />
  )
}
