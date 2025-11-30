'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import { ChevronDown } from 'lucide-react'
import { ThemeColorPicker } from '../ui/theme-color-picker'

export function FontColorPicker() {
  const [editor] = useLexicalComposerContext()
  const [fontColor, setFontColor] = useState('var(--color-foreground)')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update color from selection
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const color = $getSelectionStyleValueForProperty(selection, 'color', '')
            setFontColor(color || 'var(--color-foreground)')
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
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { color: color || null })
        }
      })
      setFontColor(color || 'var(--color-foreground)')
    },
    [editor]
  )

  return (
    <div className="color-picker-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="editor-toolbar-item editor-toolbar-button color-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Font color"
        title="Font color"
      >
        <span className="color-picker-icon font-color-icon">
          A
          <span
            className="color-picker-indicator"
            style={{ backgroundColor: fontColor }}
          />
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <div className="color-picker-dropdown-content">
          <ThemeColorPicker
            color={fontColor}
            onChange={applyColor}
            onClose={() => setIsOpen(false)}
            mode="text"
            showClearButton={true}
          />
        </div>
      )}
    </div>
  )
}
