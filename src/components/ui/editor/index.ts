// Main editor component with sensible defaults
export { Editor } from './editor'
export type { EditorProps } from './editor'

// Composable editor components
export { EditorRoot } from './editor-root'
export type { EditorRootProps } from './editor-root'

export { EditorToolbar, ToolbarSeparator } from './editor-toolbar'
export type { EditorToolbarProps } from './editor-toolbar'

export { EditorContent } from './editor-content'
export type { EditorContentProps } from './editor-content'

// Toolbar components
export { HistoryButtons, FormatButtons, BlockFormatDropdown, AlignDropdown } from './toolbar'
export type { HistoryButtonsProps } from './toolbar/history-buttons'
export type { FormatButtonsProps } from './toolbar/format-buttons'
export type { BlockFormatDropdownProps } from './toolbar/block-format'
export type { AlignDropdownProps } from './toolbar/align-dropdown'

// Context hooks
export {
  useEditorConfig,
  useSharedHistory,
  useToolbarState,
  useActiveEditor,
  useModal,
  useFlashMessage,
} from './lib/context'

// Theme
export { editorTheme } from './lib/theme'
