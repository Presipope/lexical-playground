'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $insertNodes,
  $getSelection,
  EditorState,
  BLUR_COMMAND,
  FOCUS_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { mergeRegister } from '@lexical/utils'

export type EditorOutputFormat = 'json' | 'html' | 'text'

export interface OnChangePluginProps {
  /**
   * Callback when the editor content changes.
   * For controlled mode, use with the `value` prop.
   *
   * @param value - The serialized editor content
   * @param editorState - The raw Lexical EditorState for advanced use cases
   */
  onChange?: (value: string, editorState: EditorState) => void
  /**
   * Controlled value - when provided, the editor will sync to this value.
   * Should be a JSON string of the editor state.
   */
  value?: string
  /**
   * Output format for the onChange callback.
   * - 'json': Lexical JSON state (default, recommended for forms)
   * - 'html': HTML string
   * - 'text': Plain text content
   * @default 'json'
   */
  outputFormat?: EditorOutputFormat
  /**
   * Callback when the editor loses focus.
   * Useful for form validation (e.g., react-hook-form's onBlur mode).
   */
  onBlur?: (event: FocusEvent, value: string) => void
  /**
   * Callback when the editor gains focus.
   */
  onFocus?: (event: FocusEvent) => void
  /**
   * Whether to ignore selection-only changes for onChange.
   * When true, onChange only fires when content actually changes.
   * @default true
   */
  ignoreSelectionChange?: boolean
}

/**
 * Plugin that provides controlled/uncontrolled value management and form integration.
 *
 * This plugin enables the editor to work seamlessly with form libraries like
 * react-hook-form, Formik, or TanStack Form.
 *
 * @example
 * ```tsx
 * // Uncontrolled with onChange
 * <EditorContent>
 *   <OnChangePlugin onChange={(value) => console.log(value)} />
 * </EditorContent>
 *
 * // Controlled mode
 * const [value, setValue] = useState('')
 * <EditorContent>
 *   <OnChangePlugin value={value} onChange={setValue} />
 * </EditorContent>
 *
 * // With react-hook-form
 * const { register, handleSubmit } = useForm()
 * <Controller
 *   name="content"
 *   control={control}
 *   render={({ field }) => (
 *     <EditorContent>
 *       <OnChangePlugin
 *         value={field.value}
 *         onChange={field.onChange}
 *         onBlur={(e) => field.onBlur()}
 *       />
 *     </EditorContent>
 *   )}
 * />
 * ```
 */
export function OnChangePlugin({
  onChange,
  value,
  outputFormat = 'json',
  onBlur,
  onFocus,
  ignoreSelectionChange = true,
}: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext()
  const isInternalUpdate = useRef(false)
  const prevValue = useRef<string | undefined>(value)

  // Helper to get content in the specified format
  const getContent = useCallback(
    (editorState: EditorState): string => {
      let content = ''
      editorState.read(() => {
        switch (outputFormat) {
          case 'html':
            content = $generateHtmlFromNodes(editor)
            break
          case 'text':
            content = $getRoot().getTextContent()
            break
          case 'json':
          default:
            content = JSON.stringify(editorState.toJSON())
            break
        }
      })
      return content
    },
    [editor, outputFormat]
  )

  // Handle onChange
  useEffect(() => {
    if (!onChange) return

    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
        // Skip if this is our own update from setting controlled value
        if (isInternalUpdate.current) {
          isInternalUpdate.current = false
          return
        }

        // Skip selection-only changes if configured
        if (ignoreSelectionChange && dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return
        }

        const content = getContent(editorState)
        onChange(content, editorState)
      }
    )
  }, [editor, onChange, getContent, ignoreSelectionChange])

  // Handle controlled value updates
  useEffect(() => {
    // Only handle controlled mode when value is provided
    if (value === undefined) return

    // Skip if value hasn't changed from what we last set
    if (prevValue.current === value) return

    // CRITICAL: Check if current editor state already matches incoming value
    // This prevents cursor position loss when form state updates after user typing
    const currentContent = getContent(editor.getEditorState())
    if (currentContent === value) {
      prevValue.current = value
      return // Skip update - editor already has this content
    }

    prevValue.current = value

    // Empty value means clear the editor
    if (!value || value === '' || value === '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}') {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
        },
        { tag: 'controlled-value-update' }
      )
      return
    }

    // Try to parse as JSON first (most common for controlled mode)
    try {
      const parsedState = JSON.parse(value)

      // Validate that it looks like a Lexical state
      if (parsedState && typeof parsedState === 'object' && parsedState.root) {
        isInternalUpdate.current = true
        const editorState = editor.parseEditorState(parsedState)
        editor.setEditorState(editorState)
        return
      }
    } catch {
      // Not JSON, try HTML
    }

    // Try HTML parsing
    if (value.startsWith('<') || value.includes('<')) {
      try {
        isInternalUpdate.current = true
        editor.update(
          () => {
            const root = $getRoot()
            root.clear()

            const parser = new DOMParser()
            const dom = parser.parseFromString(value, 'text/html')
            const nodes = $generateNodesFromDOM(editor, dom)

            if (nodes.length > 0) {
              $getRoot().selectStart()
              $insertNodes(nodes)
            }
          },
          { tag: 'controlled-value-update' }
        )
        return
      } catch {
        // HTML parsing failed
      }
    }

    // Fallback: treat as plain text
    isInternalUpdate.current = true
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()
        const selection = $getSelection()
        if (selection) {
          selection.insertText(value)
        }
      },
      { tag: 'controlled-value-update' }
    )
  }, [editor, value, getContent])

  // Handle blur and focus events
  useEffect(() => {
    if (!onBlur && !onFocus) return

    return mergeRegister(
      editor.registerCommand(
        BLUR_COMMAND,
        (event) => {
          if (onBlur) {
            const content = getContent(editor.getEditorState())
            onBlur(event, content)
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        FOCUS_COMMAND,
        (event) => {
          if (onFocus) {
            onFocus(event)
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, onBlur, onFocus, getContent])

  return null
}

export default OnChangePlugin
