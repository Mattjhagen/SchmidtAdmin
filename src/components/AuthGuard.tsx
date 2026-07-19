'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = auth.getSessionUser();
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="mt-4 text-slate-500 text-sm font-medium">Verifying session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
