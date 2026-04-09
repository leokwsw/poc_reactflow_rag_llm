import {NodeProps} from "reactflow";
import {cloneElement, FC, ReactElement, useMemo} from "react";
import EntryNodeContainer, {StartNodeTypeEnum} from "@/app/components/workflow/nodes/entry-node-container";
import {NodeComponentMap} from "@/app/components/workflow/nodes/types";

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

  return isStartNode
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
        {/*{nodeData.type}*/}
      </BaseNode>
    </>
  )
}

export default CustomNode
