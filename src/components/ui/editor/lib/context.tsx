'use client'

import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin'
import type { LexicalEditor } from 'lexical'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin'

// ============================================================================
// Editor Config Context - For passing configuration to editor components
// ============================================================================

export interface EditorConfig {
  namespace: string
  placeholder?: string
  editable?: boolean
  onError?: (error: Error) => void
}

// ============================================================================
// Form Context - For form integration and accessibility
// ============================================================================

export interface FormConfig {
  /**
   * Name attribute for form submission
   */
  name?: string
  /**
   * ID for associating with a label element
   */
  id?: string
  /**
   * Whether the field is required
   */
  required?: boolean
  /**
   * Whether the field is disabled (maps to editable=false in Lexical)
   */
  disabled?: boolean
  /**
   * aria-label for accessibility
   */
  'aria-label'?: string
  /**
   * aria-labelledby for accessibility
   */
  'aria-labelledby'?: string
  /**
   * aria-describedby for accessibility - useful for error messages
   */
  'aria-describedby'?: string
  /**
   * aria-invalid for form validation
   */
  'aria-invalid'?: boolean
  /**
   * aria-required for accessibility
   */
  'aria-required'?: boolean
  /**
   * Whether the editor is read-only (content can be selected/copied but not edited)
   */
  readOnly?: boolean
}

const FormContext = createContext<FormConfig>({})

export function FormProvider({
  children,
  config,
}: {
  children: ReactNode
  config: FormConfig
}) {
  return <FormContext.Provider value={config}>{children}</FormContext.Provider>
}

/**
 * Hook to access form configuration within the editor.
 * Returns form props like name, id, required, disabled, and aria-* attributes.
 */
export function useFormConfig() {
  return useContext(FormContext)
}

const EditorConfigContext = createContext<EditorConfig | null>(null)

export function EditorConfigProvider({
  children,
  config,
}: {
  children: ReactNode
  config: EditorConfig
}) {
  return (
    <EditorConfigContext.Provider value={config}>
      {children}
    </EditorConfigContext.Provider>
  )
}

export function useEditorConfig() {
  const context = useContext(EditorConfigContext)
  if (!context) {
    throw new Error('useEditorConfig must be used within an EditorConfigProvider')
  }
  return context
}

// ============================================================================
// Shared History Context - For undo/redo across nested editors
// ============================================================================

interface SharedHistoryContextValue {
  historyState: HistoryState
}

const SharedHistoryContext = createContext<SharedHistoryContextValue>({
  historyState: createEmptyHistoryState(),
})

export function SharedHistoryProvider({ children }: { children: ReactNode }) {
  const historyContext = useMemo(
    () => ({ historyState: createEmptyHistoryState() }),
    []
  )

  return (
    <SharedHistoryContext.Provider value={historyContext}>
      {children}
    </SharedHistoryContext.Provider>
  )
}

export function useSharedHistory() {
  return useContext(SharedHistoryContext)
}

// ============================================================================
// Toolbar State Context - For tracking formatting state
// ============================================================================

export interface ToolbarState {
  // Text formatting
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  isCode: boolean
  isHighlight: boolean
  isLink: boolean

  // Text case
  isLowercase: boolean
  isUppercase: boolean
  isCapitalize: boolean

  // Block type
  blockType: 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'bullet' | 'number' | 'check' | 'quote' | 'code'
  rootType: 'root' | 'table'

  // Styling
  fontFamily: string
  fontSize: string
  fontColor: string
  bgColor: string
  elementFormat: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end' | ''

  // Code block
  codeLanguage: string
  codeTheme: string

  // Editor state
  canUndo: boolean
  canRedo: boolean
  isRTL: boolean
  isImageCaption: boolean
}

const initialToolbarState: ToolbarState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isCode: false,
  isHighlight: false,
  isLink: false,
  isLowercase: false,
  isUppercase: false,
  isCapitalize: false,
  blockType: 'paragraph',
  rootType: 'root',
  fontFamily: 'Arial',
  fontSize: '15px',
  fontColor: '#000',
  bgColor: '#fff',
  elementFormat: 'left',
  codeLanguage: '',
  codeTheme: '',
  canUndo: false,
  canRedo: false,
  isRTL: false,
  isImageCaption: false,
}

interface ToolbarContextValue {
  toolbarState: ToolbarState
  updateToolbarState: <K extends keyof ToolbarState>(
    key: K,
    value: ToolbarState[K]
  ) => void
  isLinkEditMode: boolean
  setIsLinkEditMode: Dispatch<SetStateAction<boolean>>
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null)

export function ToolbarProvider({ children }: { children: ReactNode }) {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(initialToolbarState)
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)

  const updateToolbarState = useCallback(
    <K extends keyof ToolbarState>(key: K, value: ToolbarState[K]) => {
      setToolbarState((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const value = useMemo(
    () => ({ toolbarState, updateToolbarState, isLinkEditMode, setIsLinkEditMode }),
    [toolbarState, updateToolbarState, isLinkEditMode]
  )

  return (
    <ToolbarContext.Provider value={value}>
      {children}
    </ToolbarContext.Provider>
  )
}

export function useToolbarState() {
  const context = useContext(ToolbarContext)
  if (!context) {
    throw new Error('useToolbarState must be used within a ToolbarProvider')
  }
  return context
}

// ============================================================================
// Active Editor Context - For tracking nested/active editor
// ============================================================================

interface ActiveEditorContextValue {
  activeEditor: LexicalEditor | null
  setActiveEditor: Dispatch<SetStateAction<LexicalEditor | null>>
}

const ActiveEditorContext = createContext<ActiveEditorContextValue | null>(null)

export function ActiveEditorProvider({ children }: { children: ReactNode }) {
  const [activeEditor, setActiveEditor] = useState<LexicalEditor | null>(null)

  const value = useMemo(
    () => ({ activeEditor, setActiveEditor }),
    [activeEditor]
  )

  return (
    <ActiveEditorContext.Provider value={value}>
      {children}
    </ActiveEditorContext.Provider>
  )
}

export function useActiveEditor() {
  const context = useContext(ActiveEditorContext)
  if (!context) {
    throw new Error('useActiveEditor must be used within an ActiveEditorProvider')
  }
  return context
}

// ============================================================================
// Modal Context - For managing modal dialogs
// ============================================================================

type ModalContent = ReactNode | ((onClose: () => void) => ReactNode)

interface ModalContextValue {
  showModal: (title: string, content: ModalContent) => void
  closeModal: () => void
}

interface ModalState {
  isOpen: boolean
  title: string
  content: ModalContent | null
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    content: null,
  })

  const showModal = useCallback((title: string, content: ModalContent) => {
    setModalState({ isOpen: true, title, content })
  }, [])

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, title: '', content: null })
  }, [])

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      {modalState.isOpen && (
        <div className="editor-modal-overlay" onClick={closeModal}>
          <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="editor-modal-header">
              <h2 className="editor-modal-title">{modalState.title}</h2>
            </div>
            <div className="editor-modal-content">
              {typeof modalState.content === 'function'
                ? modalState.content(closeModal)
                : modalState.content}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

// ============================================================================
// Flash Message Context - For toast notifications
// ============================================================================

interface FlashMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface FlashMessageContextValue {
  showFlashMessage: (message: string, type?: FlashMessage['type']) => void
}

const FlashMessageContext = createContext<FlashMessageContextValue | null>(null)

export function FlashMessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<FlashMessage[]>([])

  const showFlashMessage = useCallback(
    (message: string, type: FlashMessage['type'] = 'info') => {
      const id = Math.random().toString(36).substring(7)
      setMessages((prev) => [...prev, { id, message, type }])

      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id))
      }, 3000)
    },
    []
  )

  return (
    <FlashMessageContext.Provider value={{ showFlashMessage }}>
      {children}
      {messages.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`px-4 py-2 rounded-theme shadow-lg text-sm animate-in slide-in-from-right ${
                msg.type === 'success'
                  ? 'bg-green-500 text-white'
                  : msg.type === 'error'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-popover text-popover-foreground border border-border'
              }`}
            >
              {msg.message}
            </div>
          ))}
        </div>
      )}
    </FlashMessageContext.Provider>
  )
}

export function useFlashMessage() {
  const context = useContext(FlashMessageContext)
  if (!context) {
    throw new Error('useFlashMessage must be used within a FlashMessageProvider')
  }
  return context
}
