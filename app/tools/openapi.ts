import {load as parseYaml} from "js-yaml";
import {createTool, type ToolAuthType, type ToolInput, type ToolKeyValueRow, type ToolMethod} from "@/app/tools/data";

type OpenApiSpec = {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    description?: string;
  };
  host?: string;
  basePath?: string;
  schemes?: string[];
  servers?: Array<{
    url?: string;
  }>;
  paths?: Record<string, Record<string, OpenApiOperation | unknown>>;
};

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: Record<string, {
      schema?: Record<string, unknown>;
    }>;
  };
};

type OpenApiParameter = {
  name?: string;
  in?: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: Record<string, unknown>;
};

export type ImportOpenApiInput = {
  name?: string;
  spec?: unknown;
  spec_text?: string;
  spec_url?: string;
  base_url?: string;
  auth_method?: "none" | "header" | "query";
  header_auth_type?: "basic" | "bearer" | "custom";
  auth_header_name?: string;
  auth_header_value?: string;
  query_auth_name?: string;
  query_auth_value?: string;
  auth_type?: ToolAuthType;
  auth_username?: string;
  auth_password?: string;
  auth_token?: string;
};

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseSpecText = (text: string): OpenApiSpec => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = parseYaml(text);
  }

  if (!isRecord(parsed)) {
    throw new Error("OpenAPI spec must be a JSON or YAML object.");
  }

  return parsed as OpenApiSpec;
};

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

const normalizePath = (path: string) => path.replace(/\{([^}]+)\}/g, ":$1");

const pathTemplate = (path: string) => path.replace(/\{([^}]+)\}/g, "{{#arg.$1#}}");

const ensureBaseUrl = (spec: OpenApiSpec, override?: string) => {
  if (override?.trim()) return override.trim().replace(/\/$/, "");
  const serverUrl = spec.servers?.find((server) => server.url)?.url;
  if (serverUrl) return serverUrl.replace(/\/$/, "");
  const scheme = spec.schemes?.[0] ?? "https";
  if (spec.host) return `${scheme}://${spec.host}${spec.basePath ?? ""}`.replace(/\/$/, "");
  throw new Error("OpenAPI spec is missing servers[0].url or Swagger host.");
};

const parseSpec = async (input: ImportOpenApiInput): Promise<OpenApiSpec> => {
  if (input.spec_url?.trim()) {
    const response = await fetch(input.spec_url.trim());
    if (!response.ok) {
      throw new Error(`OpenAPI URL returned HTTP ${response.status}.`);
    }
    return parseSpecText(await response.text());
  }
  if (input.spec_text?.trim()) return parseSpecText(input.spec_text.trim());
  if (isRecord(input.spec)) return input.spec as OpenApiSpec;
  throw new Error("Provide OpenAPI JSON/YAML spec, spec_text, or spec_url.");
};

const schemaForParameter = (param: OpenApiParameter) => ({
  ...(isRecord(param.schema) ? param.schema : {type: "string"}),
  ...(param.description ? {description: param.description} : {}),
});

const buildInputSchema = (operation: OpenApiOperation) => {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of operation.parameters ?? []) {
    if (!param.name || param.in === "cookie") continue;
    properties[param.name] = schemaForParameter(param);
    if (param.required) required.push(param.name);
  }

  const jsonBody = operation.requestBody?.content?.["application/json"]?.schema;
  if (jsonBody) {
    properties.body = {
      description: "JSON request body",
      ...jsonBody,
    };
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? {required} : {}),
  };
};

const row = (name: string, value: string): ToolKeyValueRow => ({
  id: crypto.randomUUID(),
  enabled: true,
  name,
  value,
});

const authRowsForImport = (input: ImportOpenApiInput) => {
  const authMethod = input.auth_method ?? "none";

  if (authMethod === "header" && input.header_auth_type === "custom" && input.auth_header_name?.trim()) {
    return {
      headers: [row(input.auth_header_name.trim(), input.auth_header_value ?? "")],
      params: [],
    };
  }

  if (authMethod === "query" && input.query_auth_name?.trim()) {
    return {
      headers: [],
      params: [row(input.query_auth_name.trim(), input.query_auth_value ?? "")],
    };
  }

  return {headers: [], params: []};
};

const authTypeForImport = (input: ImportOpenApiInput): ToolAuthType => {
  if (input.auth_method === "header" && input.header_auth_type === "basic") return "basic";
  if (input.auth_method === "header" && input.header_auth_type === "bearer") return "bearer";
  return input.auth_type ?? "none";
};

const buildToolInput = (options: {
  spec: OpenApiSpec;
  baseUrl: string;
  importId: string;
  path: string;
  method: ToolMethod;
  operation: OpenApiOperation;
  auth: Pick<ToolInput, "auth_type" | "auth_username" | "auth_password" | "auth_token">;
  authRows: {
    headers: ToolKeyValueRow[];
    params: ToolKeyValueRow[];
  };
}): Partial<ToolInput> => {
  const {spec, baseUrl, importId, path, method, operation, auth, authRows} = options;
  const pathParams = (operation.parameters ?? []).filter((param) => param.in === "path" && param.name);
  const queryParams = (operation.parameters ?? []).filter((param) => param.in === "query" && param.name);
  const headerParams = (operation.parameters ?? []).filter((param) => param.in === "header" && param.name);
  const operationName = operation.operationId || `${method.toLowerCase()}-${slug(path)}`;
  const renderedPath = pathParams.reduce(
    (current, param) => current.replace(`{${param.name}}`, `{{#arg.${param.name}#}}`),
    pathTemplate(path),
  );
  const hasJsonBody = Boolean(operation.requestBody?.content?.["application/json"]?.schema);
  const url = `${baseUrl}${renderedPath.startsWith("/") ? "" : "/"}${renderedPath}`;

  return {
    id: `tool-${slug(importId)}-${slug(operationName)}`,
    name: operation.summary || operation.operationId || `${method} ${normalizePath(path)}`,
    description: operation.description || operation.summary || spec.info?.description || "",
    method,
    url,
    base_url: baseUrl,
    path,
    headers: [
      ...authRows.headers,
      ...headerParams.map((param) => row(param.name!, `{{#arg.${param.name}#}}`)),
      ...(hasJsonBody ? [row("Content-Type", "application/json")] : []),
    ],
    params: [
      ...authRows.params,
      ...queryParams.map((param) => row(param.name!, `{{#arg.${param.name}#}}`)),
    ],
    body_type: hasJsonBody ? "json" : "none",
    body_json: hasJsonBody ? "{{#arg.body#}}" : "",
    body_raw: "",
    input_schema: buildInputSchema(operation),
    auth_type: auth.auth_type,
    auth_username: auth.auth_username,
    auth_password: auth.auth_password,
    auth_token: auth.auth_token,
    openapi_import_id: importId,
    openapi_operation_id: operation.operationId || operationName,
    enabled: true,
    skip_ssl_verification: false,
  };
};

export async function importOpenApiTools(input: ImportOpenApiInput) {
  const spec = await parseSpec(input);
  const baseUrl = ensureBaseUrl(spec, input.base_url);
  const importName = input.name?.trim() || spec.info?.title || "OpenAPI Tools";
  const importId = slug(importName || input.spec_url || `openapi-${Date.now()}`) || `openapi-${Date.now()}`;
  const authRows = authRowsForImport(input);
  const auth = {
    auth_type: authTypeForImport(input),
    auth_username: input.auth_username ?? "",
    auth_password: input.auth_password ?? "",
    auth_token: input.auth_token ?? "",
  };
  const created = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!isRecord(pathItem)) continue;
    for (const [rawMethod, rawOperation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(rawMethod) || !isRecord(rawOperation)) continue;
      const method = rawMethod.toUpperCase() as ToolMethod;
      const operation = rawOperation as OpenApiOperation;
      const tool = await createTool(buildToolInput({
        spec,
        baseUrl,
        importId,
        path,
        method,
        operation,
        auth,
        authRows,
      }));
      if (tool) created.push(tool);
    }
  }

  return {
    import_id: importId,
    count: created.length,
    tools: created,
  };
}
