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

## Form Integration

The editor is designed to work seamlessly with form libraries like React Hook Form and TanStack Form, or with your own custom form solution.

### Form Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Controlled value (JSON/HTML/text) |
| `defaultValue` | `string` | - | Uncontrolled initial value |
| `onChange` | `(value, editorState) => void` | - | Called when content changes |
| `onBlur` | `(event, value) => void` | - | Called when editor loses focus |
| `onFocus` | `(event) => void` | - | Called when editor gains focus |
| `outputFormat` | `'json' \| 'html' \| 'text'` | `'json'` | Format for value callbacks |
| `disabled` | `boolean` | `false` | Disable the editor |
| `readOnly` | `boolean` | `false` | Read-only mode (can select/copy) |
| `required` | `boolean` | `false` | Mark field as required |
| `name` | `string` | - | Form field name |
| `id` | `string` | - | ID for label association |
| `aria-label` | `string` | - | Accessible label |
| `aria-labelledby` | `string` | - | ID of labeling element |
| `aria-describedby` | `string` | - | ID of describing element |
| `aria-invalid` | `boolean` | - | Mark as invalid for validation |

---

### Basic Controlled Usage

```tsx
import { useState } from 'react'
import { Editor } from '@/components/ui/editor'

function MyForm() {
  const [content, setContent] = useState('')

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="editor">Content</label>
      <Editor
        id="editor"
        value={content}
        onChange={(value) => setContent(value)}
        placeholder="Write something..."
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Uncontrolled Usage with defaultValue

```tsx
import { Editor, useEditorValue } from '@/components/ui/editor'

function MyForm() {
  return (
    <Editor
      defaultValue={initialJsonState}
      placeholder="Start writing..."
    />
  )
}
```

---

### React Hook Form Integration

#### With Controller (Recommended)

```tsx
import { useForm, Controller } from 'react-hook-form'
import { Editor } from '@/components/ui/editor'

interface FormData {
  title: string
  content: string
}

function BlogPostForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      content: '',
    },
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="content">Content</label>
        <Controller
          name="content"
          control={control}
          rules={{
            required: 'Content is required',
            validate: (value) => {
              // Validate JSON content isn't empty
              try {
                const parsed = JSON.parse(value)
                const text = parsed?.root?.children?.[0]?.children?.[0]?.text
                return text?.trim() ? true : 'Content cannot be empty'
              } catch {
                return true
              }
            },
          }}
          render={({ field, fieldState }) => (
            <>
              <Editor
                id="content"
                value={field.value}
                onChange={field.onChange}
                onBlur={(e) => field.onBlur()}
                disabled={isSubmitting}
                aria-invalid={!!fieldState.error}
                aria-describedby={fieldState.error ? 'content-error' : undefined}
                placeholder="Write your blog post..."
              />
              {fieldState.error && (
                <p id="content-error" className="text-destructive text-sm mt-1">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Post'}
      </button>
    </form>
  )
}
```

#### Creating a Reusable EditorField Component

```tsx
// components/editor-field.tsx
import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { Editor, EditorProps } from '@/components/ui/editor'

interface EditorFieldProps<T extends FieldValues>
  extends Omit<EditorProps, 'value' | 'onChange' | 'onBlur'> {
  name: Path<T>
  control: Control<T>
  label?: string
  rules?: Parameters<typeof Controller>[0]['rules']
}

export function EditorField<T extends FieldValues>({
  name,
  control,
  label,
  rules,
  ...editorProps
}: EditorFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          {label && (
            <label htmlFor={name} className="text-sm font-medium">
              {label}
            </label>
          )}
          <Editor
            id={name}
            value={field.value}
            onChange={field.onChange}
            onBlur={(e) => field.onBlur()}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
            {...editorProps}
          />
          {fieldState.error && (
            <p id={`${name}-error`} className="text-destructive text-sm">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}

// Usage
function MyForm() {
  const { control, handleSubmit } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <EditorField
        name="content"
        control={control}
        label="Post Content"
        rules={{ required: 'Content is required' }}
        placeholder="Write something..."
      />
    </form>
  )
}
```

---

### TanStack Form Integration

#### Basic Usage with useForm

```tsx
import { useForm } from '@tanstack/react-form'
import { Editor } from '@/components/ui/editor'

function BlogPostForm() {
  const form = useForm({
    defaultValues: {
      title: '',
      content: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="content"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Content is required'
            // Check if content is empty (just whitespace)
            try {
              const parsed = JSON.parse(value)
              const hasContent = parsed?.root?.children?.some(
                (child: any) => child?.children?.some((c: any) => c?.text?.trim())
              )
              return hasContent ? undefined : 'Content cannot be empty'
            } catch {
              return undefined
            }
          },
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Editor
              id="content"
              name={field.name}
              value={field.state.value}
              onChange={(value) => field.handleChange(value)}
              onBlur={() => field.handleBlur()}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby={
                field.state.meta.errors.length > 0 ? 'content-error' : undefined
              }
              placeholder="Write your blog post..."
            />
            {field.state.meta.errors.length > 0 && (
              <p id="content-error" className="text-destructive text-sm">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
```

#### Creating a Reusable TanStack EditorField

```tsx
// components/tanstack-editor-field.tsx
'use client'

import { useField, FieldApi } from '@tanstack/react-form'
import { Editor, EditorProps } from '@/components/ui/editor'

interface TanStackEditorFieldProps
  extends Omit<EditorProps, 'value' | 'onChange' | 'onBlur' | 'name'> {
  field: FieldApi<any, any, any, any, string>
  label?: string
}

/**
 * A pre-built editor field for TanStack Form.
 * Use this inside a form.Field render function.
 */
export function TanStackEditorField({
  field,
  label,
  disabled,
  ...editorProps
}: TanStackEditorFieldProps) {
  const hasErrors = field.state.meta.errors.length > 0
  const errorId = `${field.name}-error`

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={field.name} className="text-sm font-medium">
          {label}
          {field.options.validators?.onChange && (
            <span className="text-destructive ml-1">*</span>
          )}
        </label>
      )}
      <Editor
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        onBlur={() => field.handleBlur()}
        disabled={disabled}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        {...editorProps}
      />
      {hasErrors && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

// Usage with form.Field
function MyForm() {
  const form = useForm({
    defaultValues: { content: '' },
    onSubmit: async ({ value }) => console.log(value),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="content"
        validators={{
          onChange: ({ value }) => (!value ? 'Required' : undefined),
        }}
      >
        {(field) => (
          <TanStackEditorField
            field={field}
            label="Content"
            placeholder="Write something..."
          />
        )}
      </form.Field>
    </form>
  )
}
```

#### Standalone Field Component with createFormHook (TanStack Form v1+)

For the newest TanStack Form API, you can create a fully standalone field:

```tsx
// lib/form.ts
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { TanStackEditorField } from '@/components/tanstack-editor-field'

// Create form contexts
const { fieldContext, formContext, useFieldContext } = createFormHookContexts()

// Create custom useField that includes our editor
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Editor: TanStackEditorField,
  },
})
```

```tsx
// components/tanstack-editor-field.tsx (Updated for standalone usage)
'use client'

import { useFieldContext } from '@/lib/form'
import { Editor, EditorProps } from '@/components/ui/editor'

interface EditorFieldProps extends Omit<EditorProps, 'value' | 'onChange' | 'onBlur' | 'name'> {
  label?: string
}

export function TanStackEditorField({ label, ...editorProps }: EditorFieldProps) {
  const field = useFieldContext<string>()
  const hasErrors = field.state.meta.errors.length > 0
  const errorId = `${field.name}-error`

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={field.name} className="text-sm font-medium">
          {label}
        </label>
      )}
      <Editor
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        onBlur={() => field.handleBlur()}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        {...editorProps}
      />
      {hasErrors && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}
```

```tsx
// Usage with the custom form hook
import { useAppForm } from '@/lib/form'

function BlogPostForm() {
  const form = useAppForm({
    defaultValues: {
      title: '',
      content: '',
    },
    onSubmit: async ({ value }) => {
      await savePost(value)
    },
  })

  return (
    <form.Provider>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
        <form.Field name="title">
          {/* Your title input */}
        </form.Field>

        {/* Use the Editor field component directly */}
        <form.Field
          name="content"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Content is required'
              return undefined
            },
          }}
        >
          <form.FieldComponent.Editor
            label="Post Content"
            placeholder="Write your blog post..."
            showToolbar={true}
          />
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Publish'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </form.Provider>
  )
}
```

---

### useEditorValue Hook

For programmatic access to editor content without controlled mode:

```tsx
import { EditorRoot, EditorContent, useEditorValue } from '@/components/ui/editor'

function SubmitButton() {
  const { value, isEmpty, clear, getValueAs } = useEditorValue({ format: 'json' })

  const handleSubmit = async () => {
    if (isEmpty) {
      alert('Please enter some content')
      return
    }

    // Get HTML version for preview
    const html = getValueAs('html')
    console.log('HTML:', html)

    // Submit JSON for storage
    await submitToServer(value)
    clear()
  }

  return (
    <button onClick={handleSubmit} disabled={isEmpty}>
      Submit
    </button>
  )
}

function MyForm() {
  return (
    <EditorRoot>
      <EditorContent placeholder="Write something..." />
      <SubmitButton />
    </EditorRoot>
  )
}
```

### useEditorValue Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'json' \| 'html' \| 'text'` | `'json'` | Output format |
| `includeSelectionChanges` | `boolean` | `false` | Update on selection changes |

### useEditorValue Returns

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | Current content in specified format |
| `editorState` | `EditorState` | Raw Lexical EditorState |
| `setValue` | `(value: string) => void` | Set content programmatically |
| `clear` | `() => void` | Clear the editor |
| `isEmpty` | `boolean` | Whether editor is empty |
| `getValueAs` | `(format) => string` | Get content in specific format |

---

### Disabled and Read-Only States

```tsx
// Disabled - cannot edit, visually dimmed
<Editor disabled={isSubmitting} />

// Read-only - cannot edit, but can select/copy
<Editor readOnly={true} />

// Conditional based on permissions
<Editor
  readOnly={!canEdit}
  disabled={isLoading}
/>
```

---

### Output Formats

The editor supports three output formats:

| Format | Description | Use Case |
|--------|-------------|----------|
| `'json'` | Lexical JSON state | Storage, full fidelity restoration |
| `'html'` | HTML string | Preview, email, CMS integration |
| `'text'` | Plain text | Search indexing, previews |

```tsx
// Store as JSON, get HTML for preview
<Editor
  outputFormat="json"
  onChange={(json, editorState) => {
    setFormData(json)

    // Get HTML version on-demand
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor)
      setPreview(html)
    })
  }}
/>
```

---

### Validation Helpers

For validating editor content in forms:

```tsx
// Check if JSON content is empty
function isEditorEmpty(jsonValue: string): boolean {
  if (!jsonValue) return true
  try {
    const parsed = JSON.parse(jsonValue)
    const root = parsed?.root
    if (!root?.children?.length) return true

    // Check if all paragraphs are empty
    return root.children.every((child: any) => {
      if (child.type === 'paragraph') {
        return !child.children?.some((c: any) => c.text?.trim())
      }
      return false
    })
  } catch {
    return true
  }
}

// Get plain text length for character limits
function getTextLength(jsonValue: string): number {
  try {
    const parsed = JSON.parse(jsonValue)
    // Traverse and count text
    let length = 0
    const traverse = (node: any) => {
      if (node.text) length += node.text.length
      if (node.children) node.children.forEach(traverse)
    }
    traverse(parsed.root)
    return length
  } catch {
    return 0
  }
}

// Usage with React Hook Form
<Controller
  name="content"
  control={control}
  rules={{
    validate: {
      required: (v) => !isEditorEmpty(v) || 'Content is required',
      maxLength: (v) => getTextLength(v) <= 5000 || 'Content too long',
    },
  }}
  render={/* ... */}
/>
```

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
