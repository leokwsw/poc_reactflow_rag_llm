import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import {getInputValue} from "@/app/components/workflow/nodes/_base/execution-helpers";
import { resolveModelConfig } from "@/app/model/data";

type QuestionClass = {
  id: string;
  name?: string;
  title?: string;
  value?: string;
};

type QuestionClassifierNodeData = {
  model?: string;
  instruction?: string;
  classes?: QuestionClass[];
  queryVariableSelector?: string[] | string;
};

const QUESTION_CLASSIFIER_SYSTEM_PROMPT = `
### Job Description',
You are a text classification engine that analyzes text data and assigns categories based on user input or automatically determined categories.
### Task
Your task is to assign one categories ONLY to the input text and only one category may be assigned returned in the output. Additionally, you need to extract the key words from the text that are related to the classification.
### Format
The input text is in the variable input_text. Categories are specified as a category list with two filed category_id and category_name in the variable categories. Classification instructions may be included to improve the classification accuracy.
### Constraint
DO NOT include anything other than the JSON array in your response.
### Memory
Here are the chat histories between human and assistant, inside <histories></histories> XML tags.
<histories>

</histories>
`;

const QUESTION_CLASSIFIER_FEW_SHOTS = [
  {
    "role": "user",
    "content": "\n    {\"input_text\": [\"I recently had a great experience with your company. The service was prompt and the staff was very friendly.\"],\n    \"categories\": [{\"category_id\":\"f5660049-284f-41a7-b301-fd24176a711c\",\"category_name\":\"Customer Service\"},{\"category_id\":\"8d007d06-f2c9-4be5-8ff6-cd4381c13c60\",\"category_name\":\"Satisfaction\"},{\"category_id\":\"5fbbbb18-9843-466d-9b8e-b9bfbb9482c8\",\"category_name\":\"Sales\"},{\"category_id\":\"23623c75-7184-4a2e-8226-466c2e4631e4\",\"category_name\":\"Product\"}],\n    \"classification_instructions\": [\"classify the text based on the feedback provided by customer\"]}\n",
  },
  {
    "role": "assistant",
    "content": "\n```json\n    {\"keywords\": [\"recently\", \"great experience\", \"company\", \"service\", \"prompt\", \"staff\", \"friendly\"],\n    \"category_id\": \"f5660049-284f-41a7-b301-fd24176a711c\",\n    \"category_name\": \"Customer Service\"}\n```\n",
  },
  {
    "role": "user",
    "content": "\n    {\"input_text\": [\"bad service, slow to bring the food\"],\n    \"categories\": [{\"category_id\":\"80fb86a0-4454-4bf5-924c-f253fdd83c02\",\"category_name\":\"Food Quality\"},{\"category_id\":\"f6ff5bc3-aca0-4e4a-8627-e760d0aca78f\",\"category_name\":\"Experience\"},{\"category_id\":\"cc771f63-74e7-4c61-882e-3eda9d8ba5d7\",\"category_name\":\"Price\"}],\n    \"classification_instructions\": []}\n",
  },
  {
    "role": "assistant",
    "content": "\n```json\n    {\"keywords\": [\"bad service\", \"slow\", \"food\", \"tip\", \"terrible\", \"waitresses\"],\n    \"category_id\": \"f6ff5bc3-aca0-4e4a-8627-e760d0aca78f\",\n    \"category_name\": \"Experience\"}\n```\n",
  },
] satisfies Array<{role: "user" | "assistant"; content: string}>;

type ClassifierMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ClassifierUsage = {
  prompt_tokens: number;
  prompt_unit_price: string;
  prompt_price_unit: string;
  prompt_price: string;
  completion_tokens: number;
  completion_unit_price: string;
  completion_price_unit: string;
  completion_price: string;
  total_tokens: number;
  total_price: string;
  currency: string;
  latency: number;
  time_to_first_token: number;
  time_to_generate: number;
};

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
  const matched = classes.find((item) => getClassName(item) && loweredQuery.includes(getClassName(item).toLowerCase()));
  return matched ?? classes[0];
}

function getClassName(item: QuestionClass) {
  return item.name || item.value || item.title || item.id;
}

function normalizeQueryVariableSelector(selector: QuestionClassifierNodeData["queryVariableSelector"]) {
  if (!selector) return "";
  if (Array.isArray(selector)) {
    if (selector.length === 0) return "";
    if (selector[0] === "sys" && selector[1] === "query") return "sys.query";
    return selector.join(".");
  }
  return selector;
}

function resolveClassifierQuery(context: NodeExecutionContext, config: QuestionClassifierNodeData) {
  const selector = normalizeQueryVariableSelector(config.queryVariableSelector);
  if (!selector) return context.input.query;

  const value = getInputValue(context, selector);
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return context.input.query;
  return JSON.stringify(value);
}

function buildClassifierMessages(
  query: string,
  classes: QuestionClass[],
  instruction?: string,
): ClassifierMessage[] {
  const classificationInstructions = instruction !== undefined ? [instruction] : [];
  return [
    {
      role: "system",
      content: QUESTION_CLASSIFIER_SYSTEM_PROMPT,
    },
    ...QUESTION_CLASSIFIER_FEW_SHOTS,
    {
      role: "user",
      content: `
    ${JSON.stringify({
      input_text: [query],
      categories: classes.map((item) => ({
        category_id: item.id,
        category_name: getClassName(item),
      })),
      classification_instructions: classificationInstructions,
    })}
`,
    },
  ];
}

function normalizeUsage(rawUsage: Record<string, unknown> | undefined, startedAt: number): ClassifierUsage {
  const promptTokens = typeof rawUsage?.prompt_tokens === "number" ? rawUsage.prompt_tokens : 0;
  const completionTokens = typeof rawUsage?.completion_tokens === "number" ? rawUsage.completion_tokens : 0;
  const totalTokens = typeof rawUsage?.total_tokens === "number"
    ? rawUsage.total_tokens
    : promptTokens + completionTokens;
  const latency = Number(((Date.now() - startedAt) / 1000).toFixed(3));

  return {
    prompt_tokens: promptTokens,
    prompt_unit_price: String(rawUsage?.prompt_unit_price ?? "0"),
    prompt_price_unit: String(rawUsage?.prompt_price_unit ?? "0"),
    prompt_price: String(rawUsage?.prompt_price ?? "0"),
    completion_tokens: completionTokens,
    completion_unit_price: String(rawUsage?.completion_unit_price ?? "0"),
    completion_price_unit: String(rawUsage?.completion_price_unit ?? "0"),
    completion_price: String(rawUsage?.completion_price ?? "0"),
    total_tokens: totalTokens,
    total_price: String(rawUsage?.total_price ?? "0"),
    currency: String(rawUsage?.currency ?? "USD"),
    latency,
    time_to_first_token: typeof rawUsage?.time_to_first_token === "number" ? rawUsage.time_to_first_token : latency,
    time_to_generate: typeof rawUsage?.time_to_generate === "number" ? rawUsage.time_to_generate : 0,
  };
}

async function pickClassByModel(
  query: string,
  classes: QuestionClass[],
  config: QuestionClassifierNodeData,
  messages: ClassifierMessage[],
) {
  const modelConfig = await resolveModelConfig(config.model);
  const api_base_url = modelConfig.api_base_url;
  const api_key = modelConfig.api_key;
  const model = modelConfig.model;

  if (!api_key || !model) return null;

  const startedAt = Date.now();
  const response = await fetch(`${api_base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages,
    }),
  });

  const payload = (await response.json()) as {
    error?: {message?: string};
    choices?: Array<{
      finish_reason?: string;
      message?: {
        content?: string;
      };
    }>;
    usage?: Record<string, unknown>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Question classifier request failed with status ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  const finishReason = payload.choices?.[0]?.finish_reason || "stop";
  const parsed = content ? extractJsonObject(content) : null;
  const selected = classes.find((item) => item.id === parsed?.category_id)
    ?? classes.find((item) => getClassName(item) === parsed?.category_name)
    ?? null;

  if (!selected) return null;

  return {
    selected,
    keywords: parsed?.keywords ?? [],
    usage: normalizeUsage(payload.usage, startedAt),
    finishReason,
    model,
    modelProvider: api_base_url,
    modelProfile: modelConfig.id,
  };
}

export async function executeQuestionClassifierNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const config = (context.node.data ?? {}) as QuestionClassifierNodeData;
  const classes = config.classes ?? [];

  if (classes.length === 0) {
    throw new Error(`Question classifier node "${context.node.id}" has no classes configured.`);
  }

  const query = resolveClassifierQuery(context, config);
  const messages = buildClassifierMessages(query, classes, config.instruction);
  const modelResult = await pickClassByModel(query, classes, config, messages);
  const selected = modelResult?.selected ?? pickClassByHeuristic(query, classes);
  const usage = modelResult?.usage ?? normalizeUsage(undefined, Date.now());
  const model = modelResult?.model ?? config.model ?? null;
  const output = {
    class_name: getClassName(selected),
    class_id: selected.id,
    usage,
  };

  return {
    output,
    detail: `class=${getClassName(selected)}`,
    selectedSourceHandles: [selected.id],
    traceInput: {
      query,
    },
    traceProcessData: {
      model_mode: "chat",
      prompts: messages.map((message) => ({
        role: message.role,
        text: message.content,
        files: [],
      })),
      usage,
      finish_reason: modelResult?.finishReason ?? "heuristic",
      model_provider: modelResult?.modelProvider ?? null,
      model_profile: modelResult?.modelProfile ?? config.model ?? null,
      model_name: model,
    },
    traceOutput: output,
  };
}
