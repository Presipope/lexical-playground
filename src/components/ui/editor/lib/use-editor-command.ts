'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'

/**
 * Hook for creating custom toolbar buttons that dispatch Lexical commands.
 *
 * @param command - The Lexical command to dispatch
 * @param payload - The payload to send with the command
 * @returns Object with isEditable state and dispatch function
 *
 * @example
 * ```tsx
 * function MyInsertButton() {
 *   const { isEditable, dispatch } = useEditorCommand(
 *     INSERT_IMAGE_COMMAND,
 *     { src: '/placeholder.png' }
 *   )
 *
 *   return (
 *     <button disabled={!isEditable} onClick={dispatch}>
 *       Insert Image
 *     </button>
 *   )
 * }
 * ```
 */
export function useEditorCommand<T>(
  command: LexicalCommand<T>,
  payload: T
) {
  const [editor] = useLexicalComposerContext()
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable)
    })
  }, [editor])

  const dispatch = useCallback(() => {
    editor.dispatchCommand(command, payload)
  }, [editor, command, payload])

  return { isEditable, dispatch, editor }
}

/**
 * Hook for creating custom format buttons that track active state.
 *
 * @param format - The text format to toggle (bold, italic, etc.)
 * @returns Object with isActive, isEditable states and toggle function
 *
 * @example
 * ```tsx
 * function MyBoldButton() {
 *   const { isActive, isEditable, toggle } = useTextFormat('bold')
 *
 *   return (
 *     <button
 *       disabled={!isEditable}
 *       onClick={toggle}
 *       className={isActive ? 'active' : ''}
 *     >
 *       Bold
 *     </button>
 *   )
 * }
 * ```
 */
export function useTextFormat(
  format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'subscript' | 'superscript' | 'highlight'
) {
  const [editor] = useLexicalComposerContext()
  const [isActive, setIsActive] = useState(false)
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  const updateState = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsActive(selection.hasFormat(format))
    }
  }, [format])

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable)
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateState()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateState()
        })
      })
    )
  }, [editor, updateState])

  const toggle = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }, [editor, format])

  return { isActive, isEditable, toggle, editor }
}

/**
 * Hook for getting the current editor instance and editable state.
 *
 * @returns Object with editor instance and isEditable state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { editor, isEditable } = useEditor()
 *
 *   const handleClick = () => {
 *     editor.update(() => {
 *       // Make updates to the editor state
 *     })
 *   }
 *
 *   return <button disabled={!isEditable} onClick={handleClick}>Update</button>
 * }
 * ```
 */
export function useEditor() {
  const [editor] = useLexicalComposerContext()
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable)
    })
  }, [editor])

  return { editor, isEditable }
}

/**
 * Hook for registering a custom Lexical command handler.
 *
 * @param command - The command to register
 * @param handler - The handler function
 * @param priority - Command priority (default: COMMAND_PRIORITY_CRITICAL)
 *
 * @example
 * ```tsx
 * function MyPlugin() {
 *   useCommandListener(INSERT_IMAGE_COMMAND, (payload) => {
 *     // Handle the command
 *     console.log('Inserting image:', payload)
 *     return true // Return true to stop propagation
 *   })
 *
 *   return null
 * }
 * ```
 */
export function useCommandListener<T>(
  command: LexicalCommand<T>,
  handler: (payload: T) => boolean,
  priority: 0 | 1 | 2 | 3 | 4 = COMMAND_PRIORITY_CRITICAL
) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(command, handler, priority)
  }, [editor, command, handler, priority])
}
