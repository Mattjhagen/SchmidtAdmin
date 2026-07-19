// Proposal Edit & Revision Wrapper Screen
// Location: src/app/proposals/[id]/edit/page.tsx

'use client';

import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProposalEditor from '@/components/ProposalEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

function EditProposalForm({ proposalId }: { proposalId: string }) {
  const searchParams = useSearchParams();
  const versionId = searchParams?.get('version_id') || undefined;
  const reviseFlag = searchParams?.get('revise') === 'true';

  return (
    <ProposalEditor 
      proposalId={proposalId} 
      viewVersionId={versionId} 
      isRevision={reviseFlag} 
    />
  );
}

export default function EditProposalPage({ params }: PageProps) {
  const { id: proposalId } = use(params);

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading version details...</p>
      </div>
    }>
      <EditProposalForm proposalId={proposalId} />
    </Suspense>
  );
}
