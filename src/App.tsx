/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createLinkNode } from '@lexical/link'
import { $createListItemNode, $createListNode } from '@lexical/list'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import type { JSX } from 'react'

import { Editor } from './components/ui/editor'

function $prepopulatedRichText() {
  const root = $getRoot()
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1')
    heading.append($createTextNode('Welcome to the Editor'))
    root.append(heading)

    const quote = $createQuoteNode()
    quote.append(
      $createTextNode(
        `This is a rich text editor built with Lexical and styled with Tailwind CSS. ` +
          `It's designed to be easily composable and customizable.`,
      ),
    )
    root.append(quote)

    const paragraph = $createParagraphNode()
    paragraph.append(
      $createTextNode('Try typing in '),
      $createTextNode('some text').toggleFormat('bold'),
      $createTextNode(' with '),
      $createTextNode('different').toggleFormat('italic'),
      $createTextNode(' formats.'),
    )
    root.append(paragraph)

    const paragraph2 = $createParagraphNode()
    paragraph2.append(
      $createTextNode(
        'Check out the toolbar above for formatting options. You can also use #hashtags!',
      ),
    )
    root.append(paragraph2)

    const paragraph3 = $createParagraphNode()
    paragraph3.append($createTextNode(`To learn more about Lexical:`))
    root.append(paragraph3)

    const list = $createListNode('bullet')
    list.append(
      $createListItemNode().append(
        $createTextNode(`Visit the `),
        $createLinkNode('https://lexical.dev/').append(
          $createTextNode('Lexical website'),
        ),
        $createTextNode(` for documentation.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Check out the `),
        $createLinkNode('https://github.com/facebook/lexical').append(
          $createTextNode('GitHub repository'),
        ),
        $createTextNode(`.`),
      ),
    )
    root.append(list)
  }
}

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Lexical Editor Component
        </h1>
        <p className="mb-6 text-muted-foreground">
          A composable rich text editor built with Lexical and styled with
          Tailwind CSS following shadcn/ui patterns.
        </p>
        <Editor
          namespace="demo"
          initialState={$prepopulatedRichText}
          placeholder="Start writing..."
        />
      </div>
    </div>
  )
}
