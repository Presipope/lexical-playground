'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { Undo2, Redo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HistoryButtonsProps {
  className?: string
}

export function HistoryButtons({ className }: HistoryButtonsProps) {
  const [editor] = useLexicalComposerContext()
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable)
      }),
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor])

  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  }, [editor])

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  }, [editor])

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <button
        type="button"
        disabled={!canUndo || !isEditable}
        onClick={handleUndo}
        className="editor-toolbar-item editor-toolbar-button"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!canRedo || !isEditable}
        onClick={handleRedo}
        className="editor-toolbar-item editor-toolbar-button"
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  )
}
