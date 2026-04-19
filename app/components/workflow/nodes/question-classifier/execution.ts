import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type QuestionClass = {
  id: string;
  name: string;
};

type QuestionClassifierNodeData = {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  instruction?: string;
  classes?: QuestionClass[];
};

function pickClassByHeuristic(query: string, classes: QuestionClass[]) {
  const loweredQuery = query.toLowerCase();
  const matched = classes.find((item) => item.name && loweredQuery.includes(item.name.toLowerCase()));
  return matched ?? classes[0];
}

async function pickClassByModel(
  query: string,
  classes: QuestionClass[],
  config: QuestionClassifierNodeData,
) {
  const apiBaseUrl = (config.apiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  const model = config.model || process.env.OPENAI_MODEL;

  if (!apiKey || !model) return null;

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: config.instruction || "Classify the user query into one class. Reply with only the exact class id.",
        },
        {
          role: "user",
          content: [
            `Query: ${query}`,
            "Classes:",
            ...classes.map((item) => `- ${item.id}: ${item.name}`),
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
    usage?: Record<string, unknown>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  const selected = classes.find((item) => item.id === content) ?? classes.find((item) => item.name === content);

  if (!selected) return null;

  return {
    selected,
    usage: payload.usage ?? {},
    model,
  };
}

export async function executeQuestionClassifierNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const config = (context.node.data ?? {}) as QuestionClassifierNodeData;
  const classes = config.classes ?? [];

  if (classes.length === 0) {
    throw new Error(`Question classifier node "${context.node.id}" has no classes configured.`);
  }

  const modelResult = await pickClassByModel(context.input.query, classes, config);
  const selected = modelResult?.selected ?? pickClassByHeuristic(context.input.query, classes);

  return {
    output: {
      class_id: selected.id,
      class_name: selected.name,
      usage: modelResult?.usage ?? {},
      model: modelResult?.model ?? config.model ?? null,
    },
    detail: `class=${selected.name}`,
    selectedSourceHandles: [selected.id],
  };
}
