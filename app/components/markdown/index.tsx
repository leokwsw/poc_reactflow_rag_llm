"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content: string;
  className?: string;
};

export default function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={`space-y-3 text-sm leading-6 text-zinc-800 ${className ?? ""}`.trim()}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: (props) => <h1 {...props} className="mb-3 mt-5 text-2xl font-semibold text-zinc-900" />,
          h2: (props) => <h2 {...props} className="mb-2 mt-5 text-xl font-semibold text-zinc-900" />,
          h3: (props) => <h3 {...props} className="mb-2 mt-4 text-lg font-semibold text-zinc-900" />,
          p: (props) => <p {...props} className="my-2 whitespace-pre-wrap break-words" />,
          ul: (props) => <ul {...props} className="my-2 list-disc pl-5" />,
          ol: (props) => <ol {...props} className="my-2 list-decimal pl-5" />,
          li: (props) => <li {...props} className="my-1" />,
          blockquote: (props) => <blockquote {...props} className="my-3 border-l-4 border-zinc-200 pl-4 text-zinc-600" />,
          hr: (props) => <hr {...props} className="my-4 border-zinc-200" />,
          table: (props) => (
            <div className="my-3 overflow-x-auto">
              <table {...props} className="w-full border-collapse text-left text-sm" />
            </div>
          ),
          th: (props) => <th {...props} className="border border-zinc-200 bg-zinc-50 px-3 py-2 font-medium" />,
          td: (props) => <td {...props} className="border border-zinc-200 px-3 py-2 align-top" />,
          pre: (props) => <pre {...props} className="my-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-50" />,
          a: (props) => (
            <a {...props} className="text-indigo-600 underline underline-offset-2 hover:text-indigo-500" target="_blank" rel="noreferrer" />
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
