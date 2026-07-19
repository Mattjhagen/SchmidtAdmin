'use client';

import { useState } from 'react';
import { TimeEntry, TimesheetPeriod, TimesheetSubmission } from '@/lib/types';
import { resolveReviewFlag } from '@/app/actions/time-clock';
import { submitTimesheet, sendTimesheetSubmission } from '@/app/actions/timesheet';

interface Props {
  periods: TimesheetPeriod[];
  submissions: Partial<TimesheetSubmission>[];
  openEntries: TimeEntry[];
}

export default function TimesheetList({ periods, submissions, openEntries }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entriesNeedingReview = openEntries.filter(e => e.needs_review);
  
  // Quick logic to get this week's start/end dates
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const weekStart = new Date(today.setDate(diff));
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const handleResolve = async (id: string) => {
    setLoading(id);
    try {
      await resolveReviewFlag(id);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve flag');
    } finally {
      setLoading(null);
    }
  };

  const handleSubmitWeek = async () => {
    if (entriesNeedingReview.length > 0) {
      setError('You must resolve all flagged entries before submitting.');
      return;
    }
    setLoading('submit');
    setError(null);
    try {
      const res = await submitTimesheet(weekStartStr, weekEndStr);
      if (res && res.success === false) {
        setError(res.error || 'Failed to submit timesheet');
        return;
      }
      // Auto trigger email delivery Action
      const subId = res?.data?.id;
      if (subId) {
        const sendRes = await sendTimesheetSubmission(subId);
        if (sendRes && sendRes.success === false) {
          setError(sendRes.error || 'Failed to send timesheet email');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit timesheet');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

      {/* Review Flags Section */}
      {entriesNeedingReview.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Action Required: Resolve Flagged Shifts
          </h2>
          <div className="space-y-4">
            {entriesNeedingReview.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900">{new Date(entry.clock_in).toLocaleDateString()}</div>
                  <div className="text-sm text-slate-600">Reason: {entry.review_reason}</div>
                  <div className="text-xs text-red-600 font-medium mt-1">Status: {entry.status.toUpperCase()}</div>
                </div>
                <div className="space-x-3">
                  {/* Ideally an Edit Modal would open here to let them adjust the time, then resolve */}
                  <button 
                    disabled={loading === entry.id}
                    onClick={() => handleResolve(entry.id)}
                    className="px-3 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded text-sm font-medium disabled:opacity-50"
                  >
                    {loading === entry.id ? 'Resolving...' : 'Acknowledge & Resolve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Current Week ({weekStartStr} - {weekEndStr})</h2>
          <button
            onClick={handleSubmitWeek}
            disabled={loading === 'submit' || entriesNeedingReview.length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'submit' ? 'Submitting...' : 'Submit Timesheet'}
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-6 italic">
          Disclaimer: Earnings shown are gross 1099 contractor earnings before taxes, business expenses, or other deductions. No federal, state, or local taxes are calculated or withheld by this application.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-medium border-b border-slate-200">Date</th>
                <th className="py-3 px-4 font-medium border-b border-slate-200">Project</th>
                <th className="py-3 px-4 font-medium border-b border-slate-200">In</th>
                <th className="py-3 px-4 font-medium border-b border-slate-200">Out</th>
                <th className="py-3 px-4 font-medium border-b border-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {openEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">{new Date(entry.clock_in).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-600">{entry.project || '—'}</td>
                  <td className="py-3 px-4">{new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3 px-4">{entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</td>
                  <td className="py-3 px-4">
                    {entry.needs_review ? (
                      <span className="text-red-600 font-medium text-xs px-2 py-1 bg-red-50 rounded">Flagged</span>
                    ) : (
                      <span className="text-slate-600 capitalize">{entry.status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {openEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No shifts recorded recently.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Submission History</h2>
        
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium text-slate-900">Version {sub.version}</div>
                <div className="text-sm text-slate-500">Submitted: {new Date(sub.submitted_at!).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">Email: {sub.email_status || 'Pending'}</div>
                {/* PDF download link would go here */}
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="text-slate-500">No previous submissions found.</div>
          )}
        </div>
      </div>

    </div>
  );
}
