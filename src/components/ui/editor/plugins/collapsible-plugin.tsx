'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $findMatchingParent,
  $insertNodeToNearestRoot,
  mergeRegister,
} from '@lexical/utils'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalCommand,
} from 'lexical'
import { useEffect } from 'react'

import {
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from '../nodes/collapsible-container-node'
import {
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from '../nodes/collapsible-content-node'
import {
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
} from '../nodes/collapsible-title-node'

export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_COLLAPSIBLE_COMMAND'
)

export function CollapsiblePlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (
      !editor.hasNodes([
        CollapsibleContainerNode,
        CollapsibleTitleNode,
        CollapsibleContentNode,
      ])
    ) {
      throw new Error(
        'CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor'
      )
    }

    const $onEscapeUp = () => {
      const selection = $getSelection()
      if (
        $isRangeSelection(selection) &&
        selection.isCollapsed() &&
        selection.anchor.offset === 0
      ) {
        const container = $findMatchingParent(
          selection.anchor.getNode(),
          $isCollapsibleContainerNode
        )

        if ($isCollapsibleContainerNode(container)) {
          const parent = container.getParent()
          if (
            parent !== null &&
            parent.getFirstChild() === container &&
            selection.anchor.key === container.getFirstDescendant()?.getKey()
          ) {
            container.insertBefore($createParagraphNode())
          }
        }
      }

      return false
    }

    const $onEscapeDown = () => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const container = $findMatchingParent(
          selection.anchor.getNode(),
          $isCollapsibleContainerNode
        )

        if ($isCollapsibleContainerNode(container)) {
          const parent = container.getParent()
          if (parent !== null && parent.getLastChild() === container) {
            const titleParagraph = container.getFirstDescendant()
            const contentParagraph = container.getLastDescendant()

            if (
              (contentParagraph !== null &&
                selection.anchor.key === contentParagraph.getKey() &&
                selection.anchor.offset ===
                  contentParagraph.getTextContentSize()) ||
              (titleParagraph !== null &&
                selection.anchor.key === titleParagraph.getKey() &&
                selection.anchor.offset === titleParagraph.getTextContentSize())
            ) {
              container.insertAfter($createParagraphNode())
            }
          }
        }
      }

      return false
    }

    return mergeRegister(
      // Structure enforcing transformers for each node type
      editor.registerNodeTransform(CollapsibleContentNode, (node) => {
        const parent = node.getParent()
        if (!$isCollapsibleContainerNode(parent)) {
          const children = node.getChildren()
          for (const child of children) {
            node.insertBefore(child)
          }
          node.remove()
        }
      }),

      editor.registerNodeTransform(CollapsibleTitleNode, (node) => {
        const parent = node.getParent()
        if (!$isCollapsibleContainerNode(parent)) {
          node.replace($createParagraphNode().append(...node.getChildren()))
        }
      }),

      editor.registerNodeTransform(CollapsibleContainerNode, (node) => {
        const children = node.getChildren()
        if (
          children.length !== 2 ||
          !$isCollapsibleTitleNode(children[0]) ||
          !$isCollapsibleContentNode(children[1])
        ) {
          for (const child of children) {
            node.insertBefore(child)
          }
          node.remove()
        }
      }),

      // Arrow key navigation
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        $onEscapeDown,
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        $onEscapeDown,
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        $onEscapeUp,
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        $onEscapeUp,
        COMMAND_PRIORITY_LOW
      ),

      // Enter in title goes to content
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const titleNode = $findMatchingParent(
              selection.anchor.getNode(),
              (node) => $isCollapsibleTitleNode(node)
            )

            if ($isCollapsibleTitleNode(titleNode)) {
              const container = titleNode.getParent()
              if (container && $isCollapsibleContainerNode(container)) {
                if (!container.getOpen()) {
                  container.toggleOpen()
                }
                titleNode.getNextSibling()?.selectEnd()
                return true
              }
            }
          }

          return false
        },
        COMMAND_PRIORITY_LOW
      ),

      // Insert collapsible command
      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        () => {
          editor.update(() => {
            const title = $createCollapsibleTitleNode()
            const paragraph = $createParagraphNode()
            $insertNodeToNearestRoot(
              $createCollapsibleContainerNode(true).append(
                title.append(paragraph),
                $createCollapsibleContentNode().append($createParagraphNode())
              )
            )
            paragraph.select()
          })
          return true
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle DELETE key - when at end of paragraph before collapsible, go into title
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode()
            const topLevelElement = anchorNode.getTopLevelElementOrThrow()

            // Check if we're at the end of the current element
            if (
              selection.anchor.offset === anchorNode.getTextContentSize() ||
              ($isParagraphNode(anchorNode) && anchorNode.isEmpty())
            ) {
              const nextSibling = topLevelElement.getNextSibling()
              if ($isCollapsibleContainerNode(nextSibling)) {
                // Move selection into the collapsible title
                const titleNode = nextSibling.getFirstChild()
                if ($isCollapsibleTitleNode(titleNode)) {
                  titleNode.selectStart()
                  return true
                }
              }
            }
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      ),

      // Handle BACKSPACE in title - if title is empty and at start, delete the collapsible
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode()

            // Check if we're at the start of a collapsible title
            if (selection.anchor.offset === 0) {
              const titleNode = $findMatchingParent(
                anchorNode,
                (node) => $isCollapsibleTitleNode(node)
              )

              if ($isCollapsibleTitleNode(titleNode)) {
                const container = titleNode.getParent()
                if ($isCollapsibleContainerNode(container)) {
                  // If title is empty, check if we should delete the whole collapsible
                  if (titleNode.getTextContentSize() === 0) {
                    const contentNode = titleNode.getNextSibling()
                    if ($isCollapsibleContentNode(contentNode) && contentNode.getTextContentSize() === 0) {
                      // Both title and content are empty, delete the collapsible
                      const prevSibling = container.getPreviousSibling()
                      container.remove()
                      if (prevSibling) {
                        prevSibling.selectEnd()
                      }
                      return true
                    }
                  }

                  // Move to the previous sibling
                  const prevSibling = container.getPreviousSibling()
                  if (prevSibling) {
                    prevSibling.selectEnd()
                    return true
                  }
                }
              }
            }
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor])

  return null
}
