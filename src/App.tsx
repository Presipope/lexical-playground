/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {$createLinkNode} from '@lexical/link';
import {$createListItemNode, $createListNode} from '@lexical/list';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {$createHeadingNode, $createQuoteNode} from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
} from 'lexical';
import {type JSX, useMemo} from 'react';

import {buildHTMLConfig} from './buildHTMLConfig';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import {TableContext} from './plugins/TablePlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

function $prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1');
    heading.append($createTextNode('Welcome to the Editor'));
    root.append(heading);
    const quote = $createQuoteNode();
    quote.append(
      $createTextNode(
        `This is a rich text editor built with Lexical. ` +
          `You can toggle the debug view using the settings button in the bottom-left corner.`,
      ),
    );
    root.append(quote);
    const paragraph = $createParagraphNode();
    paragraph.append(
      $createTextNode('Try typing in '),
      $createTextNode('some text').toggleFormat('bold'),
      $createTextNode(' with '),
      $createTextNode('different').toggleFormat('italic'),
      $createTextNode(' formats.'),
    );
    root.append(paragraph);
    const paragraph2 = $createParagraphNode();
    paragraph2.append(
      $createTextNode(
        'Check out the toolbar above for formatting options. You can also use #hashtags or @-mentions!',
      ),
    );
    root.append(paragraph2);
    const paragraph3 = $createParagraphNode();
    paragraph3.append(
      $createTextNode(`To learn more about Lexical:`),
    );
    root.append(paragraph3);
    const list = $createListNode('bullet');
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
    );
    root.append(list);
  }
}

function App(): JSX.Element {
  const {
    settings: {emptyEditor},
  } = useSettings();

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: emptyEditor ? undefined : $prepopulatedRichText,
        html: buildHTMLConfig(),
        name: '@lexical/playground',
        namespace: 'Playground',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [emptyEditor],
  );

  return (
    <LexicalExtensionComposer extension={app} contentEditable={null}>
      <SharedHistoryContext>
        <TableContext>
          <ToolbarContext>
            <div className="editor-shell">
              <Editor />
            </div>
            <Settings />
          </ToolbarContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalExtensionComposer>
  );
}

export default function PlaygroundApp(): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App />
      </FlashMessageContext>
    </SettingsContext>
  );
}
