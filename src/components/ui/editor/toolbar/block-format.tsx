'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text'
import { $createCodeNode, $isCodeNode } from '@lexical/code'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list'
import { $getNearestNodeOfType, $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'check' | 'quote' | 'code'

const blockTypeToBlockName: Record<BlockType, string> = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'Bullet List',
  number: 'Numbered List',
  check: 'Check List',
  quote: 'Quote',
  code: 'Code Block',
}

const blockTypeToIcon: Record<BlockType, typeof Pilcrow> = {
  paragraph: Pilcrow,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  bullet: List,
  number: ListOrdered,
  check: ListChecks,
  quote: Quote,
  code: Code,
}

export interface BlockFormatDropdownProps {
  className?: string
  /**
   * Which block types to show in the dropdown
   */
  blockTypes?: BlockType[]
}

const defaultBlockTypes: BlockType[] = [
  'paragraph',
  'h1',
  'h2',
  'h3',
  'bullet',
  'number',
  'check',
  'quote',
  'code',
]

export function BlockFormatDropdown({
  className,
  blockTypes = defaultBlockTypes,
}: BlockFormatDropdownProps) {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updateBlockType = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && parent.getKey() === 'root'
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
        const type = parentList ? parentList.getListType() : element.getListType()
        setBlockType(type as BlockType)
      } else if ($isHeadingNode(element)) {
        const tag = element.getTag()
        setBlockType(tag as BlockType)
      } else if ($isCodeNode(element)) {
        setBlockType('code')
      } else {
        const type = element.getType()
        if (type === 'quote') {
          setBlockType('quote')
        } else {
          setBlockType('paragraph')
        }
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
          updateBlockType()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateBlockType()
        })
      })
    )
  }, [editor, updateBlockType])

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

  const formatParagraph = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }, [editor])

  const formatHeading = useCallback(
    (headingSize: 'h1' | 'h2' | 'h3') => {
      if (blockType !== headingSize) {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode(headingSize))
          }
        })
      }
    },
    [blockType, editor]
  )

  const formatBulletList = useCallback(() => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      formatParagraph()
    }
  }, [blockType, editor, formatParagraph])

  const formatNumberedList = useCallback(() => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else {
      formatParagraph()
    }
  }, [blockType, editor, formatParagraph])

  const formatCheckList = useCallback(() => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    } else {
      formatParagraph()
    }
  }, [blockType, editor, formatParagraph])

  const formatQuote = useCallback(() => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }, [blockType, editor])

  const formatCode = useCallback(() => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode())
          } else {
            const textContent = selection.getTextContent()
            const codeNode = $createCodeNode()
            selection.insertNodes([codeNode])
            selection.insertRawText(textContent)
          }
        }
      })
    }
  }, [blockType, editor])

  const blockActions: Record<BlockType, () => void> = {
    paragraph: formatParagraph,
    h1: () => formatHeading('h1'),
    h2: () => formatHeading('h2'),
    h3: () => formatHeading('h3'),
    bullet: formatBulletList,
    number: formatNumberedList,
    check: formatCheckList,
    quote: formatQuote,
    code: formatCode,
  }

  const handleSelect = (type: BlockType) => {
    blockActions[type]()
    setIsOpen(false)
  }

  const CurrentIcon = blockTypeToIcon[blockType]

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
        <CurrentIcon className="h-4 w-4" />
        <span className="text-sm">{blockTypeToBlockName[blockType]}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="editor-dropdown-content mt-1">
          {blockTypes.map((type) => {
            const Icon = blockTypeToIcon[type]
            return (
              <button
                key={type}
                type="button"
                className={cn(
                  'editor-dropdown-item w-full',
                  blockType === type && 'bg-accent'
                )}
                onClick={() => handleSelect(type)}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span>{blockTypeToBlockName[type]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
