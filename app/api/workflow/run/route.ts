import type { WorkflowDataType } from "@/app/components/workflow/types";
import { runWorkflow } from "@/app/lib/workflow-runner";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const workflowRaw = formData.get("workflow");
    const query = String(formData.get("query") ?? "");

    if (typeof workflowRaw !== "string") {
      return Response.json(
        {
          success: false,
          error: "Missing workflow payload.",
        },
        { status: 400 },
      );
    }

    const workflow = JSON.parse(workflowRaw) as WorkflowDataType;
    const files = await Promise.all(
      formData
        .getAll("files")
        .filter((entry): entry is File => entry instanceof File)
        .map(async (file) => {
          const isTextLike =
            file.type.startsWith("text/") ||
            /\.(md|mdx|txt|json|csv|tsv|js|ts|jsx|tsx|py|java|go|rs|swift|yaml|yml|xml|html|css)$/i.test(file.name);

          return {
            name: file.name,
            type: file.type,
            size: file.size,
            text: isTextLike ? await file.text() : undefined,
          };
        }),
    );

    const result = await runWorkflow(workflow, {
      query,
      files,
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Workflow execution failed.",
      },
      { status: 500 },
    );
  }
}
