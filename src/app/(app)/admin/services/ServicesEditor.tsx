'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { siteContentDb, type ServiceOverride } from '@/lib/db';
import { services } from '@/content/services';
import ImageUploader from '@/components/admin/ImageUploader';

export default function ServicesEditor() {
  const [overrides, setOverrides] = useState<Record<string, ServiceOverride>>({});
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [form, setForm] = useState<{ long_description: string; image_url: string }>({
    long_description: '',
    image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    siteContentDb.getServiceOverrides().then(data => {
      const map: Record<string, ServiceOverride> = {};
      data.forEach(o => { map[o.slug] = o; });
      setOverrides(map);
      setLoading(false);
    });
  }, []);

  function openEdit(slug: string) {
    const svc = services.find(s => s.slug === slug)!;
    const override = overrides[slug];
    setForm({
      long_description: override?.long_description ?? svc.longDescription,
      image_url: override?.image_url ?? svc.image,
    });
    setActiveSlug(slug);
    setError(null);
    setSaved(false);
  }

  async function handleSave() {
    if (!activeSlug) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await siteContentDb.upsertServiceOverride(activeSlug, {
        long_description: form.long_description,
        image_url: form.image_url,
      });
      setOverrides(prev => ({
        ...prev,
        [activeSlug]: {
          slug: activeSlug,
          long_description: form.long_description,
          image_url: form.image_url,
          updated_at: new Date().toISOString(),
        },
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const activeSvc = services.find(s => s.slug === activeSlug);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700">← Site Editor</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Service Pages</h1>
        <p className="text-slate-500 text-sm mt-1">
          Edit the description and hero photo for each service page. Changes override the defaults.
        </p>
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Service list */}
        <div className="space-y-2">
          {services.map(svc => {
            const hasOverride = !!overrides[svc.slug];
            return (
              <button
                key={svc.slug}
                onClick={() => openEdit(svc.slug)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  activeSlug === svc.slug
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">{svc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{svc.name}</p>
                  {hasOverride && (
                    <p className="text-xs text-yellow-600">Custom content saved</p>
                  )}
                </div>
                <span className="text-slate-300 text-sm">›</span>
              </button>
            );
          })}
        </div>

        {/* Editor panel */}
        {activeSlug && activeSvc && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{activeSvc.icon}</span>
              <h2 className="font-bold text-slate-900">{activeSvc.name}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <p className="text-xs text-slate-400 mb-1">
                  Shown on the service page. Leave blank to use the default.
                </p>
                <textarea
                  rows={6}
                  value={form.long_description}
                  onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <ImageUploader
                currentUrl={form.image_url.startsWith('/') ? undefined : form.image_url}
                onUploaded={url => setForm(f => ({ ...f, image_url: url }))}
                label="Service Hero Photo"
              />

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {saved && <p className="text-green-600 text-sm font-medium">✓ Saved.</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href={`/${activeSvc.slug}`}
                  target="_blank"
                  className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2"
                >
                  Preview →
                </Link>
              </div>
            </div>
          </div>
        )}

        {!activeSlug && !loading && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm p-10">
            Select a service to edit
          </div>
        )}
      </div>
    </div>
  );
}
