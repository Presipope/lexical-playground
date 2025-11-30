'use client'

import type { ReactNode } from 'react'
import type { Klass, LexicalNode, EditorThemeClasses } from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'

import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HashtagNode } from '@lexical/hashtag'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { OverflowNode } from '@lexical/overflow'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'

import {
  SharedHistoryProvider,
  ToolbarProvider,
  ActiveEditorProvider,
  ModalProvider,
  FlashMessageProvider,
  EditorConfigProvider,
  type EditorConfig,
} from './lib/context'
import { editorTheme } from './lib/theme'
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  LayoutContainerNode,
  LayoutItemNode,
} from './nodes'
import './editor.css'

// Default nodes included with the editor
const defaultNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  HorizontalRuleNode,
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  LayoutContainerNode,
  LayoutItemNode,
]

export interface EditorRootProps {
  children: ReactNode
  /**
   * Additional Lexical nodes to register
   */
  nodes?: Array<Klass<LexicalNode>>
  /**
   * Custom theme to override default styles
   */
  theme?: EditorThemeClasses
  /**
   * Editor namespace for identification
   */
  namespace?: string
  /**
   * Initial editor state (JSON string or callback)
   */
  initialState?: string | (() => void)
  /**
   * Whether the editor is editable
   */
  editable?: boolean
  /**
   * Placeholder text when editor is empty
   */
  placeholder?: string
  /**
   * Error handler
   */
  onError?: (error: Error) => void
  /**
   * Additional class names for the root container
   */
  className?: string
}

export function EditorRoot({
  children,
  nodes = [],
  theme,
  namespace = 'editor',
  initialState,
  editable = true,
  placeholder = 'Start writing...',
  onError,
  className = '',
}: EditorRootProps) {
  const initialConfig = {
    namespace,
    nodes: [...defaultNodes, ...nodes],
    theme: theme || editorTheme,
    editorState: initialState,
    editable,
    onError: onError || ((error: Error) => console.error(error)),
  }

  const editorConfig: EditorConfig = {
    namespace,
    placeholder,
    editable,
    onError,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorConfigProvider config={editorConfig}>
        <SharedHistoryProvider>
          <ToolbarProvider>
            <ActiveEditorProvider>
              <ModalProvider>
                <FlashMessageProvider>
                  <div className={`editor-shell ${className}`}>
                    {children}
                  </div>
                </FlashMessageProvider>
              </ModalProvider>
            </ActiveEditorProvider>
          </ToolbarProvider>
        </SharedHistoryProvider>
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
