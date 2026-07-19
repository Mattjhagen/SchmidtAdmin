'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function AdminPreviewBar() {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const user = auth.getSessionUser();
    setVisible(!!user);
  }, []);

  if (!visible) return null;

  // Determine which edit link is most relevant for the current page
  const editHref = (() => {
    if (pathname === '/portfolio') return '/admin/portfolio';
    if (pathname?.startsWith('/about') || pathname === '/') return '/admin/site-info';
    // Service pages
    const serviceMatch = pathname?.match(/^\/([a-z-]+)$/);
    if (serviceMatch) return `/admin/services`;
    return '/admin';
  })();

  const editLabel = (() => {
    if (pathname === '/portfolio') return 'Edit Portfolio';
    if (pathname === '/') return 'Edit Site Info';
    if (pathname?.startsWith('/about')) return 'Edit About';
    const serviceMatch = pathname?.match(/^\/([a-z-]+)$/);
    if (serviceMatch) return 'Edit This Service';
    return 'Site Editor';
  })();

  return (
    <div className="w-full bg-slate-900 text-white z-[9999] no-print">
      {!collapsed ? (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Admin Preview
            </span>
            <span className="text-slate-400 text-xs hidden sm:block">
              You are viewing the public site as an admin.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={editHref}
              className="text-xs font-semibold bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-lg transition-colors"
            >
              ✏ {editLabel}
            </Link>
            <Link
              href="/admin"
              className="text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
            >
              All Editors
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1.5 transition-colors"
              aria-label="Collapse admin bar"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
        >
          Admin bar hidden — click to restore
        </button>
      )}
    </div>
  );
}
