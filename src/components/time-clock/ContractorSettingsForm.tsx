'use client';

import { useState } from 'react';
import { ContractorSettings } from '@/lib/types';
import { saveContractorSettings } from '@/app/actions/settings';

interface Props {
  initialSettings: ContractorSettings | null;
}

export default function ContractorSettingsForm({ initialSettings }: Props) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ContractorSettings>>({
    contractor_name: initialSettings?.contractor_name || '',
    company_name: initialSettings?.company_name || '',
    manager_name: initialSettings?.manager_name || '',
    manager_email: initialSettings?.manager_email || '',
    hourly_rate_cents: initialSettings?.hourly_rate_cents || 0,
    time_zone: initialSettings?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    additional_rate_enabled: initialSettings?.additional_rate_enabled ?? false,
    additional_rate_threshold_minutes: initialSettings?.additional_rate_threshold_minutes ?? 2400,
    additional_rate_multiplier: initialSettings?.additional_rate_multiplier ?? 1.5,
    auto_clock_out_enabled: initialSettings?.auto_clock_out_enabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await saveContractorSettings(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? 0 : Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">Settings saved successfully.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contractor Name</label>
          <input
            type="text"
            name="contractor_name"
            value={formData.contractor_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manager/Client Name</label>
          <input
            type="text"
            name="manager_name"
            value={formData.manager_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manager/Client Email</label>
          <input
            type="email"
            name="manager_email"
            value={formData.manager_email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time Zone</label>
          <select
            name="time_zone"
            value={formData.time_zone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {/* Minimal example, ideally use a robust timezone list */}
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Chicago">Central Time (US & Canada)</option>
            <option value="America/Denver">Mountain Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="UTC">UTC</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Used for automatic midnight clock-out calculations.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Base Rate (Cents)</label>
          <input
            type="number"
            name="hourly_rate_cents"
            value={formData.hourly_rate_cents}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            e.g. For $45.00/hr, enter 4500
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Earnings Configuration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="additional_rate_enabled"
              id="additional_rate_enabled"
              checked={formData.additional_rate_enabled}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label htmlFor="additional_rate_enabled" className="ml-2 block text-sm text-slate-900">
              Enable Additional Rate (e.g. for hours exceeding a threshold)
            </label>
          </div>

          {formData.additional_rate_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Rate Threshold (Minutes)</label>
                <input
                  type="number"
                  name="additional_rate_threshold_minutes"
                  value={formData.additional_rate_threshold_minutes}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  e.g. 2400 minutes for 40 hours.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Rate Multiplier</label>
                <input
                  type="number"
                  name="additional_rate_multiplier"
                  value={formData.additional_rate_multiplier}
                  onChange={handleChange}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  e.g. 1.5 for time-and-a-half.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Automation</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="auto_clock_out_enabled"
            id="auto_clock_out_enabled"
            checked={formData.auto_clock_out_enabled}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
          />
          <label htmlFor="auto_clock_out_enabled" className="ml-2 block text-sm text-slate-900">
            Enable Automatic Midnight Clock-out
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-500 pl-6">
          If enabled, any shift left open past midnight in your configured time zone will be securely closed and flagged for review.
        </p>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
