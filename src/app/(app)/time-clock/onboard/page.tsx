'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardEmployee } from '@/app/actions/admin';
import Link from 'next/link';
import { ShieldCheck, Plus, RefreshCw, Copy, Check } from 'lucide-react';

export default function OnboardEmployeePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate a random temporary password
  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Email: ${email}\nTemporary Password: ${tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (tempPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const res = await onboardEmployee({ email, name, tempPassword });
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || 'Failed to onboard employee.');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Onboard New Employee</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Admin Control Console</p>
        </div>
        <Link href="/time-clock" className="text-blue-600 hover:underline text-sm font-medium">Back to Time Clock</Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              <p className="font-bold text-green-900 mb-1">Employee Account Created Successfully!</p>
              <p>They have been initialized in Supabase and default contractor settings have been configured. Upon their first login, they will be forced to choose a new password.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 relative">
              <button 
                onClick={handleCopy}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm transition-all"
                title="Copy Credentials"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Share Credentials</h3>
              <div className="space-y-1 text-sm font-mono text-slate-800">
                <p><span className="font-semibold text-slate-500 font-sans">Full Name:</span> {name}</p>
                <p><span className="font-semibold text-slate-500 font-sans">Email:</span> {email}</p>
                <p><span className="font-semibold text-slate-500 font-sans">Temp Password:</span> {tempPassword}</p>
              </div>
            </div>

            <div className="pt-4 flex space-x-4">
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setName('');
                  setTempPassword('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-semibold text-sm shadow-sm transition-all"
              >
                Onboard Another
              </button>
              <Link
                href="/time-clock"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-center text-white px-4 py-2 rounded-md font-semibold text-sm shadow-sm transition-all flex items-center justify-center"
              >
                Done
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@schmidt-construction.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Temporary Password *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md flex items-center space-x-1.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Generate</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">This temporary password must be changed by the employee during their initial login.</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-semibold text-sm shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? 'Creating Account...' : 'Onboard Employee'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
