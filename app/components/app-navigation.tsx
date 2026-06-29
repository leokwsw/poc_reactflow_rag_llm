"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const navItems = [
  {href: "/workflow", label: "Workflow"},
  {href: "/datasets", label: "Datasets"},
  {href: "/tools", label: "Tools"},
  {href: "/playground", label: "Playground"},
  {href: "/model", label: "Model"},
  {href: "/mcp", label: "MCP"},
  {href: "/mcp-inspector", label: "MCP Inspector"},
];

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-zinc-200/80 bg-white/95 px-5 shadow-sm backdrop-blur">
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <Link className="text-sm font-semibold text-zinc-950" href="/">
          RAG Workflow
        </Link>
        <nav className="flex max-w-full overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-100 p-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
