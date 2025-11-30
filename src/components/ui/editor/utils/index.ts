/**
 * Editor Utilities
 *
 * Utility functions for working with serialized Lexical editor state
 * outside of the editor context.
 */

// Plain text export
export {
  generatePlainText,
  extractTextContent,
  isSerializedEditorState,
} from './plain-text-export'

export type { PlainTextOptions } from './plain-text-export'
