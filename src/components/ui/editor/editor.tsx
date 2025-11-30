'use client'

import type { Klass, LexicalNode, EditorThemeClasses } from 'lexical'
import { cn } from '@/lib/utils'

import { EditorRoot } from './editor-root'
import { EditorToolbar, ToolbarSeparator } from './editor-toolbar'
import { EditorContent } from './editor-content'
import { HistoryButtons, FormatButtons, BlockFormatDropdown, AlignDropdown, TextFormatDropdown, FontColorPicker, BackgroundColorPicker } from './toolbar'

export interface EditorProps {
  /**
   * Placeholder text when editor is empty
   */
  placeholder?: string
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
   * Whether to auto focus the editor on mount
   */
  autoFocus?: boolean
  /**
   * Additional class names for the root container
   */
  className?: string
  /**
   * Error handler
   */
  onError?: (error: Error) => void
  /**
   * Whether to show the toolbar
   */
  showToolbar?: boolean
}

/**
 * A fully-featured rich text editor built with Lexical.
 *
 * For more control, use the individual components:
 * - `EditorRoot` - Root component with providers
 * - `EditorToolbar` - Toolbar container
 * - `EditorContent` - Content area
 * - `HistoryButtons`, `FormatButtons`, `BlockFormatDropdown`, `AlignDropdown` - Toolbar components
 *
 * @example
 * ```tsx
 * // Simple usage
 * <Editor placeholder="Start writing..." />
 *
 * // With initial content
 * <Editor
 *   initialState={jsonString}
 *   placeholder="Continue writing..."
 * />
 * ```
 */
export function Editor({
  placeholder = 'Start writing...',
  nodes,
  theme,
  namespace = 'editor',
  initialState,
  editable = true,
  autoFocus = true,
  className,
  onError,
  showToolbar = true,
}: EditorProps) {
  return (
    <EditorRoot
      namespace={namespace}
      nodes={nodes}
      theme={theme}
      initialState={initialState}
      editable={editable}
      placeholder={placeholder}
      onError={onError}
      className={className}
    >
      {showToolbar && (
        <EditorToolbar>
          <HistoryButtons />
          <ToolbarSeparator />
          <BlockFormatDropdown />
          <ToolbarSeparator />
          <FormatButtons />
          <ToolbarSeparator />
          <TextFormatDropdown />
          <ToolbarSeparator />
          <FontColorPicker />
          <BackgroundColorPicker />
          <ToolbarSeparator />
          <AlignDropdown />
        </EditorToolbar>
      )}
      <EditorContent
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </EditorRoot>
  )
}
