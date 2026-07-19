'use client';

import { useState, useEffect, useMemo } from 'react';
import { TimeEntry, TimeEntryBreak } from '@/lib/types';
import { clockIn, clockOut, startBreak, endBreak } from '@/app/actions/time-clock';

interface Props {
  activeEntry: TimeEntry | null;
}

export default function TimeClockDashboard({ activeEntry }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [project, setProject] = useState(activeEntry?.project || '');
  const [notes, setNotes] = useState(activeEntry?.notes || '');

  // Keep a live timer ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (actionFn: () => Promise<any>, requireProject = false) => {
    if (requireProject && !project.trim()) {
      setError('Please select or enter a project/assignment before clocking in.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await actionFn();
      if (res && res.success === false) {
        setError(res.error || 'An error occurred.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const activeBreak = activeEntry?.breaks?.find((b: TimeEntryBreak) => !b.end_time);
  const isOnBreak = !!activeBreak;
  const isClockedIn = !!activeEntry;

  // Calculate elapsed time securely based on server timestamp
  const { totalElapsedStr, statusColor, statusText } = useMemo(() => {
    if (!isClockedIn) {
      return { totalElapsedStr: '00:00:00', statusColor: 'bg-slate-100 text-slate-800', statusText: 'Off Duty' };
    }

    const clockInTime = new Date(activeEntry.clock_in).getTime();
    let grossElapsedMs = currentTime.getTime() - clockInTime;
    
    if (grossElapsedMs < 0) grossElapsedMs = 0; // Handle slight clock skew

    // Subtract break times
    let totalBreakMs = 0;
    activeEntry.breaks?.forEach((b: TimeEntryBreak) => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = b.end_time ? new Date(b.end_time).getTime() : currentTime.getTime();
      totalBreakMs += (bEnd - bStart);
    });

    let netElapsedMs = grossElapsedMs - totalBreakMs;
    if (netElapsedMs < 0) netElapsedMs = 0;

    const hours = Math.floor(netElapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((netElapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((netElapsedMs % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const totalElapsedStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    if (isOnBreak) {
      return { totalElapsedStr, statusColor: 'bg-yellow-100 text-yellow-800', statusText: 'On Break' };
    }
    return { totalElapsedStr, statusColor: 'bg-green-100 text-green-800', statusText: 'Working' };
  }, [activeEntry, currentTime, isClockedIn, isOnBreak]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center relative">
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-6 ${statusColor}`}>
          {statusText}
        </div>
        
        <div className="text-6xl sm:text-7xl font-mono font-bold text-slate-900 tracking-tight mb-8">
          {totalElapsedStr}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm text-left">
            {error}
          </div>
        )}

        <div className="space-y-4 text-left mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project / Assignment</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={isClockedIn}
              placeholder="e.g. 123 Maple St - Retaining Wall"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Work Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isClockedIn}
              placeholder="e.g. Demolition phase"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!isClockedIn ? (
            <button
              onClick={() => handleAction(() => clockIn({ project, notes }), true)}
              disabled={loading}
              className="col-span-2 py-4 bg-green-600 text-white rounded-lg font-bold text-xl shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Clock In
            </button>
          ) : (
            <>
              {isOnBreak ? (
                <button
                  onClick={() => handleAction(endBreak)}
                  disabled={loading}
                  className="py-4 bg-blue-600 text-white rounded-lg font-bold text-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  End Break
                </button>
              ) : (
                <button
                  onClick={() => handleAction(startBreak)}
                  disabled={loading}
                  className="py-4 bg-yellow-500 text-white rounded-lg font-bold text-lg shadow-sm hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                >
                  Start Break
                </button>
              )}
              
              <button
                onClick={() => handleAction(clockOut)}
                disabled={loading || isOnBreak}
                className={`py-4 text-white rounded-lg font-bold text-lg shadow-sm transition-colors ${
                  isOnBreak ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Clock Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
