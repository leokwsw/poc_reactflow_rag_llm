"use client";

import type { EditorState, LexicalEditor, RangeSelection } from "lexical";
import type { ReactNode } from "react";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useMemo, useState } from "react";
import {
  buildVariableLabelMap,
  normalizePromptValue,
  serializeEditorText,
  setEditorValueFromString,
  syncWorkflowVariableLabels,
  type WorkflowPromptVariableOption,
} from "@/app/components/workflow/prompt-editor/utils";
import {
  $createWorkflowVariableNode,
  WorkflowVariableNode,
} from "@/app/components/workflow/prompt-editor/workflow-variable-node";

type WorkflowPromptEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: ReactNode;
  className?: string;
  minHeightClassName?: string;
  variableOptions?: WorkflowPromptVariableOption[];
};

type TriggerState = {
  trigger: "/" | "{";
  query: string;
};

function findTrigger(beforeCursor: string): TriggerState | null {
  const slashIndex = beforeCursor.lastIndexOf("/");
  const braceIndex = beforeCursor.lastIndexOf("{");
  const triggerIndex = Math.max(slashIndex, braceIndex);

  if (triggerIndex === -1) {
    return null;
  }

  const trigger = beforeCursor[triggerIndex] as "/" | "{";
  const query = beforeCursor.slice(triggerIndex + 1);

  if (query.includes("\n") || /\s/.test(query)) {
    return null;
  }

  return {
    trigger,
    query,
  };
}

function replaceSelectionWithVariable(
  selection: RangeSelection,
  option: WorkflowPromptVariableOption,
  trigger: TriggerState | null,
) {
  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode) || !trigger) {
    selection.insertNodes([$createWorkflowVariableNode(option.expression, option.label), $createTextNode("")]);
    return;
  }

  const offset = selection.anchor.offset;
  const beforeCursor = anchorNode.getTextContent().slice(0, offset);
  const triggerIndex = beforeCursor.lastIndexOf(trigger.trigger);

  if (triggerIndex === -1) {
    selection.insertNodes([$createWorkflowVariableNode(option.expression, option.label), $createTextNode("")]);
    return;
  }

  selection.setTextNodeRange(anchorNode, triggerIndex, anchorNode, offset);
  selection.insertNodes([$createWorkflowVariableNode(option.expression, option.label), $createTextNode("")]);
}

function SyncValuePlugin({
  value,
  variableLabels,
}: {
  value: string;
  variableLabels: Map<string, string>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const currentValue = serializeEditorText(editor);
    if (currentValue !== value) {
      setEditorValueFromString(editor, value, variableLabels);
    }
  }, [editor, value, variableLabels]);

  useEffect(() => {
    syncWorkflowVariableLabels(editor, variableLabels);
  }, [editor, variableLabels]);

  return null;
}

function TriggerMenuPlugin({
  options,
  onInsert,
}: {
  options: WorkflowPromptVariableOption[];
  onInsert: (option: WorkflowPromptVariableOption) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [triggerState, setTriggerState] = useState<TriggerState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    if (!triggerState) {
      return [];
    }

    const query = triggerState.query.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(query)
      || option.expression.toLowerCase().includes(query)
      || (option.typeLabel ?? "").toLowerCase().includes(query),
    );
  }, [options, triggerState]);
  const safeActiveIndex = filteredOptions.length === 0 ? 0 : Math.min(activeIndex, filteredOptions.length - 1);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setTriggerState(null);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        if (!$isTextNode(anchorNode)) {
          setTriggerState(null);
          return;
        }

        const beforeCursor = anchorNode.getTextContent().slice(0, selection.anchor.offset);
        setTriggerState(findTrigger(beforeCursor));
      });
    });
  }, [editor]);

  useEffect(() => {
    if (!triggerState) {
      return;
    }

    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setTriggerState(null);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, triggerState]);

  useEffect(() => {
    if (!triggerState || filteredOptions.length === 0) {
      return;
    }

    const disposers = [
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => {
          setActiveIndex(index => (index + 1) % filteredOptions.length);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => {
          setActiveIndex(index => (index - 1 + filteredOptions.length) % filteredOptions.length);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        () => {
          const option = filteredOptions[safeActiveIndex];
          if (!option) {
            return false;
          }

          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              replaceSelectionWithVariable(selection, option, triggerState);
            }
          });
          onInsert(option);
          setTriggerState(null);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    ];

    return () => {
      disposers.forEach(dispose => dispose());
    };
  }, [editor, filteredOptions, onInsert, safeActiveIndex, triggerState]);

  if (!triggerState) {
    return null;
  }

  return (
    <div className="absolute left-2 right-2 top-full z-20 mt-2 max-h-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
      <div className="border-b border-zinc-100 px-3 py-2">
        <p className="text-xs font-medium text-zinc-500">
          搜尋變數
          {triggerState.query ? `: ${triggerState.query}` : ""}
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {filteredOptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
            找不到可用變數
          </div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={option.key}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                index === safeActiveIndex ? "bg-zinc-50" : "hover:bg-zinc-50"
              }`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    replaceSelectionWithVariable(selection, option, triggerState);
                  }
                });
                onInsert(option);
                setTriggerState(null);
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-800">{option.label}</p>
                <p className="mt-0.5 truncate text-xs text-indigo-600">{`{{#${option.expression}#}}`}</p>
              </div>
              {option.typeLabel ? (
                <span className="shrink-0 text-xs font-medium text-zinc-400">{option.typeLabel}</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function WorkflowPromptEditor({
  value = "",
  onChange,
  onBlur,
  onFocus,
  placeholder,
  className,
  minHeightClassName = "min-h-[56px]",
  variableOptions = [],
}: WorkflowPromptEditorProps) {
  const normalizedValue = normalizePromptValue(value);
  const variableLabels = useMemo(
    () => buildVariableLabelMap(variableOptions),
    [variableOptions],
  );

  const initialConfig = useMemo(() => ({
    namespace: "workflow-prompt-editor",
    nodes: [WorkflowVariableNode],
    onError: (error: Error) => {
      throw error;
    },
  }), []);

  function handleChange(editorState: EditorState, editor: LexicalEditor) {
    const nextValue = editorState.read(() => {
      return serializeEditorText(editor);
    });

    if (nextValue !== normalizedValue) {
      onChange?.(nextValue);
    }
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative rounded-xl border border-zinc-200 bg-white shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
        <RichTextPlugin
          contentEditable={(
            <ContentEditable
              className={`w-full px-3 py-2 text-sm leading-6 text-zinc-800 outline-none ${minHeightClassName} ${className ?? ""}`.trim()}
              onBlur={onBlur}
              onFocus={onFocus}
            />
          )}
          placeholder={(
            <div className="pointer-events-none absolute left-3 top-2 whitespace-pre-wrap pr-6 text-sm leading-6 text-zinc-400">
              {placeholder}
            </div>
          )}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <SyncValuePlugin value={normalizedValue} variableLabels={variableLabels} />
        <TriggerMenuPlugin options={variableOptions} onInsert={() => undefined} />
      </div>
    </LexicalComposer>
  );
}
