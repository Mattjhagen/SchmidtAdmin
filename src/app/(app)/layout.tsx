import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-300">Schmidt Construction</p>
          <p className="mt-1">50+ years of experience, personal service, premium quality, and clear estimates.</p>
          <p className="mt-2 text-slate-600">© {new Date().getFullYear()} Schmidt Construction. All rights reserved.</p>
        </div>
      </footer>
    </AuthGuard>
  );
}
