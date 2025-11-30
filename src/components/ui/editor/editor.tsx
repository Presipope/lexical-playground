'use client'

import type { Klass, LexicalNode, EditorThemeClasses, EditorState } from 'lexical'
import { cn } from '@/lib/utils'

import { EditorRoot } from './editor-root'
import { EditorToolbar, ToolbarSeparator } from './editor-toolbar'
import { EditorContent } from './editor-content'
import { HistoryButtons, FormatButtons, BlockFormatDropdown, AlignDropdown, TextFormatDropdown, FontColorPicker, BackgroundColorPicker, InsertDropdown } from './toolbar'
import type { EditorOutputFormat } from './plugins/on-change-plugin'

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
   * Initial editor state (JSON string or callback).
   * For uncontrolled usage. Use `value` for controlled mode.
   */
  initialState?: string | (() => void)
  /**
   * Whether the editor is editable.
   * Note: `disabled` prop takes precedence over this.
   * @default true
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
   * // With react-hook-form
   * <Controller
   *   name="content"
   *   control={control}
   *   render={({ field }) => (
   *     <Editor
   *       value={field.value}
   *       onChange={field.onChange}
   *       onBlur={(e) => field.onBlur()}
   *     />
   *   )}
   * />
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

/**
 * A fully-featured rich text editor built with Lexical.
 *
 * Supports form integration out of the box with props like:
 * - `value`/`onChange` for controlled mode
 * - `defaultValue` for uncontrolled mode
 * - `disabled`, `readOnly`, `required` for form state
 * - `name`, `id` for form identification
 * - `onBlur`, `onFocus` for validation triggers
 * - `aria-*` props for accessibility
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
 * // With initial content (uncontrolled)
 * <Editor
 *   defaultValue={jsonString}
 *   placeholder="Continue writing..."
 * />
 *
 * // Controlled mode with form library
 * <Editor
 *   value={formValue}
 *   onChange={setFormValue}
 *   onBlur={(e, value) => validateField(value)}
 *   disabled={isSubmitting}
 *   aria-invalid={!!error}
 *   aria-describedby="error-message"
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
  // Form integration props
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  outputFormat,
  name,
  id,
  disabled,
  readOnly,
  required,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: EditorProps) {
  // Disable autoFocus when disabled
  const shouldAutoFocus = disabled ? false : autoFocus

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
      // Form props
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      outputFormat={outputFormat}
      name={name}
      id={id}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
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
          <ToolbarSeparator />
          <InsertDropdown />
        </EditorToolbar>
      )}
      <EditorContent
        placeholder={placeholder}
        autoFocus={shouldAutoFocus}
      />
    </EditorRoot>
  )
}
