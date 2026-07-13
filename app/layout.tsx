import type { Metadata } from "next";
import AppNavigation from "@/app/components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: {default: "RAG Workflow", template: "%s — RAG Workflow"},
  description: "Visual RAG workflow orchestration with Next.js, React Flow, PostgreSQL, Elasticsearch, Neo4j, ArangoDB, and dynamic OpenAPI tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="app-shell flex h-full min-h-0 flex-col">
        <AppNavigation />
        <main id="main-content" className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
