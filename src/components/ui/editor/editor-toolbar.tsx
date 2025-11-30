'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EditorToolbarProps {
  children: ReactNode
  className?: string
}

export function EditorToolbar({ children, className }: EditorToolbarProps) {
  return (
    <div className={cn('editor-toolbar', className)}>
      {children}
    </div>
  )
}

export function ToolbarSeparator({ className }: { className?: string }) {
  return <div className={cn('editor-toolbar-separator', className)} />
}
