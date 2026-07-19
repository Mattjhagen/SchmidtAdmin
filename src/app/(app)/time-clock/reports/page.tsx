'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { ContractorSettings, TimeEntry, TimeEntryBreak } from '@/lib/types';
import { emailTimeClockReport } from '@/app/actions/timesheet';
import { Download, Mail, Calendar, DollarSign, Clock, FileText, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

interface ProjectAgg {
  project: string;
  hours: number;
  earnings: number;
}

interface MonthAgg {
  monthName: string;
  hours: number;
  earnings: number;
}

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<ContractorSettings | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [activeTab, setActiveTab] = useState<'annual' | 'daily' | 'weekly'>('annual');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  // Action States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Refs for PDF capturing
  const dailyReportRef = useRef<HTMLDivElement>(null);
  const weeklyReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSessionAndData = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);

          // Fetch contractor settings
          const { data: settingsData } = await supabase
            .from('contractor_settings')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          setSettings(settingsData);

          // Fetch all closed shifts
          const { data: entriesData } = await supabase
            .from('time_entries')
            .select(`
              *,
              breaks:time_entry_breaks(*)
            `)
            .eq('user_id', session.user.id)
            .eq('status', 'closed')
            .is('voided_at', null)
            .order('clock_in', { ascending: false });
          
          setEntries(entriesData || []);
        }
      } catch (err) {
        console.error('Error loading reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSessionAndData();
  }, []);

  // Helper: compute net duration in hours
  const getNetHours = (entry: TimeEntry): number => {
    if (!entry.clock_out) return 0;
    const grossMs = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
    let breakMs = 0;
    entry.breaks?.forEach((b: TimeEntryBreak) => {
      if (b.end_time) {
        breakMs += new Date(b.end_time).getTime() - new Date(b.start_time).getTime();
      }
    });
    const netMs = grossMs - breakMs;
    return Math.max(0, netMs / (1000 * 60 * 60));
  };

  // Helper: format currency
  const formatMoney = (cents: number): string => {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Compute Years with entries
  const availableYears = Array.from(new Set(entries.map(e => new Date(e.clock_in).getFullYear()))).sort((a, b) => b - a);
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }

  // Filter entries for the selected annual year
  const annualEntries = entries.filter(e => new Date(e.clock_in).getFullYear() === selectedYear);

  // Aggregates for Selected Year
  const { totalAnnualHours, totalAnnualEarnings, projectBreakdown, monthlyBreakdown } = (() => {
    let hours = 0;
    let earnings = 0;
    const projects: Record<string, ProjectAgg> = {};
    const months: Record<number, number> = {}; // month Index -> duration

    annualEntries.forEach(entry => {
      const netHours = getNetHours(entry);
      hours += netHours;
      
      const rateCents = settings?.hourly_rate_cents || 0;
      const grossCents = netHours * rateCents;
      earnings += grossCents;

      const projName = entry.project || 'General / Unassigned';
      if (!projects[projName]) {
        projects[projName] = { project: projName, hours: 0, earnings: 0 };
      }
      projects[projName].hours += netHours;
      projects[projName].earnings += grossCents;

      const monthIdx = new Date(entry.clock_in).getMonth(); // 0-11
      months[monthIdx] = (months[monthIdx] || 0) + netHours;
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthsArr: MonthAgg[] = monthNames.map((name, idx) => ({
      monthName: name,
      hours: months[idx] || 0,
      earnings: (months[idx] || 0) * (settings?.hourly_rate_cents || 0)
    }));

    return {
      totalAnnualHours: hours,
      totalAnnualEarnings: earnings,
      projectBreakdown: Object.values(projects).sort((a, b) => b.earnings - a.earnings),
      monthlyBreakdown: monthsArr
    };
  })();

  // Filter entries for selected daily date
  const dailyEntries = entries.filter(e => e.clock_in.startsWith(selectedDate));
  const { totalDailyHours, totalDailyEarnings, dailyShiftsForEmail } = (() => {
    let hours = 0;
    const rateCents = settings?.hourly_rate_cents || 0;
    const shiftsList = dailyEntries.map(e => {
      const h = getNetHours(e);
      hours += h;
      const earningsStr = formatMoney(h * rateCents);
      
      // Calculate total break duration
      let breakDurationMinutes = 0;
      e.breaks?.forEach(b => {
        if (b.end_time) {
          breakDurationMinutes += (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60);
        }
      });

      return {
        date: new Date(e.clock_in).toLocaleDateString(),
        project: e.project || 'General',
        clockIn: new Date(e.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: e.clock_out ? new Date(e.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
        duration: h.toFixed(2),
        breaks: breakDurationMinutes > 0 ? `${Math.round(breakDurationMinutes)}m` : 'None',
        earnings: earningsStr,
        notes: e.notes || ''
      };
    });

    return {
      totalDailyHours: hours,
      totalDailyEarnings: hours * rateCents,
      dailyShiftsForEmail: shiftsList
    };
  })();

  // Filter entries for selected weekly date range
  const { totalWeeklyHours, totalWeeklyEarnings, weeklyEntries, weeklyShiftsForEmail, weeklyEndDate } = (() => {
    const start = new Date(selectedWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().split('T')[0];

    const filtered = entries.filter(e => {
      const entryDate = e.clock_in.split('T')[0];
      return entryDate >= selectedWeekStart && entryDate <= endStr;
    });

    let hours = 0;
    const rateCents = settings?.hourly_rate_cents || 0;
    const shiftsList = filtered.map(e => {
      const h = getNetHours(e);
      hours += h;
      
      let breakDurationMinutes = 0;
      e.breaks?.forEach(b => {
        if (b.end_time) {
          breakDurationMinutes += (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60);
        }
      });

      return {
        date: new Date(e.clock_in).toLocaleDateString(),
        project: e.project || 'General',
        clockIn: new Date(e.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: e.clock_out ? new Date(e.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
        duration: h.toFixed(2),
        breaks: breakDurationMinutes > 0 ? `${Math.round(breakDurationMinutes)}m` : 'None',
        earnings: formatMoney(h * rateCents),
        notes: e.notes || ''
      };
    });

    return {
      totalWeeklyHours: hours,
      totalWeeklyEarnings: hours * rateCents,
      weeklyEntries: filtered,
      weeklyShiftsForEmail: shiftsList,
      weeklyEndDate: endStr
    };
  })();

  // PDF Export Trigger
  const handleDownloadPdf = async (type: 'daily' | 'weekly') => {
    const element = type === 'daily' ? dailyReportRef.current : weeklyReportRef.current;
    if (!element) return;

    setActionLoading('pdf');
    setActionMessage(null);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Schmidt-Construction-1099-${type}-report-${type === 'daily' ? selectedDate : selectedWeekStart}.pdf`);
      
      setActionMessage({ type: 'success', text: 'PDF report generated and downloaded successfully!' });
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Failed to generate PDF document.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Resend Email Trigger
  const handleSendEmail = async (type: 'daily' | 'weekly') => {
    if (!settings?.manager_email) {
      setActionMessage({ type: 'error', text: 'Manager email not configured. Please configure it in Time Clock Settings first.' });
      return;
    }

    setActionLoading('email');
    setActionMessage(null);

    try {
      const isWeekly = type === 'weekly';
      const hours = isWeekly ? totalWeeklyHours : totalDailyHours;
      const gross = isWeekly ? totalWeeklyEarnings : totalDailyEarnings;
      const shifts = isWeekly ? weeklyShiftsForEmail : dailyShiftsForEmail;
      const dateRange = isWeekly ? `${selectedWeekStart} to ${weeklyEndDate}` : selectedDate;

      // Calculate project breakdown
      const projMap: Record<string, { project: string; hours: number; earnings: number }> = {};
      const targetEntries = isWeekly ? weeklyEntries : dailyEntries;
      targetEntries.forEach(e => {
        const h = getNetHours(e);
        const name = e.project || 'General';
        if (!projMap[name]) {
          projMap[name] = { project: name, hours: 0, earnings: 0 };
        }
        projMap[name].hours += h;
        projMap[name].earnings += h * (settings?.hourly_rate_cents || 0);
      });

      const projectBreakdown = Object.values(projMap).map(p => ({
        project: p.project,
        hours: p.hours.toFixed(2),
        earnings: formatMoney(p.earnings)
      }));

      await emailTimeClockReport({
        contractorName: settings.contractor_name || 'Estimator',
        companyName: settings.company_name || 'Schmidt Construction',
        managerEmail: settings.manager_email,
        dateOrWeekRange: dateRange,
        isWeekly,
        totalHours: hours.toFixed(2),
        grossEarnings: formatMoney(gross),
        shifts,
        projectBreakdown
      });

      setActionMessage({ type: 'success', text: `Time clock report sent successfully to manager at ${settings.manager_email}!` });
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to deliver report email.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading reports dashboard…</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings Configuration Required</h1>
        <p className="text-slate-600 mb-6 max-w-lg mx-auto">
          Please configure your hourly earnings rate and manager details first in the settings page before compiling tax and session reports.
        </p>
        <Link href="/time-clock/settings" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Time Clock Reports</h1>
          <p className="text-slate-500 mt-1">Compile annual 1099 tax summaries and extract clean daily or weekly reports.</p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <Link href="/time-clock" className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
            Back to Dashboard
          </Link>
          <Link href="/time-clock/timesheets" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
            Timesheets
          </Link>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-100 p-1.5 rounded-xl max-w-md">
        <button
          onClick={() => { setActiveTab('annual'); setActionMessage(null); }}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'annual'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Annual 1099
        </button>
        <button
          onClick={() => { setActiveTab('daily'); setActionMessage(null); }}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'daily'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => { setActiveTab('weekly'); setActionMessage(null); }}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'weekly'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Weekly Report
        </button>
      </div>

      {/* Action Notifications */}
      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 border ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* --- ANNUAL 1099 REPORT TAB --- */}
      {activeTab === 'annual' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Year Selector */}
          <div className="flex items-center space-x-3 bg-white p-4 border border-slate-200 rounded-xl shadow-sm max-w-xs">
            <span className="text-sm font-bold text-slate-700">Tax Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Hours</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalAnnualHours.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(settings.hourly_rate_cents)}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Income</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(totalAnnualEarnings)}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proj. SE Tax (15.3%)</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(totalAnnualEarnings * 0.153)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Breakdown by Project / Assignment</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Project Name</th>
                      <th className="py-3 px-4 text-right">Hours</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Gross Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectBreakdown.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{p.project}</td>
                        <td className="py-3.5 px-4 text-right text-slate-600">{p.hours.toFixed(2)} hrs</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-950">{formatMoney(p.earnings)}</td>
                      </tr>
                    ))}
                    {projectBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">No shifts recorded for this year.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Monthly Earnings Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Month</th>
                      <th className="py-3 px-4 text-right">Hours</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Gross Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyBreakdown.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800">{m.monthName}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{m.hours.toFixed(2)} hrs</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-950">{formatMoney(m.earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="p-5 border border-amber-200 bg-amber-50/40 rounded-2xl flex items-start space-x-3 max-w-4xl">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed font-medium">
              <strong>1099 Compliance Notice:</strong> This summary compiling gross earnings is for contractor convenience only. The estimates here represent gross independent contractor earnings before self-employment tax, business expenses, and health insurance write-offs. This does not constitute professional tax advice or an official IRS Form 1099-NEC. Please consult a qualified CPA or tax advisor for year-end calculations.
            </div>
          </div>
        </div>
      )}

      {/* --- DAILY REPORT TAB --- */}
      {activeTab === 'daily' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Daily Selectors & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 p-6 rounded-2xl gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-slate-700">Choose Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                disabled={actionLoading !== null || dailyEntries.length === 0}
                onClick={() => handleDownloadPdf('daily')}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>{actionLoading === 'pdf' ? 'Generating...' : 'Download PDF'}</span>
              </button>
              <button
                disabled={actionLoading !== null || dailyEntries.length === 0}
                onClick={() => handleSendEmail('daily')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="h-4 w-4" />
                <span>{actionLoading === 'email' ? 'Sending...' : 'Send to Manager'}</span>
              </button>
            </div>
          </div>

          {dailyEntries.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl max-w-3xl mx-auto">
              <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold">No closed shifts recorded for {new Date(selectedDate).toLocaleDateString()}.</p>
            </div>
          ) : (
            /* Live letterhead preview container */
            <div className="bg-slate-200 p-8 rounded-2xl shadow-inner max-w-4xl mx-auto">
              <div className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wider mb-2">Live Document Letterhead Preview</div>
              
              <div ref={dailyReportRef} className="bg-white p-12 shadow-md max-w-[210mm] min-h-[297mm] mx-auto text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Accent line */}
                <div className="h-1.5 bg-[#206BD4] w-full mb-6"></div>
                
                {/* walls2.com Letterhead header */}
                <div className="flex justify-between border-b-2 border-slate-100 pb-6 mb-8">
                  <div>
                    <div className="text-2xl font-black text-slate-900 leading-none">SCHMIDT <span className="text-[#206BD4]">CONSTRUCTION</span></div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Omaha's Retaining Wall & Concrete Experts Since 1973</div>
                  </div>
                  <div className="text-right text-[10px] font-medium text-slate-500 leading-normal">
                    <div>Office: (402) 320-2600</div>
                    <div>mikiel@schmidt-construction.com</div>
                    <div className="text-[#206BD4] font-bold">www.walls2.com</div>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-none">Daily Contractor Statement</h2>
                    <div className="text-xs text-slate-500 mt-2 font-medium">Statement Date: <strong>{new Date(selectedDate).toLocaleDateString()}</strong></div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    1099 Contractor
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 border border-slate-100 rounded-xl p-5 bg-slate-50/50 mb-8 gap-4">
                  <div className="text-xs leading-normal">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contractor Details</div>
                    <div className="font-extrabold text-slate-900 text-sm">{settings.contractor_name}</div>
                    <div className="text-slate-500 font-semibold">{settings.company_name}</div>
                  </div>
                  <div className="text-xs leading-normal border-l border-slate-200 pl-6">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Summary</div>
                    <div className="text-base font-extrabold text-slate-900">{formatMoney(totalDailyEarnings)}</div>
                    <div className="text-slate-500 font-semibold">Total Hours: <strong>{totalDailyHours.toFixed(2)} hrs</strong></div>
                  </div>
                </div>

                {/* Shifts Table */}
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Shifts & Tasks Detailed</h3>
                <table className="w-full text-left text-xs mb-12">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border-b border-slate-200">Date/Time</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Project</th>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-center">Breaks</th>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-right">Duration</th>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyShiftsForEmail.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 px-3">{s.date}<br/><span className="text-[10px] text-slate-500 font-medium">{s.clockIn} - {s.clockOut}</span></td>
                        <td className="py-3.5 px-3 font-semibold text-slate-900">{s.project}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-center font-medium">{s.breaks}</td>
                        <td className="py-3.5 px-3 text-right font-semibold">{s.duration} hrs</td>
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-950">{s.earnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sign-off signatures */}
                <div className="grid grid-cols-2 gap-16 mt-16 pt-8 border-t border-slate-100">
                  <div>
                    <div className="border-b border-slate-300 h-8"></div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Contractor Signature</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 h-8"></div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Manager Approval Signature</div>
                  </div>
                </div>

                {/* Print Footer */}
                <div className="mt-20 border-t border-slate-100 pt-6 text-center">
                  <p className="text-[9px] text-slate-400 leading-relaxed max-w-xl mx-auto italic font-medium">
                    Disclaimer: This statement details gross earnings as an independent 1099 contractor for Schmidt Construction. No federal, state, or local taxes have been calculated or withheld. The contractor is solely responsible for all tax self-employment obligations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- WEEKLY REPORT TAB --- */}
      {activeTab === 'weekly' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Weekly Selectors & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 p-6 rounded-2xl gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-slate-700">Week Start (Monday):</span>
              <input
                type="date"
                value={selectedWeekStart}
                onChange={(e) => setSelectedWeekStart(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-slate-400 font-bold">Ends: {weeklyEndDate}</span>
            </div>

            <div className="flex gap-3">
              <button
                disabled={actionLoading !== null || weeklyEntries.length === 0}
                onClick={() => handleDownloadPdf('weekly')}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>{actionLoading === 'pdf' ? 'Generating...' : 'Download PDF'}</span>
              </button>
              <button
                disabled={actionLoading !== null || weeklyEntries.length === 0}
                onClick={() => handleSendEmail('weekly')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="h-4 w-4" />
                <span>{actionLoading === 'email' ? 'Sending...' : 'Send to Manager'}</span>
              </button>
            </div>
          </div>

          {weeklyEntries.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl max-w-3xl mx-auto">
              <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold">No closed shifts recorded for the week of {selectedWeekStart} to {weeklyEndDate}.</p>
            </div>
          ) : (
            /* Live letterhead preview container */
            <div className="bg-slate-200 p-8 rounded-2xl shadow-inner max-w-4xl mx-auto">
              <div className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wider mb-2">Live Document Letterhead Preview</div>
              
              <div ref={weeklyReportRef} className="bg-white p-12 shadow-md max-w-[210mm] min-h-[297mm] mx-auto text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Accent line */}
                <div className="h-1.5 bg-[#206BD4] w-full mb-6"></div>
                
                {/* walls2.com Letterhead header */}
                <div className="flex justify-between border-b-2 border-slate-100 pb-6 mb-8">
                  <div>
                    <div className="text-2xl font-black text-slate-900 leading-none">SCHMIDT <span className="text-[#206BD4]">CONSTRUCTION</span></div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Omaha's Retaining Wall & Concrete Experts Since 1973</div>
                  </div>
                  <div className="text-right text-[10px] font-medium text-slate-500 leading-normal">
                    <div>Office: (402) 320-2600</div>
                    <div>mikiel@schmidt-construction.com</div>
                    <div className="text-[#206BD4] font-bold">www.walls2.com</div>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-none">Weekly Contractor Statement</h2>
                    <div className="text-xs text-slate-500 mt-2 font-medium">Statement Period: <strong>{selectedWeekStart} to {weeklyEndDate}</strong></div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    1099 Contractor
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 border border-slate-100 rounded-xl p-5 bg-slate-50/50 mb-8 gap-4">
                  <div className="text-xs leading-normal">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contractor Details</div>
                    <div className="font-extrabold text-slate-900 text-sm">{settings.contractor_name}</div>
                    <div className="text-slate-500 font-semibold">{settings.company_name}</div>
                  </div>
                  <div className="text-xs leading-normal border-l border-slate-200 pl-6">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Summary</div>
                    <div className="text-base font-extrabold text-slate-900">{formatMoney(totalWeeklyEarnings)}</div>
                    <div className="text-slate-500 font-semibold">Total Hours: <strong>{totalWeeklyHours.toFixed(2)} hrs</strong></div>
                  </div>
                </div>

                {/* Shifts Table */}
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Shifts & Tasks Detailed</h3>
                <table className="w-full text-left text-xs mb-12">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border-b border-slate-200">Date/Time</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Project</th>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-center">Breaks</th>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-right">Duration</th>
                      <th className="py-2.5 px-3 border-b border-slate-200 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weeklyShiftsForEmail.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 px-3">{s.date}<br/><span className="text-[10px] text-slate-500 font-medium">{s.clockIn} - {s.clockOut}</span></td>
                        <td className="py-3.5 px-3 font-semibold text-slate-900">{s.project}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-center font-medium">{s.breaks}</td>
                        <td className="py-3.5 px-3 text-right font-semibold">{s.duration} hrs</td>
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-950">{s.earnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sign-off signatures */}
                <div className="grid grid-cols-2 gap-16 mt-16 pt-8 border-t border-slate-100">
                  <div>
                    <div className="border-b border-slate-300 h-8"></div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Contractor Signature</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 h-8"></div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Manager Approval Signature</div>
                  </div>
                </div>

                {/* Print Footer */}
                <div className="mt-20 border-t border-slate-100 pt-6 text-center">
                  <p className="text-[9px] text-slate-400 leading-relaxed max-w-xl mx-auto italic font-medium">
                    Disclaimer: This statement details gross earnings as an independent 1099 contractor for Schmidt Construction. No federal, state, or local taxes have been calculated or withheld. The contractor is solely responsible for all tax self-employment obligations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
