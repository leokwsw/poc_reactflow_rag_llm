"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const navItems = [
  {href: "/chat", label: "對話"},
  {href: "/workflow", label: "工作流"},
  {href: "/datasets", label: "知識庫"},
  {href: "/tools", label: "工具"},
  {href: "/automation", label: "自動化"},
  {href: "/model", label: "模型"},
];

const moreItems = [
  {href: "/playground", label: "Playground"},
  {href: "/mcp", label: "MCP"},
  {href: "/mcp-inspector", label: "MCP Inspector"},
];

function Mark() {
  return (
    <span aria-hidden="true" className="brand-mark">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <header className="app-navigation sticky top-0 z-40 shrink-0">
      <a className="skip-link" href="#main-content">跳到主要內容</a>
      <div className="mx-auto flex h-16 w-full max-w-[1600px] min-w-0 items-center gap-3 px-4 sm:px-6">
        <Link className="brand-link" href="/" aria-label="RAG Workflow 首頁">
          <Mark />
          <span className="hidden text-sm font-semibold tracking-[-0.01em] text-zinc-950 sm:block">RAG Workflow</span>
        </Link>
        <nav aria-label="主要導覽" className="nav-track">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`nav-item ${
                  isActive
                    ? "nav-item-active"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <details className="nav-more relative shrink-0">
          <summary aria-label="更多功能" className="nav-more-trigger"><span /><span /><span /></summary>
          <div className="nav-menu">
            <p>開發工具</p>
            {moreItems.map((item) => (
              <Link key={item.href} className={pathname.startsWith(item.href) ? "nav-menu-active" : ""} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
