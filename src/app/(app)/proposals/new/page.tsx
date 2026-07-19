// New Proposal Creation Wrap Screen
// Location: src/app/proposals/new/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ProposalEditor from '@/components/ProposalEditor';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

function NewProposalForm() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project_id') || undefined;
  const templateId = searchParams?.get('template_id') || undefined;

  if (!projectId) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 premium-shadow">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">Missing Project Reference</h3>
        <p className="text-slate-500 text-sm mt-1">A proposal estimate must be created for a specific project.</p>
        <Link href="/clients" className="mt-4 inline-flex items-center text-amber-500 font-semibold text-sm hover:underline">
          <span>Go to Clients & Projects Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <ProposalEditor projectId={projectId} templateId={templateId} />
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-slate-500 text-sm">Loading editor params...</p>
      </div>
    }>
      <NewProposalForm />
    </Suspense>
  );
}
