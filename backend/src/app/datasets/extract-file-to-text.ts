/**
 * Mirrors routing in rag_sys `file_extractor/service.py` → `extract_file_to_text`,
 * using Node equivalents for each extractor type.
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import chardet from "chardet";
import {parse} from "csv-parse/sync";
import iconv from "iconv-lite";
import {parseOffice} from "officeparser";
import ExcelJS from "exceljs";

const joinPages = (parts: string[]) =>
  parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");

/** Same spirit as Python `MarkdownExtractor.markdown_to_tups` + join. */
const markdownToPlain = (markdown: string): string => {
  const lines = markdown.split("\n");
  const tups: Array<[string | null, string]> = [];
  let currentHeader: string | null = null;
  let currentText = "";
  let codeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      codeBlock = !codeBlock;
      currentText += `${line}\n`;
      continue;
    }
    if (codeBlock) {
      currentText += `${line}\n`;
      continue;
    }
    if (/^#+\s/.test(line)) {
      tups.push([currentHeader, currentText]);
      currentHeader = line;
      currentText = "";
    } else {
      currentText += `${line}\n`;
    }
  }
  tups.push([currentHeader, currentText]);

  const cleaned = tups.map(([key, value]) => {
    const header = key ? key.replace(/#/g, "").trim() : null;
    const body = value.replace(/<.*?>/g, "").trim();
    return [header, body] as const;
  });

  return joinPages(
    cleaned.map(([header, body]) => {
      if (!body) return "";
      return header ? `${header}\n${body}` : body;
    }),
  );
};

const readFileWithAutodetect = (filePath: string): string => {
  const buf = fs.readFileSync(filePath);
  const guess = chardet.detect(buf);
  if (guess && iconv.encodingExists(guess)) {
    try {
      return iconv.decode(buf, guess);
    } catch {
      /* fall through */
    }
  }
  try {
    return buf.toString("utf8");
  } catch {
    return buf.toString("latin1");
  }
};

const extractHtml = (filePath: string): string => {
  const buf = fs.readFileSync(filePath);
  const $ = cheerio.load(buf);
  $("script, style").remove();
  return $.text().replace(/\s+/g, " ").trim();
};

const escapeCell = (v: unknown) => String(v ?? "").replace(/"/g, '\\"').trim();

const extractExcel = async (filePath: string): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const blocks: string[] = [];
  workbook.eachSheet((sheet) => {
    const headers: string[] = [];
    sheet.eachRow((row, rowNumber) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      if (rowNumber === 1) {
        values.forEach((value, index) => { headers[index] = escapeCell(value) || `Column ${index + 1}`; });
        return;
      }
      const entries = values
        .map((value, index) => [headers[index] || `Column ${index + 1}`, escapeCell(value)] as const)
        .filter(([, value]) => value);
      if (entries.length) blocks.push(entries.map(([key, value]) => `"${key}":"${value}"`).join(";"));
    });
  });
  return joinPages(blocks);
};

const extractCsv = (filePath: string): string => {
  const raw = readFileWithAutodetect(filePath);
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  const docs: string[] = [];
  for (const row of rows) {
    const content = Object.keys(row)
      .map((col) => `${col.trim()}: ${String(row[col] ?? "").trim()}`)
      .join("; ");
    if (content.trim()) docs.push(content);
  }
  return joinPages(docs);
};

const extractPdfViaOfficeParser = async (filePath: string): Promise<string> => {
  const ast = await parseOffice(filePath);
  return ast.toText();
};

const extractOfficeOpenXml = async (filePath: string): Promise<string> => {
  const ast = await parseOffice(filePath);
  return ast.toText();
};

const printableLatin1 = (filePath: string): string => {
  const buffer = fs.readFileSync(filePath);
  return buffer
    .toString("latin1")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Route by extension like `extract_file_to_text` in rag_sys `service.py`.
 * PPTX: Python converts via local HTTP service then PDF; here we parse PPTX directly with officeparser.
 * Images: Python converts to PDF then extracts; not used by current upload allow-list — omitted.
 */
export const extractFileToText = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".xlsx") {
    return extractExcel(filePath);
  }

  if (ext === ".pdf") {
    return extractPdfViaOfficeParser(filePath);
  }

  if (ext === ".md" || ext === ".markdown" || ext === ".mdx") {
    const text = readFileWithAutodetect(filePath);
    return markdownToPlain(text);
  }

  if (ext === ".htm" || ext === ".html") {
    return extractHtml(filePath);
  }

  if (ext === ".docx") {
    return extractOfficeOpenXml(filePath);
  }

  if (ext === ".pptx") {
    return extractOfficeOpenXml(filePath);
  }

  if (ext === ".csv") {
    return extractCsv(filePath);
  }

  if (ext === ".rtf") {
    try {
      return await extractOfficeOpenXml(filePath);
    } catch {
      return readFileWithAutodetect(filePath);
    }
  }

  if (ext === ".doc" || ext === ".ppt") {
    try {
      return await extractOfficeOpenXml(filePath);
    } catch {
      const fallback = printableLatin1(filePath);
      return (
        fallback ||
        `Legacy ${ext} file ${path.basename(filePath)} could not be parsed; try converting to ${ext === ".doc" ? ".docx" : ".pptx"}.`
      );
    }
  }

  return readFileWithAutodetect(filePath);
};
