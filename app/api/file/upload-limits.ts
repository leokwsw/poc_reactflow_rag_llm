/** Limits for `POST /api/file/upload`. */
export const maxFileSize = 20 * 1024 * 1024;

export const allowedExtensions = new Set([
  ".pdf",
  ".txt",
  ".rtx",
  ".rtf",
  ".html",
  ".htm",
  ".csv",
  ".xls",
  ".xlsx",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
]);
