import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, FileText, GitBranch, Settings, Sparkles } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAG Workflow Studio',
  description: 'Native RAG, Graph RAG and OpenAI-compatible model workflow PoC.',
};

const navItems = [
  { href: '/studio', label: 'Studio', icon: GitBranch },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/playground', label: 'Playground', icon: Sparkles },
  { href: '/settings/models', label: 'Models', icon: Database },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/studio" className="brand">
              <span className="brand-mark">R</span>
              <span>
                <strong>RAG Studio</strong>
                <small>Workflow PoC</small>
              </span>
            </Link>
            <nav className="nav-list" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-item">
                  <item.icon size={17} />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="sidebar-footer">
              <Settings size={16} />
              Local MVP
            </div>
          </aside>
          <main className="main-shell">{children}</main>
        </div>
      </body>
    </html>
  );
}
