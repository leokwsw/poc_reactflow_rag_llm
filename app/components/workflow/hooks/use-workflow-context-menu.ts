"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Node, ReactFlowInstance } from "reactflow";
import type { CustomNodeType } from "@/app/components/workflow/nodes/types";
import { createNodeAtPosition } from "@/app/components/workflow/node-defaults";

type ContextMenuState = {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
};

type UseWorkflowContextMenuOptions = {
  reactflow: ReactFlowInstance;
  wrapperRef: React.RefObject<HTMLElement | null>;
  nodes: Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  pushUndoSnapshot: () => void;
};

export function useWorkflowContextMenu({
  reactflow,
  wrapperRef,
  nodes,
  setNodes,
  pushUndoSnapshot,
}: UseWorkflowContextMenuOptions) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePaneContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();

    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    const flowPosition = reactflow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    if (!flowPosition)
      return;

    setContextMenu({
      x: event.clientX - (wrapperRect?.left ?? 0),
      y: event.clientY - (wrapperRect?.top ?? 0),
      flowX: flowPosition.x,
      flowY: flowPosition.y,
    });
  }, [reactflow, wrapperRef]);

  const handleOpenAddMenuFromControl = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect)
      return;

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const clientX = buttonRect.right + 8;
    const clientY = buttonRect.top + buttonRect.height / 2;
    const flowPosition = reactflow.screenToFlowPosition({ x: clientX, y: clientY });
    if (!flowPosition)
      return;

    setContextMenu({
      x: clientX - wrapperRect.left,
      y: clientY - wrapperRect.top,
      flowX: flowPosition.x,
      flowY: flowPosition.y,
    });
  }, [reactflow, wrapperRef]);

  const addNodeAtPointer = useCallback((type: CustomNodeType) => {
    if (!contextMenu)
      return;

    if (["start", "end"].includes(type) && nodesRef.current.some((node) => node.data.type === type))
      return;

    pushUndoSnapshot();
    const newNode = createNodeAtPosition(type, { x: contextMenu.flowX, y: contextMenu.flowY });

    setNodes((prev) => [...prev, newNode]);
    closeContextMenu();
  }, [closeContextMenu, contextMenu, pushUndoSnapshot, setNodes]);

  return {
    contextMenu,
    closeContextMenu,
    handlePaneContextMenu,
    handleOpenAddMenuFromControl,
    addNodeAtPointer,
  };
}
