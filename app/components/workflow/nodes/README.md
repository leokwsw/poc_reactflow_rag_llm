# Workflow Node Development Guide

This folder contains the workflow node implementations. Each node type should be added deliberately because the app keeps a strict allowlist of supported node types.

## Folder Structure

Create one folder per node type:

```text
app/components/workflow/nodes/my-node/
  ui.tsx
  panel.tsx
  execution.ts
```

You can start by copying:

```text
app/components/workflow/nodes/_template-node/
```

Rename the folder, component names, executor name, and type names before registering it.

- `ui.tsx`: React Flow node card shown on the canvas.
- `panel.tsx`: right-side settings panel for editing node data.
- `execution.ts`: runtime executor used by workflow runs.

Use shared building blocks from:

```text
app/components/workflow/nodes/_base/
```

Common examples include `BaseNode`, `NodeSection`, `NodeToken`, and panel form controls.

## Required Registry Updates

When adding a new node, update these files.

### 1. Add the node type

Edit:

```text
app/components/workflow/nodes/allowed.ts
```

Add the camelCase node type to `ALLOWED_CUSTOM_NODE_TYPES`.

Example:

```ts
"myNode"
```

This is the source of truth for `CustomNodeType` and runtime node validation.

### 2. Register the canvas UI

Edit:

```text
app/components/workflow/nodes/types.ts
```

Import the new `ui.tsx` component and add it to `NodeComponentMap`.

### 3. Register the settings panel

Edit:

```text
app/components/workflow/nodes/panels.tsx
```

Import the new `panel.tsx` component and add it to `nodeSettingsPanelMap`.

### 4. Register the executor

Edit:

```text
app/components/workflow/nodes/executors.ts
```

Import the executor from `execution.ts` and add it to `nodeExecutors`.

The executor signature is:

```ts
import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

export async function executeMyNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return {
    output: {},
    detail: "my-node",
  };
}
```

### 5. Add default node data

Edit:

```text
app/components/workflow/node-defaults.ts
```

Add a branch in `createNodeData(type)` so newly-created nodes have a label and sensible default fields.

### 6. Add it to the add-node menu

Edit:

```text
app/components/workflow/panel-contextmenu.tsx
```

Add the node to the `groups` list if users should be able to create it from the canvas menu.

## Optional Updates

### Imported graph compatibility

If external workflow JSON uses a kebab-case type, edit:

```text
app/components/workflow/default-data.ts
```

Add a mapping in `mapNodeType`.

Example:

```ts
case "my-node":
  return "myNode";
```

Also add any normalization logic in `buildNodeData` if imported data needs reshaping.

### Prompt variable outputs

If the node exposes named outputs for downstream prompt variables, edit:

```text
app/components/workflow/nodes/prompt-variable-options.ts
```

Add the node type to the `fields` switch in `getContextOptions`.

### Special runtime behavior

Most execution behavior belongs in the node's own `execution.ts`. Only edit shared runtime helpers when the behavior is genuinely cross-node:

```text
app/components/workflow/nodes/execution-utils.ts
app/components/workflow/nodes/execution-helpers.ts
app/lib/workflow-runner.ts
```

## Checklist

Before finishing a new node:

- Add `ui.tsx`, `panel.tsx`, and `execution.ts`.
- Add the type to `allowed.ts`.
- Register UI in `types.ts`.
- Register panel in `panels.tsx`.
- Register executor in `executors.ts`.
- Add defaults in `node-defaults.ts`.
- Add menu entry in `panel-contextmenu.tsx` when user-createable.
- Add import mapping in `default-data.ts` when external JSON needs it.
- Add prompt variable fields in `prompt-variable-options.ts` when the node has named outputs.
- Run `npm run build`.
- Run `npm run lint`.
