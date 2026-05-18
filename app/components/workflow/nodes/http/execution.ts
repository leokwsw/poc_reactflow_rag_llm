import {Agent as UndiciAgent} from "undici";
import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type HttpBodyType = "none" | "form-data" | "x-www-form-urlencoded" | "json" | "raw" | "binary";

type HttpKeyValueRow = {
  enabled?: boolean;
  name?: string;
  value?: string;
};

type HttpNodeData = {
  method?: HttpMethod;
  url?: string;
  headers?: HttpKeyValueRow[];
  params?: HttpKeyValueRow[];
  body_type?: HttpBodyType;
  body_form_data?: HttpKeyValueRow[];
  body_urlencoded?: HttpKeyValueRow[];
  body_json?: string;
  body_raw?: string;
  body_binary?: string;
  skip_ssl_verification?: boolean;
};

type FetchInitWithDispatcher = RequestInit & {
  dispatcher?: UndiciAgent;
};

const METHODS_WITHOUT_BODY = new Set<HttpMethod>(["GET", "HEAD"]);

const renderValue = (value: string | undefined, context: NodeExecutionContext) =>
  interpolateTemplate(value ?? "", context);

const getEnabledRows = (rows: HttpKeyValueRow[] | undefined, context: NodeExecutionContext) =>
  (rows ?? [])
    .filter((row) => row.enabled !== false && (row.name ?? "").trim())
    .map((row) => ({
      name: renderValue(row.name, context).trim(),
      value: renderValue(row.value, context),
    }))
    .filter((row) => row.name);

function buildUrl(rawUrl: string, params: HttpKeyValueRow[] | undefined, context: NodeExecutionContext) {
  const renderedUrl = renderValue(rawUrl, context).trim();
  if (!renderedUrl) {
    throw new Error(`HTTP node "${context.node.id}" is missing url.`);
  }

  const url = new URL(renderedUrl);
  for (const param of getEnabledRows(params, context)) {
    url.searchParams.append(param.name, param.value);
  }

  return url.toString();
}

function buildHeaders(rows: HttpKeyValueRow[] | undefined, context: NodeExecutionContext) {
  const headers = new Headers();
  for (const row of getEnabledRows(rows, context)) {
    headers.set(row.name, row.value);
  }
  return headers;
}

function setContentTypeIfMissing(headers: Headers, contentType: string) {
  if (!headers.has("content-type")) {
    headers.set("content-type", contentType);
  }
}

function buildRequestBody(data: HttpNodeData, headers: Headers, context: NodeExecutionContext): BodyInit | undefined {
  const bodyType = data.body_type ?? "none";

  if (bodyType === "none") {
    return undefined;
  }

  if (bodyType === "form-data") {
    const formData = new FormData();
    for (const row of getEnabledRows(data.body_form_data, context)) {
      formData.append(row.name, row.value);
    }
    return formData;
  }

  if (bodyType === "x-www-form-urlencoded") {
    const params = new URLSearchParams();
    for (const row of getEnabledRows(data.body_urlencoded, context)) {
      params.append(row.name, row.value);
    }
    setContentTypeIfMissing(headers, "application/x-www-form-urlencoded");
    return params.toString();
  }

  if (bodyType === "json") {
    const rendered = renderValue(data.body_json, context).trim();
    setContentTypeIfMissing(headers, "application/json");
    if (!rendered) {
      return "";
    }

    try {
      return JSON.stringify(JSON.parse(rendered));
    } catch {
      return rendered;
    }
  }

  if (bodyType === "raw") {
    setContentTypeIfMissing(headers, "text/plain");
    return renderValue(data.body_raw, context);
  }

  setContentTypeIfMissing(headers, "application/octet-stream");
  return new TextEncoder().encode(renderValue(data.body_binary, context));
}

async function parseResponseBody(response: Response) {
  if (response.status === 204 || response.status === 304) {
    return "";
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text) {
    return "";
  }

  if (contentType.includes("application/json") || contentType.includes("+json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

export async function executeHttpNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as HttpNodeData;
  const method = (data.method || "GET").toUpperCase() as HttpMethod;
  const url = buildUrl(data.url || "", data.params, context);
  const headers = buildHeaders(data.headers, context);
  const body = METHODS_WITHOUT_BODY.has(method)
    ? undefined
    : buildRequestBody(data, headers, context);

  const response = await fetch(url, {
    method,
    headers,
    body,
    ...(data.skip_ssl_verification ? {
      dispatcher: new UndiciAgent({
        connect: {
          rejectUnauthorized: false,
        },
      }),
    } : {}),
  } as FetchInitWithDispatcher);
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const responseBody = await parseResponseBody(response);

  return {
    output: {
      body: responseBody,
      status_code: response.status,
      headers: responseHeaders,
      ok: response.ok,
      url: response.url,
    },
    detail: `${method} ${response.status}`,
    traceInput: {
      method,
      url,
      headers: Object.fromEntries(headers.entries()),
      body_type: data.body_type ?? "none",
      skip_ssl_verification: data.skip_ssl_verification ?? false,
    },
    traceOutput: {
      body: responseBody,
      status_code: response.status,
      headers: responseHeaders,
    },
  };
}
