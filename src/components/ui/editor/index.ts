// =============================================================================
// MAIN EDITOR COMPONENT
// =============================================================================

// The "kitchen sink" editor with all features enabled
export { Editor } from './editor'
export type { EditorProps } from './editor'

// =============================================================================
// COMPOSABLE EDITOR COMPONENTS
// =============================================================================

// Root wrapper - provides all context providers and Lexical setup
export { EditorRoot } from './editor-root'
export type { EditorRootProps } from './editor-root'

// Toolbar container
export { EditorToolbar, ToolbarSeparator } from './editor-toolbar'
export type { EditorToolbarProps } from './editor-toolbar'

// Content area with configurable plugins
export {
  EditorContent,
  CorePlugins,
  TablePlugins,
  FloatingPlugins,
  EnhancementPlugins,
  useFloatingAnchor,
} from './editor-content'
export type { EditorContentProps, PluginConfig, CorePluginsProps, TablePluginsProps } from './editor-content'

// =============================================================================
// TOOLBAR COMPONENTS
// =============================================================================

export { HistoryButtons } from './toolbar/history-buttons'
export type { HistoryButtonsProps } from './toolbar/history-buttons'

export { FormatButtons } from './toolbar/format-buttons'
export type { FormatButtonsProps } from './toolbar/format-buttons'

export { BlockFormatDropdown } from './toolbar/block-format'
export type { BlockFormatDropdownProps } from './toolbar/block-format'

export { AlignDropdown } from './toolbar/align-dropdown'
export type { AlignDropdownProps } from './toolbar/align-dropdown'

export { TextFormatDropdown } from './toolbar/text-format-dropdown'
export type { TextFormatDropdownProps } from './toolbar/text-format-dropdown'

export { FontColorPicker } from './toolbar/font-color-picker'
export { BackgroundColorPicker } from './toolbar/bg-color-picker'

// Insert dropdown and composable items
export {
  InsertDropdown,
  InsertItem,
  InsertHorizontalRule,
  InsertTable,
  InsertColumns,
  InsertCollapsible,
  InsertSeparator,
} from './toolbar/insert-dropdown'
export type {
  InsertDropdownProps,
  InsertItemProps,
  InsertHorizontalRuleProps,
  InsertTableProps,
  InsertColumnsProps,
  InsertCollapsibleProps,
  InsertSeparatorProps,
} from './toolbar/insert-dropdown'

// =============================================================================
// PLUGINS
// =============================================================================

// Individual plugins for custom editor composition
export {
  // Form integration
  OnChangePlugin,
  // Collapsible
  CollapsiblePlugin,
  INSERT_COLLAPSIBLE_COMMAND,
  // Draggable
  DraggableBlockPlugin,
  // Emoji
  EmojiPickerPlugin,
  // Floating editors
  FloatingLinkEditorPlugin,
  FloatingTextFormatToolbarPlugin,
  // Keyboard shortcuts
  KeyboardShortcutsPlugin,
  // Layout
  LayoutPlugin,
  INSERT_LAYOUT_COMMAND,
  UPDATE_LAYOUT_COMMAND,
  // Table plugins
  TableActionMenuPlugin,
  TableCellResizerPlugin,
  TableHoverActionsPlugin,
} from './plugins'

export type { OnChangePluginProps, EditorOutputFormat } from './plugins'

// =============================================================================
// NODES
// =============================================================================

// Custom nodes for extending the editor
export {
  CollapsibleContainerNode,
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleTitleNode,
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
  CollapsibleContentNode,
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  LayoutContainerNode,
  $createLayoutContainerNode,
  $isLayoutContainerNode,
  LayoutItemNode,
  $createLayoutItemNode,
  $isLayoutItemNode,
} from './nodes'

// =============================================================================
// UI COMPONENTS
// =============================================================================

export { ColorPicker } from './ui/color-picker'

// =============================================================================
// CONTEXT HOOKS
// =============================================================================

export {
  useEditorConfig,
  useSharedHistory,
  useToolbarState,
  useActiveEditor,
  useModal,
  useFlashMessage,
  useFormConfig,
} from './lib/context'

export type { FormConfig } from './lib/context'

// =============================================================================
// UTILITY HOOKS
// =============================================================================

export {
  useEditorCommand,
  useTextFormat,
  useEditor,
  useCommandListener,
  useEditorValue,
} from './lib/use-editor-command'

export type {
  EditorValueFormat,
  UseEditorValueOptions,
  UseEditorValueResult,
} from './lib/use-editor-command'

// =============================================================================
// THEME
// =============================================================================

export { editorTheme } from './lib/theme'
