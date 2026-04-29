import Link from "next/link";
import {createDatasetFromUpload} from "@/app/datasets/new/actions";

const acceptedFileTypes = ".pdf,.txt,.rtx,.rtf,.html,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx";

export default function NewDatasetPage() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <Link className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900" href="/datasets">
            Datasets
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">New Dataset</h1>
        </div>

        <form
          action={createDatasetFromUpload}
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Dataset Name</span>
              <input
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                name="title"
                placeholder="e.g. Customer Support Handbook"
                required
                type="text"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Description</span>
              <textarea
                className="min-h-24 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                name="description"
                placeholder="What should this dataset be used for?"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Files</span>
              <input
                accept={acceptedFileTypes}
                className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-6 text-sm text-zinc-600"
                multiple
                name="files"
                required
                type="file"
              />
              <span className="text-xs text-zinc-500">PDF, TXT, RTX, HTML, CSV, XLS, XLSX, DOC, DOCX, PPT, PPTX</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Link
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              href="/datasets"
            >
              Cancel
            </Link>
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              type="submit"
            >
              Upload and Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
