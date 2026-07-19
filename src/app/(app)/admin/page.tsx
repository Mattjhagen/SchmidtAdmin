import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Site Editor' };

const sections = [
  {
    href: '/admin/portfolio',
    icon: '🖼️',
    title: 'Portfolio',
    description: 'Add, edit, and delete completed project photos.',
  },
  {
    href: '/admin/site-info',
    icon: '📞',
    title: 'Site Info',
    description: 'Update phone number, email, business hours, and about text.',
  },
  {
    href: '/admin/services',
    icon: '🧱',
    title: 'Service Pages',
    description: 'Edit service descriptions and photos shown on each service page.',
  },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Site Editor</h1>
        <p className="text-slate-500 text-sm mt-1">
          Changes made here appear on the public website immediately after saving.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-yellow-400 hover:shadow-md transition-all group"
          >
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className="font-bold text-slate-900 group-hover:text-yellow-700 transition-colors mb-1">
              {s.title}
            </h2>
            <p className="text-sm text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to Estimator Dashboard
        </Link>
      </div>
    </div>
  );
}
