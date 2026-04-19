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

const QUESTION_CLASSIFIER_SYSTEM_PROMPT = `
You are a text classification engine that analyzes text data and assigns exactly one category.
Return only JSON.
The JSON must include: keywords, category_id, category_name.
`;

const QUESTION_CLASSIFIER_FEW_SHOTS = [
  {
    role: "user",
    content: `{"input_text":["I recently had a great experience with your company. The service was prompt and the staff was very friendly."],"categories":[{"category_id":"customer_service","category_name":"Customer Service"},{"category_id":"satisfaction","category_name":"Satisfaction"},{"category_id":"sales","category_name":"Sales"},{"category_id":"product","category_name":"Product"}],"classification_instructions":["classify the text based on the feedback provided by customer"]}`,
  },
  {
    role: "assistant",
    content: `{"keywords":["great experience","service","prompt","staff","friendly"],"category_id":"customer_service","category_name":"Customer Service"}`,
  },
  {
    role: "user",
    content: `{"input_text":["bad service, slow to bring the food"],"categories":[{"category_id":"food_quality","category_name":"Food Quality"},{"category_id":"experience","category_name":"Experience"},{"category_id":"price","category_name":"Price"}],"classification_instructions":[]}`,
  },
  {
    role: "assistant",
    content: `{"keywords":["bad service","slow","food"],"category_id":"experience","category_name":"Experience"}`,
  },
];

function extractJsonObject(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as {
      keywords?: string[];
      category_id?: string;
      category_name?: string;
    };
  } catch {
    return null;
  }
}

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
          content: QUESTION_CLASSIFIER_SYSTEM_PROMPT,
        },
        ...QUESTION_CLASSIFIER_FEW_SHOTS,
        {
          role: "user",
          content: JSON.stringify({
            input_text: [query],
            categories: classes.map((item) => ({
              category_id: item.id,
              category_name: item.name,
            })),
            classification_instructions: config.instruction ? [config.instruction] : [],
          }),
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
  const parsed = content ? extractJsonObject(content) : null;
  const selected = classes.find((item) => item.id === parsed?.category_id)
    ?? classes.find((item) => item.name === parsed?.category_name)
    ?? null;

  if (!selected) return null;

  return {
    selected,
    keywords: parsed?.keywords ?? [],
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
      keywords: modelResult?.keywords ?? [],
      usage: modelResult?.usage ?? {},
      model: modelResult?.model ?? config.model ?? null,
    },
    detail: `class=${selected.name}`,
    selectedSourceHandles: [selected.id],
  };
}
