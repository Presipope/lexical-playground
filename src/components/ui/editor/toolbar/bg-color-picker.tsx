'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import { ChevronDown, PaintBucket } from 'lucide-react'
import { ColorPicker } from '../ui/color-picker'

export function BackgroundColorPicker() {
  const [editor] = useLexicalComposerContext()
  const [bgColor, setBgColor] = useState('#ffffff')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update color from selection
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const color = $getSelectionStyleValueForProperty(
              selection,
              'background-color',
              '#ffffff'
            )
            setBgColor(color || '#ffffff')
          }
        })
      })
    )
  }, [editor])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const applyColor = useCallback(
    (color: string, skipHistoryStack: boolean) => {
      editor.update(
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            $patchStyleText(selection, { 'background-color': color })
          }
        },
        skipHistoryStack ? { tag: 'historic' } : {}
      )
    },
    [editor]
  )

  const onColorChange = useCallback(
    (color: string, skipHistoryStack: boolean) => {
      applyColor(color, skipHistoryStack)
    },
    [applyColor]
  )

  return (
    <div className="color-picker-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="editor-toolbar-item editor-toolbar-button color-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Background color"
        title="Background color"
      >
        <span className="color-picker-icon bg-color-icon">
          <PaintBucket className="h-4 w-4" />
          <span
            className="color-picker-indicator"
            style={{ backgroundColor: bgColor }}
          />
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <div className="color-picker-dropdown-content">
          <ColorPicker color={bgColor} onChange={onColorChange} />
        </div>
      )}
    </div>
  )
}
