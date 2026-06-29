import * as cheerio from "cheerio";

export type DatasetSourceInput = {
  type?: string;
  url?: string;
  title?: string;
  text?: string;
  notion_page_id?: string;
};

export type PreparedDatasetSource = {
  displayName: string;
  mime: string;
  extension: string;
  bytes: Buffer;
  sourceType: string;
};

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

const safeSourceTitle = (value: string, fallback: string) =>
  value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96) || fallback;

async function fetchWebsiteText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "poc-reactflow-rag-llm/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Website fetch failed with status ${response.status}.`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer").remove();
  const title = cleanText($("title").first().text()) || url;
  return {
    title,
    text: cleanText($("body").text() || $.text()),
  };
}

async function fetchYoutubeText(url: string) {
  const endpoint = process.env.YOUTUBE_TRANSCRIPT_API_URL;
  if (!endpoint) {
    return {
      title: url,
      text: `YouTube source: ${url}\n\nSet YOUTUBE_TRANSCRIPT_API_URL to fetch transcripts during ingestion.`,
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({url}),
  });
  const payload = (await response.json().catch(() => ({}))) as {title?: string; text?: string; transcript?: string; error?: string};
  if (!response.ok) {
    throw new Error(payload.error ?? `YouTube transcript API failed with status ${response.status}.`);
  }
  return {
    title: payload.title || url,
    text: payload.text || payload.transcript || "",
  };
}

async function fetchAudioText(url: string) {
  const endpoint = process.env.AUDIO_TRANSCRIPTION_API_URL;
  if (!endpoint) {
    return {
      title: url,
      text: `Audio source: ${url}\n\nSet AUDIO_TRANSCRIPTION_API_URL to transcribe audio during ingestion.`,
    };
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({url}),
  });
  const payload = (await response.json().catch(() => ({}))) as {title?: string; text?: string; transcript?: string; error?: string};
  if (!response.ok) {
    throw new Error(payload.error ?? `Audio transcription API failed with status ${response.status}.`);
  }
  return {
    title: payload.title || url,
    text: payload.text || payload.transcript || "",
  };
}

async function fetchNotionText(source: DatasetSourceInput) {
  if (source.text?.trim()) {
    return {title: source.title || source.notion_page_id || "Notion page", text: source.text};
  }

  const token = process.env.NOTION_TOKEN;
  const pageId = source.notion_page_id || source.url?.split("/").pop();
  if (!token || !pageId) {
    return {
      title: source.title || "Notion page",
      text: `Notion source: ${source.url || source.notion_page_id || ""}\n\nSet NOTION_TOKEN and notion_page_id, or pass source.text, to ingest Notion content.`,
    };
  }

  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": process.env.NOTION_VERSION ?? "2022-06-28",
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    results?: Array<Record<string, unknown>>;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message ?? `Notion API failed with status ${response.status}.`);
  }

  const text = (payload.results ?? [])
    .map((block) => {
      const type = String(block.type ?? "");
      const value = block[type] as {rich_text?: Array<{plain_text?: string}>} | undefined;
      return value?.rich_text?.map((item) => item.plain_text ?? "").join("") ?? "";
    })
    .filter(Boolean)
    .join("\n\n");

  return {title: source.title || pageId, text};
}

export async function prepareDatasetSource(source: DatasetSourceInput): Promise<PreparedDatasetSource> {
  const type = String(source.type ?? "").toLowerCase();
  let extracted: {title: string; text: string};

  if (source.text?.trim() && (type === "text" || !source.url)) {
    extracted = {title: source.title || "Text source", text: source.text};
  } else if (type === "website" || type === "web" || type === "url") {
    if (!source.url) throw new Error("Website source requires url.");
    extracted = await fetchWebsiteText(source.url);
  } else if (type === "youtube") {
    if (!source.url) throw new Error("YouTube source requires url.");
    extracted = await fetchYoutubeText(source.url);
  } else if (type === "audio") {
    if (!source.url) throw new Error("Audio source requires url.");
    extracted = await fetchAudioText(source.url);
  } else if (type === "notion") {
    extracted = await fetchNotionText(source);
  } else {
    throw new Error(`Unsupported dataset source type "${source.type}".`);
  }

  const displayName = `${safeSourceTitle(source.title || extracted.title, type || "source")}.txt`;
  return {
    displayName,
    mime: "text/plain",
    extension: ".txt",
    bytes: Buffer.from(extracted.text || `${type} source: ${source.url ?? source.title ?? ""}`, "utf8"),
    sourceType: type || "text",
  };
}

