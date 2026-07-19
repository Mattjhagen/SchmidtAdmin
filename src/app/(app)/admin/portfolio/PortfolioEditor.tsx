'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { siteContentDb, type PortfolioItem } from '@/lib/db';
import ImageUploader from '@/components/admin/ImageUploader';
import { services } from '@/content/services';

const emptyForm = (): Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'> => ({
  title: '',
  location: '',
  service_slug: services[0]?.slug ?? '',
  service_name: services[0]?.name ?? '',
  description: '',
  image_url: '',
  featured: false,
  sort_order: 0,
});

export default function PortfolioEditor() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    siteContentDb.getPortfolioItems().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  function openNew() {
    setForm(emptyForm());
    setEditingId('new');
    setError(null);
  }

  function openEdit(item: PortfolioItem) {
    setForm({
      title: item.title,
      location: item.location,
      service_slug: item.service_slug,
      service_name: item.service_name,
      description: item.description,
      image_url: item.image_url,
      featured: item.featured,
      sort_order: item.sort_order,
    });
    setEditingId(item.id);
    setError(null);
  }

  function handleServiceChange(slug: string) {
    const svc = services.find(s => s.slug === slug);
    setForm(f => ({ ...f, service_slug: slug, service_name: svc?.name ?? '' }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingId === 'new') {
        const created = await siteContentDb.createPortfolioItem(form);
        if (created) setItems(prev => [...prev, created]);
      } else if (editingId) {
        const updated = await siteContentDb.updatePortfolioItem(editingId, form);
        if (updated) setItems(prev => prev.map(i => i.id === editingId ? updated : i));
      }
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this portfolio item?')) return;
    try {
      await siteContentDb.deletePortfolioItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700">← Site Editor</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Portfolio</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Project
        </button>
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {!loading && items.length === 0 && editingId !== 'new' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No portfolio items yet. Add your first project above.
        </div>
      )}

      {/* Edit / New Form */}
      {editingId && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">
            {editingId === 'new' ? 'New Project' : 'Edit Project'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Terraced Block Wall System"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Omaha, NE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
              <select
                value={form.service_slug}
                onChange={e => handleServiceChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {services.map(s => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Brief description of the project..."
            />
          </div>

          <div className="mb-4">
            <ImageUploader
              currentUrl={form.image_url}
              onUploaded={(url) => setForm(f => ({ ...f, image_url: url }))}
              label="Project Photo"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                className="rounded border-slate-300"
              />
              Featured (shown on homepage)
            </label>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-20 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-2xl">
              {item.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                : '🏗️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>
                {item.featured && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Featured</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{item.location} · {item.service_name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{item.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openEdit(item)}
                className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
