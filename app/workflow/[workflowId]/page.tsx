import {notFound} from "next/navigation";
import {getWorkflowById, listWorkflowRuns} from "@/app/workflow/data";
import WorkflowStudio from "./workflow-studio";

type WorkflowStudioPageProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function WorkflowStudioPage({params}: WorkflowStudioPageProps) {
  const {workflowId} = await params;
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    notFound();
  }

  const recentRuns = await listWorkflowRuns(workflow.id, 10);

  return (
    <WorkflowStudio
      initialData={workflow.graph}
      recentRuns={recentRuns}
      workflowId={workflow.id}
      workflowTitle={workflow.title}
    />
  );
}
