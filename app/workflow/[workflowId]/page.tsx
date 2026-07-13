import {notFound} from "next/navigation";
import type {WorkflowRecord, WorkflowRunRecord} from "@/app/types/domain";
import {backendFetch} from "@/app/lib/backend-api";
import WorkflowStudio from "./workflow-studio";

type WorkflowStudioPageProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function WorkflowStudioPage({params}: WorkflowStudioPageProps) {
  const {workflowId} = await params;
  const result = await backendFetch<{workflow: WorkflowRecord}>(`/workflows/${workflowId}`).catch(() => null);
  const workflow = result?.workflow;
  if (!workflow) {
    notFound();
  }

  const {runs: recentRuns} = await backendFetch<{runs: WorkflowRunRecord[]}>(`/workflows/${workflow.id}/runs?limit=10`);

  return (
    <WorkflowStudio
      initialData={workflow.graph}
      recentRuns={recentRuns}
      workflowId={workflow.id}
      workflowTitle={workflow.title}
    />
  );
}
