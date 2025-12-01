# Editor Utilities

This directory contains utility functions for working with the Lexical editor's serialized state outside of the editor context.

## Available Utilities

### Plain Text Export

**File:** `plain-text-export.ts`

Converts serialized Lexical editor state to plain text format suitable for display in any text environment (Notepad, terminal, email, etc.).

#### Functions

##### `generatePlainText(value, options?)`

Generates formatted plain text from serialized editor state with structure preservation.

```typescript
import { generatePlainText } from '@/components/ui/editor'

// From editor state
const plainText = generatePlainText(editor.getEditorState().toJSON())

// From stored JSON string
const plainText = generatePlainText(savedJsonString)

// With custom options
const plainText = generatePlainText(value, {
  includeUrls: false,
  tableMaxColumnWidth: 25,
})
```

##### `extractTextContent(value)`

Extracts raw text content without any formatting or structure. Similar to Lexical's `$getRoot().getTextContent()` but works on serialized state.

```typescript
import { extractTextContent } from '@/components/ui/editor'

const rawText = extractTextContent(savedJsonString)
```

##### `isSerializedEditorState(value)`

Type guard to check if a value is a valid serialized Lexical editor state.

```typescript
import { isSerializedEditorState } from '@/components/ui/editor'

if (isSerializedEditorState(data)) {
  // TypeScript knows data is SerializedEditorState
  const plainText = generatePlainText(data)
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lineBreak` | `string` | `'\n'` | Character(s) for line breaks |
| `indentSize` | `number` | `2` | Spaces per indent level |
| `includeUrls` | `boolean` | `true` | Show URLs with links: `"text (url)"` |
| `showCollapsibleIndicators` | `boolean` | `true` | Show `[+]`/`[-]` for collapsibles |
| `horizontalRuleChar` | `string` | `'-'` | Character for horizontal rules |
| `horizontalRuleWidth` | `number` | `40` | Width of horizontal rules |
| `tableMinColumnWidth` | `number` | `3` | Minimum table column width |
| `tableMaxColumnWidth` | `number` | `30` | Maximum table column width |
| `tableColumnSeparator` | `string` | `'\|'` | Table column separator |
| `tableHeaderUnderline` | `string` | `'-'` | Table header underline character |

#### Node Handling

The utility handles all standard Lexical nodes and custom nodes from this editor:

| Node Type | Plain Text Representation |
|-----------|--------------------------|
| Text | Direct content |
| Paragraph | Content with proper spacing |
| Heading (h1) | `Title` + newline + `=====` |
| Heading (h2) | `Title` + newline + `-----` |
| Heading (h3-h6) | `### Title` (markdown-style prefix) |
| Quote | `> ` prefix on each line |
| Bullet List | `- ` prefix |
| Numbered List | `1. ` prefix (auto-numbered) |
| Checklist | `[x] ` or `[ ] ` prefix |
| Link | `text (https://url)` |
| Code Block | ` ``` ` fenced block |
| Table | ASCII table (see below) |
| Horizontal Rule | `----------------------------------------` |
| Collapsible | `[+] Title` with indented content |
| Layout | Sequential sections with `---` dividers |
| Mention | `@username` |
| Hashtag | `#hashtag` |

#### Table Formatting

Tables are rendered as ASCII tables with aligned columns:

```
Header1    | Header2       | Header3
---------- | ------------- | ----------------
Value 1    | Value 2       | Value 3
Value A    | Value B       | Value C
```

Features:
- Columns auto-size based on content
- Header row is underlined with dashes
- Long content is truncated with ellipsis
- Column widths are configurable via options

#### Example Output

Given rich text content with various elements:

**Input (conceptual):**
- A heading "Welcome"
- A paragraph with **bold** and *italic* text
- A bulleted list
- A table with data

**Output:**

```
Welcome
=======

This is a paragraph with bold and italic formatting preserved as plain text.

- First item
- Second item
- Third item

Name       | Age | City
---------- | --- | --------
Alice      | 25  | New York
Bob        | 30  | Chicago
```

#### Use Cases

1. **Email Export**: Generate plain text versions for email clients that don't support HTML
2. **Search Indexing**: Extract searchable text from rich content
3. **Accessibility**: Provide text-only versions for screen readers
4. **Copy to Clipboard**: Let users copy content as plain text
5. **Logging/Debugging**: View content in logs without HTML noise
6. **Data Export**: Save plain text alongside rich text for compatibility

#### Integration Example

```typescript
// In a form submission handler
async function handleSubmit(formData: FormData) {
  const richTextJson = formData.get('content') as string

  // Save both versions
  await saveDocument({
    richText: richTextJson,
    plainText: generatePlainText(richTextJson),
  })
}
```

```typescript
// In a "Copy as Plain Text" button
function handleCopyPlainText() {
  const editorState = editor.getEditorState()
  const plainText = generatePlainText(editorState.toJSON())
  navigator.clipboard.writeText(plainText)
}
```

---

## Adding New Utilities

When adding new utilities to this directory:

1. Create a new TypeScript file with clear naming (e.g., `my-utility.ts`)
2. Add comprehensive JSDoc comments to exported functions
3. Export from `index.ts` in the utils directory
4. Add the export to the main editor `index.ts`
5. Document the utility in this README
