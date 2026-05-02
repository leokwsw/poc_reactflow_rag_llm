/** Same shape as JSON from `POST /api/file/upload`; use as `files` when calling `POST /api/datasets`. */
export type UploadFileRef = {
  id: string;
  file_name: string;
  file_size: number;
  mime: string;
};
