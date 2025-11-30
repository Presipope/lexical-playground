'use client'

import { useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { CAN_USE_DOM } from '@lexical/utils'

import { useSharedHistory, useActiveEditor, useEditorConfig, useToolbarState } from './lib/context'
import { FloatingLinkEditorPlugin } from './plugins/floating-link-editor'
import { FloatingTextFormatToolbarPlugin } from './plugins/floating-text-format-toolbar'
import { DraggableBlockPlugin } from './plugins/draggable-block-plugin'
import { EmojiPickerPlugin } from './plugins/emoji-picker'
import { KeyboardShortcutsPlugin } from './plugins/keyboard-shortcuts'
import { CollapsiblePlugin } from './plugins/collapsible-plugin'
import { LayoutPlugin } from './plugins/layout-plugin'

export interface EditorContentProps {
  /**
   * Placeholder text when editor is empty
   */
  placeholder?: string
  /**
   * Whether to auto focus the editor on mount
   */
  autoFocus?: boolean
  /**
   * Additional class name for the content area
   */
  className?: string
  /**
   * Enable table features
   */
  enableTable?: boolean
  /**
   * Enable horizontal scroll for tables
   */
  tableHorizontalScroll?: boolean
  /**
   * Enable table cell merging
   */
  tableCellMerge?: boolean
  /**
   * Enable table cell background color
   */
  tableCellBackgroundColor?: boolean
  /**
   * Maximum indent level for lists
   */
  maxIndent?: number
}

function Placeholder({ text }: { text: string }) {
  return <div className="editor-placeholder">{text}</div>
}

export function EditorContent({
  placeholder: placeholderProp,
  autoFocus = true,
  className = '',
  enableTable = true,
  tableHorizontalScroll = true,
  tableCellMerge = true,
  tableCellBackgroundColor = true,
  maxIndent = 7,
}: EditorContentProps) {
  const [editor] = useLexicalComposerContext()
  const { historyState } = useSharedHistory()
  const { setActiveEditor } = useActiveEditor()
  const { isLinkEditMode, setIsLinkEditMode } = useToolbarState()
  const config = useEditorConfig()
  const isEditable = useLexicalEditable()

  const placeholder = placeholderProp ?? config.placeholder ?? 'Start writing...'

  // Floating link editor anchor
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (floatingAnchorElem: HTMLDivElement) => {
    if (floatingAnchorElem !== null) {
      setFloatingAnchorElem(floatingAnchorElem)
    }
  }

  // Set active editor on mount
  useEffect(() => {
    setActiveEditor(editor)
  }, [editor, setActiveEditor])

  // Track viewport width for responsive features
  const [isSmallViewport, setIsSmallViewport] = useState(false)
  useEffect(() => {
    if (!CAN_USE_DOM) return

    const updateViewport = () => {
      setIsSmallViewport(window.matchMedia('(max-width: 1025px)').matches)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return (
    <div className={`editor-container ${className}`}>
      <RichTextPlugin
        contentEditable={
          <div className="editor-scroller">
            <div className="editor-input-wrapper" ref={onRef}>
              <ContentEditable className="editor-input" />
            </div>
          </div>
        }
        placeholder={<Placeholder text={placeholder} />}
        ErrorBoundary={LexicalErrorBoundary}
      />

      {/* Core plugins */}
      <HistoryPlugin externalHistoryState={historyState} />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <ClickableLinkPlugin disabled={isEditable} />
      <HorizontalRulePlugin />
      <TabIndentationPlugin maxIndent={maxIndent} />
      <HashtagPlugin />
      <ClearEditorPlugin />
      <EmojiPickerPlugin />
      <KeyboardShortcutsPlugin />
      <CollapsiblePlugin />
      <LayoutPlugin />

      {/* Floating link editor */}
      {floatingAnchorElem && (
        <FloatingLinkEditorPlugin
          anchorElem={floatingAnchorElem}
          isLinkEditMode={isLinkEditMode}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}

      {/* Floating text format toolbar */}
      {floatingAnchorElem && (
        <FloatingTextFormatToolbarPlugin
          anchorElem={floatingAnchorElem}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}

      {/* Draggable block plugin - hidden on small viewports */}
      {floatingAnchorElem && !isSmallViewport && (
        <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
      )}

      {/* Optional plugins */}
      {autoFocus && <AutoFocusPlugin />}
      {enableTable && (
        <TablePlugin
          hasCellMerge={tableCellMerge}
          hasCellBackgroundColor={tableCellBackgroundColor}
          hasHorizontalScroll={tableHorizontalScroll}
        />
      )}
    </div>
  )
}
