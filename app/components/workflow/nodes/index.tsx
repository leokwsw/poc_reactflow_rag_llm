import {NodeProps} from "reactflow";
import {cloneElement, ComponentType, FC, ReactElement, useMemo} from "react";
import StartNode from "@/app/components/workflow/nodes/start-node";
import EndNode from "@/app/components/workflow/nodes/end-node";
import EntryNodeContainer, {StartNodeTypeEnum} from "@/app/components/workflow/nodes/entry-node-container";

const NodeComponentMap: Record<string, ComponentType<any>> = {
  ["start"]: StartNode,
  ["end"]: EndNode
}

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

  const nodeContent = (
    <div>
      Icon + Title
      {cloneElement(children, { id, data } as any)}
    </div>
  )

  const isStartNode = data.type === "start"
  const isEntryNode = isStartNode // isTriggerNode(data.type as any) || isStartNode

  return isEntryNode
    ? (
      <EntryNodeContainer
        nodeType={isStartNode ? StartNodeTypeEnum.Start : StartNodeTypeEnum.Trigger}
      >
        {nodeContent}
      </EntryNodeContainer>
    )
    : nodeContent
}


const CustomNode = (props: NodeProps) => {
  const nodeData = props.data
  const NodeComponent = useMemo(() => NodeComponentMap[nodeData.type], [nodeData.type])

  return (
    <>
      <BaseNode id={props.id} data={props.data}>
        <NodeComponent/>
      </BaseNode>
    </>
  )
}

export default CustomNode
