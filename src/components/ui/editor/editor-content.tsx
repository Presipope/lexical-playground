'use client'

import { useEffect, useState, ReactNode, createContext, useContext } from 'react'
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

import { useSharedHistory, useActiveEditor, useEditorConfig, useToolbarState, useFormConfig } from './lib/context'
import { FloatingLinkEditorPlugin } from './plugins/floating-link-editor'
import { FloatingTextFormatToolbarPlugin } from './plugins/floating-text-format-toolbar'
import { DraggableBlockPlugin } from './plugins/draggable-block-plugin'
import { EmojiPickerPlugin } from './plugins/emoji-picker'
import { KeyboardShortcutsPlugin } from './plugins/keyboard-shortcuts'
import { CollapsiblePlugin } from './plugins/collapsible-plugin'
import { LayoutPlugin } from './plugins/layout-plugin'
import { TableActionMenuPlugin } from './plugins/table-action-menu-plugin'
import { TableCellResizerPlugin } from './plugins/table-cell-resizer-plugin'
import { TableHoverActionsPlugin } from './plugins/table-hover-actions-plugin'

// ============================================================================
// ANCHOR CONTEXT - For floating plugins
// ============================================================================

interface AnchorContextValue {
  floatingAnchorElem: HTMLDivElement | null
  isSmallViewport: boolean
}

const AnchorContext = createContext<AnchorContextValue>({
  floatingAnchorElem: null,
  isSmallViewport: false,
})

/**
 * Hook to access the floating anchor element for floating plugins.
 * Must be used within EditorContent.
 */
export function useFloatingAnchor() {
  return useContext(AnchorContext)
}

// ============================================================================
// PLUGIN CONFIGURATION
// ============================================================================

export interface PluginConfig {
  /**
   * Enable history (undo/redo)
   * @default true
   */
  history?: boolean
  /**
   * Enable lists (bullet, numbered)
   * @default true
   */
  list?: boolean
  /**
   * Enable checklists
   * @default true
   */
  checkList?: boolean
  /**
   * Enable links
   * @default true
   */
  link?: boolean
  /**
   * Enable horizontal rule
   * @default true
   */
  horizontalRule?: boolean
  /**
   * Enable tab indentation
   * @default true
   */
  tabIndentation?: boolean
  /**
   * Enable hashtags
   * @default true
   */
  hashtag?: boolean
  /**
   * Enable emoji picker (type :emoji_name)
   * @default true
   */
  emojiPicker?: boolean
  /**
   * Enable keyboard shortcuts
   * @default true
   */
  keyboardShortcuts?: boolean
  /**
   * Enable collapsible blocks
   * @default true
   */
  collapsible?: boolean
  /**
   * Enable column layouts
   * @default true
   */
  layout?: boolean
  /**
   * Enable floating link editor
   * @default true
   */
  floatingLinkEditor?: boolean
  /**
   * Enable floating text format toolbar
   * @default true
   */
  floatingTextFormat?: boolean
  /**
   * Enable draggable blocks
   * @default true
   */
  draggableBlock?: boolean
  /**
   * Enable tables
   * @default true
   */
  table?: boolean
}

const defaultPluginConfig: Required<PluginConfig> = {
  history: true,
  list: true,
  checkList: true,
  link: true,
  horizontalRule: true,
  tabIndentation: true,
  hashtag: true,
  emojiPicker: true,
  keyboardShortcuts: true,
  collapsible: true,
  layout: true,
  floatingLinkEditor: true,
  floatingTextFormat: true,
  draggableBlock: true,
  table: true,
}

// ============================================================================
// EDITOR CONTENT PROPS
// ============================================================================

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
   * Plugin configuration - set to false to use minimal mode (no plugins),
   * or an object to selectively enable/disable plugins.
   * @default "all" - all plugins enabled
   */
  plugins?: 'all' | 'minimal' | PluginConfig
  /**
   * Additional plugins/components to render inside the editor.
   * These will be rendered after the built-in plugins.
   */
  children?: ReactNode
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

/**
 * The main content area of the editor.
 *
 * @example
 * ```tsx
 * // Full-featured (default)
 * <EditorContent placeholder="Start writing..." />
 *
 * // Minimal - no plugins, add your own
 * <EditorContent plugins="minimal">
 *   <HistoryPlugin />
 *   <ListPlugin />
 *   <MyCustomPlugin />
 * </EditorContent>
 *
 * // Selective plugins
 * <EditorContent plugins={{ table: false, hashtag: false }}>
 *   <MyCustomPlugin />
 * </EditorContent>
 * ```
 */
export function EditorContent({
  placeholder: placeholderProp,
  autoFocus = true,
  className = '',
  plugins = 'all',
  children,
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
  const formConfig = useFormConfig()
  const isEditable = useLexicalEditable()

  const placeholder = placeholderProp ?? config.placeholder ?? 'Start writing...'

  // Build accessibility props for the ContentEditable
  const contentEditableProps: Record<string, unknown> = {
    className: 'editor-input',
  }

  // Add form-related accessibility attributes
  if (formConfig.id) contentEditableProps.id = formConfig.id
  if (formConfig.name) contentEditableProps['data-name'] = formConfig.name
  if (formConfig['aria-label']) contentEditableProps['aria-label'] = formConfig['aria-label']
  if (formConfig['aria-labelledby']) contentEditableProps['aria-labelledby'] = formConfig['aria-labelledby']
  if (formConfig['aria-describedby']) contentEditableProps['aria-describedby'] = formConfig['aria-describedby']
  if (formConfig['aria-invalid']) contentEditableProps['aria-invalid'] = formConfig['aria-invalid']
  if (formConfig['aria-required']) contentEditableProps['aria-required'] = formConfig['aria-required']
  if (formConfig.required) contentEditableProps['aria-required'] = true
  if (formConfig.disabled) contentEditableProps['aria-disabled'] = true

  // Resolve plugin configuration
  const pluginConfig: Required<PluginConfig> = plugins === 'all'
    ? defaultPluginConfig
    : plugins === 'minimal'
      ? Object.fromEntries(Object.keys(defaultPluginConfig).map(k => [k, false])) as Required<PluginConfig>
      : { ...defaultPluginConfig, ...plugins }

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

  const anchorContextValue: AnchorContextValue = {
    floatingAnchorElem,
    isSmallViewport,
  }

  return (
    <AnchorContext.Provider value={anchorContextValue}>
      <div className={`editor-container ${className}`}>
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor-input-wrapper" ref={onRef}>
                <ContentEditable {...contentEditableProps} />
              </div>
            </div>
          }
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Core plugins - conditionally rendered */}
        {pluginConfig.history && <HistoryPlugin externalHistoryState={historyState} />}
        {pluginConfig.list && <ListPlugin />}
        {pluginConfig.checkList && <CheckListPlugin />}
        {pluginConfig.link && <LinkPlugin />}
        {pluginConfig.link && <ClickableLinkPlugin disabled={isEditable} />}
        {pluginConfig.horizontalRule && <HorizontalRulePlugin />}
        {pluginConfig.tabIndentation && <TabIndentationPlugin maxIndent={maxIndent} />}
        {pluginConfig.hashtag && <HashtagPlugin />}
        <ClearEditorPlugin />
        {pluginConfig.emojiPicker && <EmojiPickerPlugin />}
        {pluginConfig.keyboardShortcuts && <KeyboardShortcutsPlugin />}
        {pluginConfig.collapsible && <CollapsiblePlugin />}
        {pluginConfig.layout && <LayoutPlugin />}

        {/* Floating plugins */}
        {pluginConfig.floatingLinkEditor && floatingAnchorElem && (
          <FloatingLinkEditorPlugin
            anchorElem={floatingAnchorElem}
            isLinkEditMode={isLinkEditMode}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        )}

        {pluginConfig.floatingTextFormat && floatingAnchorElem && (
          <FloatingTextFormatToolbarPlugin
            anchorElem={floatingAnchorElem}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        )}

        {pluginConfig.draggableBlock && floatingAnchorElem && !isSmallViewport && (
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        )}

        {/* Auto focus */}
        {autoFocus && <AutoFocusPlugin />}

        {/* Table plugins */}
        {pluginConfig.table && (
          <>
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
              hasHorizontalScroll={tableHorizontalScroll}
            />
            <TableCellResizerPlugin />
            {floatingAnchorElem && (
              <>
                <TableActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={tableCellMerge}
                />
                <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
              </>
            )}
          </>
        )}

        {/* Custom plugins passed as children */}
        {children}
      </div>
    </AnchorContext.Provider>
  )
}

// ============================================================================
// PLUGIN BUNDLES - For composable usage
// ============================================================================

export interface CorePluginsProps {
  maxIndent?: number
}

/**
 * Core plugins bundle: history, lists, links, horizontal rule, tabs, hashtags.
 * Use this when building a custom editor with EditorContent plugins="minimal".
 */
export function CorePlugins({ maxIndent = 7 }: CorePluginsProps) {
  const { historyState } = useSharedHistory()
  const isEditable = useLexicalEditable()

  return (
    <>
      <HistoryPlugin externalHistoryState={historyState} />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <ClickableLinkPlugin disabled={isEditable} />
      <HorizontalRulePlugin />
      <TabIndentationPlugin maxIndent={maxIndent} />
      <HashtagPlugin />
      <ClearEditorPlugin />
    </>
  )
}

export interface TablePluginsProps {
  horizontalScroll?: boolean
  cellMerge?: boolean
  cellBackgroundColor?: boolean
}

/**
 * Table plugins bundle: table, cell resizer, action menu, hover actions.
 * Use this when building a custom editor with EditorContent plugins="minimal".
 */
export function TablePlugins({
  horizontalScroll = true,
  cellMerge = true,
  cellBackgroundColor = true,
}: TablePluginsProps) {
  const { floatingAnchorElem } = useFloatingAnchor()

  return (
    <>
      <TablePlugin
        hasCellMerge={cellMerge}
        hasCellBackgroundColor={cellBackgroundColor}
        hasHorizontalScroll={horizontalScroll}
      />
      <TableCellResizerPlugin />
      {floatingAnchorElem && (
        <>
          <TableActionMenuPlugin
            anchorElem={floatingAnchorElem}
            cellMerge={cellMerge}
          />
          <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
        </>
      )}
    </>
  )
}

/**
 * Floating UI plugins bundle: link editor, text format toolbar, draggable blocks.
 * Use this when building a custom editor with EditorContent plugins="minimal".
 */
export function FloatingPlugins() {
  const { floatingAnchorElem, isSmallViewport } = useFloatingAnchor()
  const { isLinkEditMode, setIsLinkEditMode } = useToolbarState()

  if (!floatingAnchorElem) return null

  return (
    <>
      <FloatingLinkEditorPlugin
        anchorElem={floatingAnchorElem}
        isLinkEditMode={isLinkEditMode}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      <FloatingTextFormatToolbarPlugin
        anchorElem={floatingAnchorElem}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      {!isSmallViewport && (
        <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
      )}
    </>
  )
}

/**
 * Enhancement plugins bundle: emoji picker, keyboard shortcuts, collapsible, layout.
 * Use this when building a custom editor with EditorContent plugins="minimal".
 */
export function EnhancementPlugins() {
  return (
    <>
      <EmojiPickerPlugin />
      <KeyboardShortcutsPlugin />
      <CollapsiblePlugin />
      <LayoutPlugin />
    </>
  )
}
