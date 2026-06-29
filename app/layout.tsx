import type { Metadata } from "next";
import AppNavigation from "@/app/components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Workflow",
  description: "Visual RAG workflow orchestration with Next.js, React Flow, PostgreSQL, Elasticsearch, Neo4j, ArangoDB, and dynamic OpenAPI tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-full min-h-0 flex-col">
        <AppNavigation />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
