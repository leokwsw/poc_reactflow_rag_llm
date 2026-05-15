import {NodeProps} from "reactflow";
import {cloneElement, FC, ReactElement, useMemo} from "react";
import EntryNodeContainer, {StartNodeTypeEnum} from "@/app/components/workflow/nodes/entry-node-container";
import {NodeComponentMap} from "@/app/components/workflow/nodes/types";
import {isCustomNodeType} from "@/app/components/workflow/nodes/allowed";

type NodeChildProps = {
  id: string
  data: NodeProps['data']
}

type BaseNodeProps = {
  children: ReactElement<Partial<NodeChildProps>>
  id: NodeProps['id']
  data: NodeProps['data']
}

const BaseNode: FC<BaseNodeProps> = (
  {
    id,
    data,
    children,
  }) => {

  const nodeContent = cloneElement(children, { id, data })

  const isEntryNode = data.type === "start"

  return isEntryNode
    ? (
      <EntryNodeContainer
        nodeType={data.type === "start" ? StartNodeTypeEnum.Start : StartNodeTypeEnum.Trigger}
      >
        {nodeContent}
      </EntryNodeContainer>
    )
    : nodeContent
}


const CustomNode = (props: NodeProps) => {
  const nodeData = props.data
  const nodeType = nodeData.type as unknown;
  const NodeComponent = useMemo(
    () => isCustomNodeType(nodeType) ? NodeComponentMap[nodeType] : null,
    [nodeType],
  )

  if (!NodeComponent) {
    return null;
  }

  return (
    <>
      <BaseNode id={props.id} data={props.data}>
        <NodeComponent/>
      </BaseNode>
    </>
  )
}

export default CustomNode
