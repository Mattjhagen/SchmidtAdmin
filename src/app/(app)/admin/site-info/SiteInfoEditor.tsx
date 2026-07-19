'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { siteContentDb, type SiteConfigMap } from '@/lib/db';

const fields: { key: keyof SiteConfigMap; label: string; multiline?: boolean; hint?: string }[] = [
  { key: 'phone', label: 'Phone Number', hint: 'Display format, e.g. (402) 555-0100' },
  { key: 'phone_href', label: 'Phone Link', hint: 'Format: tel:+14025550100' },
  { key: 'email', label: 'Email Address' },
  { key: 'address', label: 'Address', hint: 'Short form shown in footer, e.g. Omaha, NE' },
  { key: 'hours_weekday', label: 'Weekday Hours', hint: 'e.g. Monday–Friday: 7am–5pm' },
  { key: 'hours_weekend', label: 'Weekend Hours', hint: 'e.g. Saturday: By appointment' },
  { key: 'tagline', label: 'Tagline', hint: 'Shown in hero and footer' },
  { key: 'about_text', label: 'About Text', multiline: true, hint: 'Shown on the About page' },
];

export default function SiteInfoEditor() {
  const [config, setConfig] = useState<Partial<SiteConfigMap>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    siteContentDb.getSiteConfig().then(data => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await siteContentDb.updateSiteConfigBatch(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700">← Site Editor</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Site Info</h1>
        <p className="text-slate-500 text-sm mt-1">
          Changes update phone, email, hours, and about text across the entire public site.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
            {f.hint && <p className="text-xs text-slate-400 mb-1">{f.hint}</p>}
            {f.multiline ? (
              <textarea
                rows={4}
                value={config[f.key] ?? ''}
                onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            ) : (
              <input
                type="text"
                value={config[f.key] ?? ''}
                onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            )}
          </div>
        ))}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm font-medium">✓ Changes saved.</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
