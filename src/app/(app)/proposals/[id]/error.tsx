'use client';

export default function ProposalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('Proposal page client error:', error.message, error.stack);
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <p className="text-slate-700 font-semibold">Something went wrong loading this proposal.</p>
      <p className="text-xs text-slate-400 max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl"
      >
        Try again
      </button>
    </div>
  );
}
