'use client';

import { useState, useEffect } from 'react';
import { getEmployees, getEmployeeTimeEntries, adminEditTimeEntry, adminCreateTimeEntry, adminDeleteTimeEntry } from '@/app/actions/admin';
import { ContractorSettings, TimeEntry } from '@/lib/types';
import Link from 'next/link';
import { Shield, Users, Clock, Plus, Edit2, Trash2, X, Check, Calendar } from 'lucide-react';

export default function AdminTimesheetsPage() {
  const [employees, setEmployees] = useState<ContractorSettings[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  // Add Form Inputs
  const [newClockIn, setNewClockIn] = useState('');
  const [newClockOut, setNewClockOut] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit Form Inputs
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('closed');
  const [editReason, setEditReason] = useState('');

  // Load employee list on mount
  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      const res = await getEmployees();
      setLoading(false);
      if (res.success && res.data) {
        setEmployees(res.data);
      } else {
        setError(res.error || 'Failed to load employees.');
      }
    };
    loadEmployees();
  }, []);

  // Load selected employee's entries
  const loadEntries = async (userId: string) => {
    if (!userId) {
      setTimeEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getEmployeeTimeEntries(userId);
    setLoading(false);
    if (res.success && res.data) {
      setTimeEntries(res.data);
    } else {
      setError(res.error || 'Failed to load time entries.');
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedEmployeeId(val);
    loadEntries(val);
  };

  // Create Manual Shift
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const payload = {
      clock_in: new Date(newClockIn).toISOString(),
      clock_out: newClockOut ? new Date(newClockOut).toISOString() : undefined,
      project: newProject,
      notes: newNotes,
    };

    const res = await adminCreateTimeEntry(selectedEmployeeId, payload);
    setLoading(false);

    if (res.success) {
      setSuccess('Manual time entry created successfully.');
      setShowAddModal(false);
      // Reset form
      setNewClockIn('');
      setNewClockOut('');
      setNewProject('');
      setNewNotes('');
      loadEntries(selectedEmployeeId);
    } else {
      setError(res.error || 'Failed to create time entry.');
    }
  };

  // Edit Shift
  const handleEditShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    const payload = {
      clock_in: new Date(editClockIn).toISOString(),
      clock_out: editClockOut ? new Date(editClockOut).toISOString() : null,
      project: editProject,
      notes: editNotes,
      status: editStatus,
    };

    const res = await adminEditTimeEntry(editingEntry.id, payload, editReason);
    setLoading(false);

    if (res.success) {
      setSuccess('Time entry updated successfully.');
      setShowEditModal(false);
      setEditingEntry(null);
      setEditReason('');
      loadEntries(selectedEmployeeId);
    } else {
      setError(res.error || 'Failed to update time entry.');
    }
  };

  // Delete Shift
  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry? This action is permanent.')) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await adminDeleteTimeEntry(id);
    setLoading(false);

    if (res.success) {
      setSuccess('Time entry deleted successfully.');
      loadEntries(selectedEmployeeId);
    } else {
      setError(res.error || 'Failed to delete time entry.');
    }
  };

  // Helper to format ISO strings for datetime-local input fields (YYYY-MM-DDTHH:MM)
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditClockIn(formatForInput(entry.clock_in));
    setEditClockOut(formatForInput(entry.clock_out || undefined));
    setEditProject(entry.project || '');
    setEditNotes(entry.notes || '');
    setEditStatus(entry.status);
    setShowEditModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="h-6 w-6 text-amber-600" />
            <span>Timesheet Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manual Overrides & Time Audits</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Link href="/time-clock" className="text-blue-600 hover:underline text-sm font-medium">Back to Time Clock</Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Select Employee Bar */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Users className="h-5 w-5 text-slate-500 shrink-0" />
          <label className="text-sm font-semibold text-slate-700 shrink-0">Select Employee:</label>
          <select
            value={selectedEmployeeId}
            onChange={handleEmployeeChange}
            className="flex-1 sm:w-64 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp.user_id} value={emp.user_id}>{emp.contractor_name}</option>
            ))}
          </select>
        </div>

        {selectedEmployeeId && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Manual Shift</span>
          </button>
        )}
      </div>

      {/* Time Entries Table */}
      {selectedEmployeeId ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Clock In</th>
                  <th className="px-6 py-4 text-left">Clock Out</th>
                  <th className="px-6 py-4 text-left">Project</th>
                  <th className="px-6 py-4 text-left">Notes</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {timeEntries.length > 0 ? (
                  timeEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {new Date(entry.clock_in).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.clock_out ? new Date(entry.clock_out).toLocaleString() : (
                          <span className="inline-flex px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full animate-pulse border border-green-200">Active Shift</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{entry.project || '—'}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{entry.notes || '—'}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          entry.status === 'open' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          entry.status === 'closed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {entry.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap space-x-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="inline-flex p-1.5 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit Shift"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(entry.id)}
                          className="inline-flex p-1.5 text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete Shift"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No time entries recorded for this employee.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl py-16 text-center text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Employee Selected</h3>
          <p className="text-sm max-w-sm mx-auto">Select a contractor from the dropdown above to view, modify, or add time records.</p>
        </div>
      )}

      {/* Add Manual Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-950 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Create Manual Shift</span>
              </h2>
            </div>
            <form onSubmit={handleAddShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clock In Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newClockIn}
                  onChange={(e) => setNewClockIn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clock Out Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={newClockOut}
                  onChange={(e) => setNewClockOut(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty if the shift is currently active.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project / Assignment</label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="e.g. Backyard Wall"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Reason for manual addition or job details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-semibold text-xs transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-xs transition-all shadow-sm flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
            <button 
              onClick={() => {
                setShowEditModal(false);
                setEditingEntry(null);
                setEditReason('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-950 flex items-center space-x-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <span>Override Time Entry</span>
              </h2>
            </div>
            <form onSubmit={handleEditShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clock In *</label>
                <input
                  type="datetime-local"
                  required
                  value={editClockIn}
                  onChange={(e) => setEditClockIn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clock Out</label>
                <input
                  type="datetime-local"
                  value={editClockOut}
                  onChange={(e) => setEditClockOut(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to leave this shift open.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project / Assignment</label>
                <input
                  type="text"
                  value={editProject}
                  onChange={(e) => setEditProject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed / Finished</option>
                  <option value="voided">Voided / Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">Reason for Edit *</label>
                <textarea
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Required for administrative timesheet audit trail..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEntry(null);
                    setEditReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-semibold text-xs transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-xs transition-all shadow-sm flex items-center space-x-1"
                >
                  <Check className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Apply Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
