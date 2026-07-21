// Main Navigation Header
// Location: src/components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isDemoMode } from '../lib/db';
import Image from 'next/image';
import { Users, Database, Settings, Award, Globe, Clock, MessageSquare, LucideIcon } from 'lucide-react';
import { auth, SessionUser } from '@/lib/auth';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(auth.getSessionUser());
  }, [pathname]);

  // If the user is on the client portal, we hide the admin header and navigation entirely.
  const isPortal = pathname?.startsWith('/portal');

  if (isPortal) {
    return (
      <header className="w-full bg-slate-900 border-b border-slate-800 text-white py-4 px-6 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Schmidt Construction Inc." width={140} height={48} className="h-10 w-auto" priority />
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Secure Client Portal</span>
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  const navItems: { name: string; href: string; icon: LucideIcon | null }[] = [
    { name: 'Dashboard', href: '/dashboard', icon: null },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Site Editor', href: '/admin', icon: Globe },
    { name: 'Time Clock', href: '/time-clock', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="w-full bg-slate-950 text-slate-100 border-b border-slate-800 premium-shadow no-print">
      {/* Demo Banner */}
      {isDemoMode && (
        <div className="bg-blue-700/90 text-blue-50 px-4 py-1.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 border-b border-blue-800/50">
          <Database className="h-3.5 w-3.5" />
          <span>Demo Mode: Running locally using browser LocalStorage. Changes are saved on this device.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center group">
              <Image src="/logo.png" alt="Schmidt Construction Inc." width={180} height={60} className="h-11 w-auto" priority />
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon: LucideIcon | null = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold border-b-2 border-blue-500 rounded-b-none'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Badges / Quick info */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-400">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span>50+ Years Quality</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                <span className={`h-2 w-2 rounded-full ${user?.role === 'admin' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <span className="font-medium text-slate-300">
                  {user?.role === 'admin' ? 'Admin Mode' : 'Estimator Mode'}
                </span>
              </div>
              <button
                onClick={async () => {
                  const { auth } = await import('@/lib/auth');
                  await auth.logout();
                  window.location.href = '/login';
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Footer Bar */}
      <div className="md:hidden flex justify-around border-t border-slate-800 bg-slate-900 py-2">
        {navItems.map((item) => {
          const MobileIcon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {MobileIcon && <MobileIcon className="h-5 w-5 mb-0.5" />}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
