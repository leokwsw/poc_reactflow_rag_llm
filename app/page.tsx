import Workflow from "@/app/components/workflow";
import { defaultInitialEdges, defaultInitialNodes } from "@/app/components/workflow/default-data";

export default function Home() {
  return <Workflow initialNodes={defaultInitialNodes} initialEdges={defaultInitialEdges} />;
}
