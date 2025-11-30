'use client'

import type { ReactNode } from 'react'
import type { Klass, LexicalNode, EditorThemeClasses, EditorState } from 'lexical'
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
  FormProvider,
  type EditorConfig,
  type FormConfig,
} from './lib/context'
import { editorTheme } from './lib/theme'
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  LayoutContainerNode,
  LayoutItemNode,
} from './nodes'
import { OnChangePlugin, type EditorOutputFormat } from './plugins/on-change-plugin'
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
   * Initial editor state (JSON string or callback).
   * For uncontrolled usage. Use `value` for controlled mode.
   * @see value
   */
  initialState?: string | (() => void)
  /**
   * Whether the editor is editable.
   * Note: `disabled` prop takes precedence over this.
   * @default true
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

  // ==========================================================================
  // Form Integration Props
  // ==========================================================================

  /**
   * Controlled value - the editor content as a serialized string.
   * When provided, the editor operates in controlled mode.
   * Use with `onChange` to update the value.
   *
   * @example
   * ```tsx
   * const [value, setValue] = useState('')
   * <EditorRoot value={value} onChange={setValue}>...</EditorRoot>
   * ```
   */
  value?: string
  /**
   * Default value for uncontrolled mode.
   * Alias for `initialState` for familiar form API.
   */
  defaultValue?: string
  /**
   * Callback when the editor content changes.
   * The value format depends on `outputFormat` (default: 'json').
   *
   * @param value - The serialized editor content
   * @param editorState - The raw Lexical EditorState for advanced use cases
   */
  onChange?: (value: string, editorState: EditorState) => void
  /**
   * Callback when the editor loses focus.
   * Useful for form validation (e.g., react-hook-form's onBlur mode).
   *
   * @param event - The blur event
   * @param value - The current editor content
   */
  onBlur?: (event: FocusEvent, value: string) => void
  /**
   * Callback when the editor gains focus.
   */
  onFocus?: (event: FocusEvent) => void
  /**
   * Output format for the onChange/onBlur callbacks.
   * - 'json': Lexical JSON state (default, recommended for forms)
   * - 'html': HTML string
   * - 'text': Plain text content
   * @default 'json'
   */
  outputFormat?: EditorOutputFormat
  /**
   * Name attribute for form submission.
   * Used by form libraries to identify the field.
   */
  name?: string
  /**
   * ID for associating with a label element.
   * Enables clicking the label to focus the editor.
   */
  id?: string
  /**
   * Whether the editor is disabled.
   * Disabled editors cannot be edited and appear visually disabled.
   * Takes precedence over `editable`.
   */
  disabled?: boolean
  /**
   * Whether the editor is read-only.
   * Read-only editors can be selected/copied but not edited.
   * Differs from disabled in that it doesn't affect visual appearance.
   */
  readOnly?: boolean
  /**
   * Whether the field is required for form submission.
   */
  required?: boolean
  /**
   * aria-label for accessibility.
   * Use when no visible label is present.
   */
  'aria-label'?: string
  /**
   * aria-labelledby for accessibility.
   * Reference the ID of an element that labels the editor.
   */
  'aria-labelledby'?: string
  /**
   * aria-describedby for accessibility.
   * Reference the ID of an element that describes the editor (e.g., error message).
   */
  'aria-describedby'?: string
  /**
   * aria-invalid for form validation.
   * Set to true when the editor content is invalid.
   */
  'aria-invalid'?: boolean
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
  // Form integration props
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  outputFormat = 'json',
  name,
  id,
  disabled,
  readOnly,
  required,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: EditorRootProps) {
  // Disabled takes precedence over editable
  // readOnly also makes it non-editable
  const isEditable = disabled ? false : (readOnly ? false : editable)

  // Use defaultValue as initialState if provided (familiar form API)
  const resolvedInitialState = initialState ?? defaultValue

  const initialConfig = {
    namespace,
    nodes: [...defaultNodes, ...nodes],
    theme: theme || editorTheme,
    editorState: resolvedInitialState,
    editable: isEditable,
    onError: onError || ((error: Error) => console.error(error)),
  }

  const editorConfig: EditorConfig = {
    namespace,
    placeholder,
    editable: isEditable,
    onError,
  }

  const formConfig: FormConfig = {
    name,
    id,
    required,
    disabled,
    readOnly,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': required,
  }

  // Determine if we should show the OnChangePlugin
  const hasFormHandlers = onChange || onBlur || onFocus || value !== undefined

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorConfigProvider config={editorConfig}>
        <FormProvider config={formConfig}>
          <SharedHistoryProvider>
            <ToolbarProvider>
              <ActiveEditorProvider>
                <ModalProvider>
                  <FlashMessageProvider>
                    <div
                      className={`editor-shell ${disabled ? 'editor-disabled' : ''} ${className}`}
                      data-disabled={disabled || undefined}
                      data-readonly={readOnly || undefined}
                    >
                      {children}
                      {/* OnChangePlugin is rendered here to ensure it's always present for form integration */}
                      {hasFormHandlers && (
                        <OnChangePlugin
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          onFocus={onFocus}
                          outputFormat={outputFormat}
                        />
                      )}
                    </div>
                  </FlashMessageProvider>
                </ModalProvider>
              </ActiveEditorProvider>
            </ToolbarProvider>
          </SharedHistoryProvider>
        </FormProvider>
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
