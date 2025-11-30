# Lexical Editor Component

A fully composable rich text editor built with [Lexical](https://lexical.dev/) and styled with Tailwind CSS, following shadcn/ui patterns.

## Quick Start

### Kitchen Sink (All Features)

The simplest way to use the editor with all features enabled:

```tsx
import { Editor } from '@/components/ui/editor'

function MyPage() {
  return (
    <Editor
      namespace="my-editor"
      placeholder="Start writing..."
      initialState={jsonString} // Optional: Pre-populate with content
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `namespace` | `string` | `"editor"` | Unique identifier for the editor |
| `placeholder` | `string` | `"Start writing..."` | Placeholder text |
| `initialState` | `string \| (() => void)` | - | Initial editor state (JSON or callback) |
| `editable` | `boolean` | `true` | Whether the editor is editable |
| `autoFocus` | `boolean` | `true` | Auto-focus on mount |
| `showToolbar` | `boolean` | `true` | Show the toolbar |
| `nodes` | `Klass<LexicalNode>[]` | - | Additional custom nodes |
| `theme` | `EditorThemeClasses` | - | Custom theme overrides |
| `onError` | `(error: Error) => void` | - | Error handler |
| `className` | `string` | - | Additional CSS classes |

---

## Composable Architecture

For full control, compose the editor from individual components:

```tsx
import {
  EditorRoot,
  EditorToolbar,
  EditorContent,
  ToolbarSeparator,
  HistoryButtons,
  FormatButtons,
  BlockFormatDropdown,
  InsertDropdown,
} from '@/components/ui/editor'

function CustomEditor() {
  return (
    <EditorRoot namespace="custom">
      <EditorToolbar>
        <HistoryButtons />
        <ToolbarSeparator />
        <BlockFormatDropdown />
        <ToolbarSeparator />
        <FormatButtons formats={['bold', 'italic', 'link']} />
        <ToolbarSeparator />
        <InsertDropdown />
      </EditorToolbar>
      <EditorContent placeholder="Start writing..." />
    </EditorRoot>
  )
}
```

---

## Customizing Toolbar Components

### FormatButtons

Control which formatting options are available:

```tsx
<FormatButtons
  formats={['bold', 'italic', 'underline', 'code', 'link']}
/>

// Available formats:
// 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' |
// 'link' | 'subscript' | 'superscript' | 'highlight'
```

### BlockFormatDropdown

Control which block types are available:

```tsx
<BlockFormatDropdown
  blockTypes={['paragraph', 'h1', 'h2', 'bullet', 'number']}
/>

// Available block types:
// 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' |
// 'check' | 'quote' | 'code'
```

---

## Customizing the Insert Dropdown

### Using Built-in Items Selectively

```tsx
import {
  InsertDropdown,
  InsertHorizontalRule,
  InsertTable,
  InsertSeparator,
} from '@/components/ui/editor'

function CustomInsertMenu() {
  return (
    <InsertDropdown>
      <InsertHorizontalRule />
      <InsertSeparator />
      <InsertTable maxRows={4} maxCols={4} />
    </InsertDropdown>
  )
}
```

### Adding Custom Insert Items

```tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Image } from 'lucide-react'
import {
  InsertDropdown,
  InsertItem,
  InsertHorizontalRule,
  InsertSeparator,
} from '@/components/ui/editor'
import { INSERT_IMAGE_COMMAND } from './my-image-plugin'

function CustomInsertMenu() {
  const [editor] = useLexicalComposerContext()

  return (
    <InsertDropdown>
      <InsertHorizontalRule />
      <InsertSeparator />
      <InsertItem
        icon={Image}
        label="Image"
        onClick={() => {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: '/placeholder.png',
            alt: 'Placeholder',
          })
        }}
      />
    </InsertDropdown>
  )
}
```

---

## Plugin Configuration

### Selectively Enable/Disable Plugins

```tsx
<EditorContent
  plugins={{
    table: false,        // Disable tables
    hashtag: false,      // Disable hashtags
    emojiPicker: false,  // Disable emoji picker
  }}
/>
```

### Available Plugin Options

| Option | Default | Description |
|--------|---------|-------------|
| `history` | `true` | Undo/redo support |
| `list` | `true` | Bullet and numbered lists |
| `checkList` | `true` | Checkbox lists |
| `link` | `true` | Links |
| `horizontalRule` | `true` | Horizontal dividers |
| `tabIndentation` | `true` | Tab key indentation |
| `hashtag` | `true` | Hashtag highlighting |
| `emojiPicker` | `true` | Emoji picker (`:emoji:`) |
| `keyboardShortcuts` | `true` | Formatting shortcuts |
| `collapsible` | `true` | Collapsible blocks |
| `layout` | `true` | Column layouts |
| `floatingLinkEditor` | `true` | Link editing popup |
| `floatingTextFormat` | `true` | Selection format toolbar |
| `draggableBlock` | `true` | Drag-to-reorder blocks |
| `table` | `true` | Tables |

### Minimal Mode with Custom Plugins

```tsx
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { EditorContent, CorePlugins } from '@/components/ui/editor'
import { MyCustomPlugin } from './my-custom-plugin'

function MinimalEditor() {
  return (
    <EditorContent plugins="minimal">
      <CorePlugins />
      <MyCustomPlugin />
    </EditorContent>
  )
}
```

### Using Plugin Bundles

```tsx
import {
  EditorContent,
  CorePlugins,
  TablePlugins,
  FloatingPlugins,
  EnhancementPlugins,
} from '@/components/ui/editor'

function ComposedEditor() {
  return (
    <EditorContent plugins="minimal">
      <CorePlugins />
      <FloatingPlugins />
      {/* Skip TablePlugins and EnhancementPlugins */}
    </EditorContent>
  )
}
```

---

## Creating Custom Plugins

### Basic Plugin Structure

A Lexical plugin is a React component that uses the editor context to register commands and transforms:

```tsx
'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  createCommand,
  COMMAND_PRIORITY_EDITOR,
  LexicalCommand,
  $getSelection,
  $isRangeSelection,
} from 'lexical'

// 1. Create a command
export const INSERT_TIMESTAMP_COMMAND: LexicalCommand<void> = createCommand()

// 2. Create the plugin component
export function TimestampPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Register command handler
    return editor.registerCommand(
      INSERT_TIMESTAMP_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const timestamp = new Date().toLocaleString()
            selection.insertText(timestamp)
          }
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}
```

### Using Your Plugin

```tsx
import { EditorContent } from '@/components/ui/editor'
import { TimestampPlugin, INSERT_TIMESTAMP_COMMAND } from './timestamp-plugin'

function MyEditor() {
  return (
    <EditorContent>
      <TimestampPlugin />
    </EditorContent>
  )
}
```

### Adding to Insert Menu

```tsx
import { Clock } from 'lucide-react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  InsertDropdown,
  InsertItem,
  InsertHorizontalRule,
} from '@/components/ui/editor'
import { INSERT_TIMESTAMP_COMMAND } from './timestamp-plugin'

function CustomInsertMenu() {
  const [editor] = useLexicalComposerContext()

  return (
    <InsertDropdown>
      <InsertHorizontalRule />
      <InsertItem
        icon={Clock}
        label="Timestamp"
        onClick={() => editor.dispatchCommand(INSERT_TIMESTAMP_COMMAND, undefined)}
      />
    </InsertDropdown>
  )
}
```

---

## Creating Custom Nodes

For more complex insertions, create custom nodes:

```tsx
// mention-node.ts
import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical'

export interface MentionPayload {
  userId: string
  name: string
}

export class MentionNode extends DecoratorNode<JSX.Element> {
  __userId: string
  __name: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__userId, node.__name, node.__key)
  }

  constructor(userId: string, name: string, key?: NodeKey) {
    super(key)
    this.__userId = userId
    this.__name = name
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'mention bg-primary/10 text-primary px-1 rounded'
    return span
  }

  updateDOM(): false {
    return false
  }

  decorate(): JSX.Element {
    return <span>@{this.__name}</span>
  }

  // Serialization methods...
}

export function $createMentionNode(userId: string, name: string): MentionNode {
  return new MentionNode(userId, name)
}

export function $isMentionNode(node: LexicalNode | null): node is MentionNode {
  return node instanceof MentionNode
}
```

### Registering Custom Nodes

```tsx
import { EditorRoot } from '@/components/ui/editor'
import { MentionNode } from './mention-node'

function MyEditor() {
  return (
    <EditorRoot
      namespace="my-editor"
      nodes={[MentionNode]}
    >
      {/* ... */}
    </EditorRoot>
  )
}
```

---

## Utility Hooks

### useEditor

Get the editor instance and editable state:

```tsx
import { useEditor } from '@/components/ui/editor'

function MyComponent() {
  const { editor, isEditable } = useEditor()

  const insertText = () => {
    editor.update(() => {
      // Make updates
    })
  }

  return (
    <button disabled={!isEditable} onClick={insertText}>
      Insert
    </button>
  )
}
```

### useEditorCommand

Create buttons that dispatch commands:

```tsx
import { useEditorCommand } from '@/components/ui/editor'
import { INSERT_IMAGE_COMMAND } from './my-plugin'

function InsertImageButton() {
  const { isEditable, dispatch } = useEditorCommand(
    INSERT_IMAGE_COMMAND,
    { src: '/placeholder.png' }
  )

  return (
    <button disabled={!isEditable} onClick={dispatch}>
      Insert Image
    </button>
  )
}
```

### useTextFormat

Create format toggle buttons with active state:

```tsx
import { useTextFormat } from '@/components/ui/editor'

function BoldButton() {
  const { isActive, isEditable, toggle } = useTextFormat('bold')

  return (
    <button
      disabled={!isEditable}
      onClick={toggle}
      className={isActive ? 'bg-primary text-white' : ''}
    >
      Bold
    </button>
  )
}
```

### useCommandListener

Register custom command handlers:

```tsx
import { useCommandListener } from '@/components/ui/editor'
import { MY_COMMAND } from './my-plugin'

function MyPlugin() {
  useCommandListener(MY_COMMAND, (payload) => {
    console.log('Command received:', payload)
    return true // Stop propagation
  })

  return null
}
```

---

## Context Hooks

Access editor context from any component inside `EditorRoot`:

| Hook | Description |
|------|-------------|
| `useEditorConfig()` | Get editor configuration |
| `useSharedHistory()` | Access shared history state |
| `useToolbarState()` | Get/set toolbar state |
| `useActiveEditor()` | Get the active editor instance |
| `useModal()` | Show/hide modals |
| `useFlashMessage()` | Show toast notifications |
| `useFloatingAnchor()` | Get anchor element for floating UIs |

---

## Complete Custom Editor Example

```tsx
'use client'

import {
  EditorRoot,
  EditorToolbar,
  EditorContent,
  ToolbarSeparator,
  HistoryButtons,
  FormatButtons,
  BlockFormatDropdown,
  AlignDropdown,
  InsertDropdown,
  InsertHorizontalRule,
  InsertTable,
  InsertItem,
  InsertSeparator,
} from '@/components/ui/editor'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Clock, Image } from 'lucide-react'
import { TimestampPlugin, INSERT_TIMESTAMP_COMMAND } from './timestamp-plugin'
import { ImagePlugin, INSERT_IMAGE_COMMAND } from './image-plugin'

function CustomInsertMenu() {
  const [editor] = useLexicalComposerContext()

  return (
    <InsertDropdown label="Add">
      <InsertHorizontalRule />
      <InsertTable />
      <InsertSeparator />
      <InsertItem
        icon={Clock}
        label="Timestamp"
        onClick={() => editor.dispatchCommand(INSERT_TIMESTAMP_COMMAND, undefined)}
      />
      <InsertItem
        icon={Image}
        label="Image"
        onClick={() => editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: '' })}
      />
    </InsertDropdown>
  )
}

export function BlogEditor() {
  return (
    <EditorRoot namespace="blog-editor">
      <EditorToolbar>
        <HistoryButtons />
        <ToolbarSeparator />
        <BlockFormatDropdown blockTypes={['paragraph', 'h1', 'h2', 'h3', 'quote']} />
        <ToolbarSeparator />
        <FormatButtons formats={['bold', 'italic', 'link', 'code']} />
        <ToolbarSeparator />
        <AlignDropdown />
        <ToolbarSeparator />
        <CustomInsertMenu />
      </EditorToolbar>
      <EditorContent
        placeholder="Write your blog post..."
        plugins={{
          table: false,
          hashtag: false,
          checkList: false,
        }}
      >
        <TimestampPlugin />
        <ImagePlugin />
      </EditorContent>
    </EditorRoot>
  )
}
```

---

## Component Reference

### Composable Components

| Component | Description |
|-----------|-------------|
| `EditorRoot` | Root wrapper with providers |
| `EditorToolbar` | Toolbar container |
| `EditorContent` | Content area with plugins |
| `ToolbarSeparator` | Visual separator in toolbar |

### Toolbar Components

| Component | Description |
|-----------|-------------|
| `HistoryButtons` | Undo/Redo buttons |
| `FormatButtons` | Text formatting buttons |
| `BlockFormatDropdown` | Block type selector |
| `TextFormatDropdown` | Additional text formats |
| `AlignDropdown` | Text alignment |
| `FontColorPicker` | Font color picker |
| `BackgroundColorPicker` | Background color picker |
| `InsertDropdown` | Insert elements dropdown |

### Insert Items

| Component | Description |
|-----------|-------------|
| `InsertItem` | Generic insert button |
| `InsertHorizontalRule` | Insert horizontal rule |
| `InsertTable` | Insert table with size picker |
| `InsertColumns` | Insert column layout |
| `InsertCollapsible` | Insert collapsible block |
| `InsertSeparator` | Visual separator in dropdown |

### Plugin Bundles

| Component | Includes |
|-----------|----------|
| `CorePlugins` | History, lists, links, horizontal rule, tabs, hashtags |
| `TablePlugins` | Table, cell resizer, action menu, hover actions |
| `FloatingPlugins` | Link editor, text format toolbar, draggable blocks |
| `EnhancementPlugins` | Emoji picker, keyboard shortcuts, collapsible, layout |

---

## Migration from Kitchen Sink

If you're using the full `<Editor />` component and want to customize:

1. Replace `<Editor />` with composable structure
2. Keep only the toolbar components you need
3. Configure plugins with the `plugins` prop
4. Add custom plugins as children to `<EditorContent>`

```tsx
// Before
<Editor showToolbar={true} />

// After - Same behavior
<EditorRoot>
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
  <EditorContent />
</EditorRoot>
```
