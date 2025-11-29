/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {CAN_USE_BEFORE_INPUT} from '@lexical/utils';
import {useEffect, useState} from 'react';

import {INITIAL_SETTINGS} from './appSettings';
import {useSettings} from './context/SettingsContext';
import Switch from './ui/Switch';

export default function Settings(): JSX.Element {
  const {
    setOption,
    settings: {
      isRichText,
      isMaxLength,
      hasLinkAttributes,
      isCharLimit,
      isCharLimitUtf8,
      isAutocomplete,
      showTreeView,
      showNestedEditorTreeView,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
      isCodeHighlighted,
      isCodeShiki,
    },
  } = useSettings();
  useEffect(() => {
    if (INITIAL_SETTINGS.disableBeforeInput && CAN_USE_BEFORE_INPUT) {
      console.error(
        `Legacy events are enabled (disableBeforeInput) but CAN_USE_BEFORE_INPUT is true`,
      );
    }
  }, []);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button
        id="options-button"
        data-test-id="options-button"
        className={`editor-dev-button ${showSettings ? 'active' : ''}`}
        onClick={() => setShowSettings(!showSettings)}
      />
      {showSettings ? (
        <div className="switches">
          <Switch
            onClick={() => setOption('showTreeView', !showTreeView)}
            checked={showTreeView}
            text="Debug View"
          />
          <Switch
            onClick={() =>
              setOption('showNestedEditorTreeView', !showNestedEditorTreeView)
            }
            checked={showNestedEditorTreeView}
            text="Nested Editors Debug View"
          />
          <Switch
            onClick={() => {
              setOption('isRichText', !isRichText);
            }}
            checked={isRichText}
            text="Rich Text"
          />
          <Switch
            onClick={() => setOption('isCharLimit', !isCharLimit)}
            checked={isCharLimit}
            text="Char Limit"
          />
          <Switch
            onClick={() => setOption('isCharLimitUtf8', !isCharLimitUtf8)}
            checked={isCharLimitUtf8}
            text="Char Limit (UTF-8)"
          />
          <Switch
            onClick={() => setOption('hasLinkAttributes', !hasLinkAttributes)}
            checked={hasLinkAttributes}
            text="Link Attributes"
          />
          <Switch
            onClick={() => setOption('isMaxLength', !isMaxLength)}
            checked={isMaxLength}
            text="Max Length"
          />
          <Switch
            onClick={() => setOption('isAutocomplete', !isAutocomplete)}
            checked={isAutocomplete}
            text="Autocomplete"
          />
          <Switch
            onClick={() => {
              setOption('showTableOfContents', !showTableOfContents);
            }}
            checked={showTableOfContents}
            text="Table Of Contents"
          />
          <Switch
            onClick={() => {
              setOption(
                'shouldUseLexicalContextMenu',
                !shouldUseLexicalContextMenu,
              );
            }}
            checked={shouldUseLexicalContextMenu}
            text="Use Lexical Context Menu"
          />
          <Switch
            onClick={() => {
              setOption(
                'shouldPreserveNewLinesInMarkdown',
                !shouldPreserveNewLinesInMarkdown,
              );
            }}
            checked={shouldPreserveNewLinesInMarkdown}
            text="Preserve newlines in Markdown"
          />
          <Switch
            onClick={() => {
              setOption(
                'shouldAllowHighlightingWithBrackets',
                !shouldAllowHighlightingWithBrackets,
              );
            }}
            checked={shouldAllowHighlightingWithBrackets}
            text="Use Brackets for Highlighting"
          />
          <Switch
            onClick={() => {
              setOption('selectionAlwaysOnDisplay', !selectionAlwaysOnDisplay);
            }}
            checked={selectionAlwaysOnDisplay}
            text="Retain selection"
          />
          <Switch
            onClick={() => {
              setOption('isCodeHighlighted', !isCodeHighlighted);
            }}
            checked={isCodeHighlighted}
            text="Enable Code Highlighting"
          />
          <Switch
            onClick={() => {
              setOption('isCodeShiki', !isCodeShiki);
            }}
            checked={isCodeShiki}
            text="Use Shiki for Code Highlighting"
          />
        </div>
      ) : null}
    </>
  );
}
