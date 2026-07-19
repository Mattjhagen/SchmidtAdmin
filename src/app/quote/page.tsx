'use client';

import { useState } from 'react';

const SERVICES = [
  { id: 'retaining-wall', label: 'Retaining Wall', icon: '🧱', desc: 'Block, timber, boulder or commercial retaining walls' },
  { id: 'concrete', label: 'Concrete Driveway / Patio', icon: '🏗️', desc: 'Driveways, patios, sidewalks and flatwork' },
  { id: 'steps', label: 'Concrete Steps & Entryways', icon: '🪜', desc: 'Front porch steps, entryway landings and decorative stairs' },
  { id: 'kitchen', label: 'Kitchen Remodeling', icon: '🍳', desc: 'Full kitchen remodels and IKEA cabinet installation' },
  { id: 'drainage', label: 'Drainage Solution', icon: '💧', desc: 'French drains, yard drainage and grading' },
  { id: 'other', label: 'Other / Not Sure', icon: '💬', desc: 'Describe your project and we\'ll help' },
];

const WALL_MATERIALS = ['Block (Siena / Allan Block)', 'Timber', 'Boulder / Natural Stone', 'Concrete', 'Not sure — need recommendation'];
const CONCRETE_TYPES = ['Driveway', 'Patio', 'Sidewalk / Walkway', 'Pool deck', 'Other flatwork'];

type Step = 'service' | 'dimensions' | 'details' | 'contact' | 'done';

interface FormState {
  service: string;
  // wall
  wallMaterial: string;
  wallLength: string;
  wallHeight: string;
  // concrete
  concreteType: string;
  concreteArea: string;
  // shared
  existingStructure: string;
  timeline: string;
  notes: string;
  // contact
  name: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY: FormState = {
  service: '', wallMaterial: '', wallLength: '', wallHeight: '',
  concreteType: '', concreteArea: '', existingStructure: 'no',
  timeline: '', notes: '', name: '', phone: '', email: '', address: '',
};

export default function QuotePage() {
  const [step, setStep] = useState<Step>('service');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const selectedService = SERVICES.find(s => s.id === form.service);
  const isWall = form.service === 'retaining-wall';
  const isConcrete = ['concrete', 'steps'].includes(form.service);

  const wallArea = isWall && form.wallLength && form.wallHeight
    ? Math.round(Number(form.wallLength) * Number(form.wallHeight))
    : null;

  const estimateRange = () => {
    if (isWall && wallArea) {
      const low = Math.round(wallArea * 30 / 100) * 100;
      const high = Math.round(wallArea * 80 / 100) * 100;
      return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
    }
    if (isConcrete && form.concreteArea) {
      const sf = Number(form.concreteArea);
      const low = Math.round(sf * 8 / 100) * 100;
      const high = Math.round(sf * 18 / 100) * 100;
      return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
    }
    return null;
  };

  async function submit() {
    if (!form.name || !form.phone) {
      setError('Name and phone number are required.');
      return;
    }
    setSubmitting(true);
    setError('');

    const body = [
      `Service: ${selectedService?.label}`,
      isWall && form.wallMaterial ? `Material: ${form.wallMaterial}` : '',
      isWall && form.wallLength ? `Wall Length: ${form.wallLength} ft` : '',
      isWall && form.wallHeight ? `Wall Height: ${form.wallHeight} ft` : '',
      isWall && wallArea ? `Wall Area: ~${wallArea} SF` : '',
      isConcrete && form.concreteType ? `Concrete Type: ${form.concreteType}` : '',
      isConcrete && form.concreteArea ? `Approx Area: ${form.concreteArea} SF` : '',
      `Remove existing: ${form.existingStructure === 'yes' ? 'Yes' : 'No'}`,
      form.timeline ? `Timeline: ${form.timeline}` : '',
      form.address ? `Project Address: ${form.address}` : '',
      form.notes ? `\nAdditional notes:\n${form.notes}` : '',
      estimateRange() ? `\nCustomer's self-estimated range: ${estimateRange()}` : '',
    ].filter(Boolean).join('\n');

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('phone', form.phone);
    fd.append('email', form.email);
    fd.append('service', selectedService?.label || form.service);
    fd.append('body', body);

    try {
      const res = await fetch('/api/quote', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setStep('done');
      } else {
        setError(data.error || 'Something went wrong. Please call us at (402) 320-2600.');
      }
    } catch {
      setError('Network error. Please call us at (402) 320-2600.');
    }
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Schmidt Construction" style={{ height: 40, width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Schmidt Construction</span>
        </div>
        <a href="tel:+14023202600" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          (402) 320-2600
        </a>
      </div>

      {step === 'done' ? (
        <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '16px 0 8px' }}>Request Received!</h1>
          <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
            Thanks, {form.name}! We'll review your project details and reach out within 1 business day to schedule your free on-site estimate.
          </p>
          <p style={{ color: '#64748b', fontSize: 15, marginTop: 8 }}>
            Questions? Call us at{' '}
            <a href="tel:+14023202600" style={{ color: '#2563eb', fontWeight: 600 }}>(402) 320-2600</a>
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {(['service', 'dimensions', 'details', 'contact'] as Step[]).map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: ['service', 'dimensions', 'details', 'contact'].indexOf(step) >= i ? '#2563eb' : '#e2e8f0',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* Step 1: Service */}
          {step === 'service' && (
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>What can we help you with?</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Select the service you're interested in.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {SERVICES.map(s => (
                  <button key={s.id} onClick={() => { set('service', s.id); setStep('dimensions'); }}
                    style={{
                      border: `2px solid ${form.service === s.id ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '18px 16px', background: form.service === s.id ? '#eff6ff' : '#fff',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.4 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Dimensions */}
          {step === 'dimensions' && (
            <div>
              <button onClick={() => setStep('service')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16, fontSize: 14, padding: 0 }}>
                ← Back
              </button>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                {selectedService?.icon} {selectedService?.label}
              </h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Help us understand the scope of your project.</p>

              {isWall && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Wall material preference">
                    <select value={form.wallMaterial} onChange={e => set('wallMaterial', e.target.value)} style={selectStyle}>
                      <option value="">Select material...</option>
                      {WALL_MATERIALS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Approximate wall length (ft)">
                      <input type="number" min="0" value={form.wallLength} onChange={e => set('wallLength', e.target.value)} placeholder="e.g. 40" style={inputStyle} />
                    </Field>
                    <Field label="Approximate wall height (ft)">
                      <input type="number" min="0" value={form.wallHeight} onChange={e => set('wallHeight', e.target.value)} placeholder="e.g. 4" style={inputStyle} />
                    </Field>
                  </div>
                  {wallArea !== null && wallArea > 0 && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 15 }}>~{wallArea} SF wall face</div>
                      <div style={{ color: '#3b82f6', fontSize: 13, marginTop: 2 }}>Rough range: {estimateRange()}</div>
                      <div style={{ color: '#93c5fd', fontSize: 12, marginTop: 4 }}>Final price depends on site conditions, drainage, and material. Free on-site estimate is exact.</div>
                    </div>
                  )}
                </div>
              )}

              {isConcrete && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Type of concrete work">
                    <select value={form.concreteType} onChange={e => set('concreteType', e.target.value)} style={selectStyle}>
                      <option value="">Select type...</option>
                      {CONCRETE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Approximate area (sq ft)">
                    <input type="number" min="0" value={form.concreteArea} onChange={e => set('concreteArea', e.target.value)} placeholder="e.g. 500" style={inputStyle} />
                  </Field>
                  {form.concreteArea && Number(form.concreteArea) > 0 && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 15 }}>{form.concreteArea} SF</div>
                      <div style={{ color: '#3b82f6', fontSize: 13, marginTop: 2 }}>Rough range: {estimateRange()}</div>
                      <div style={{ color: '#93c5fd', fontSize: 12, marginTop: 4 }}>Includes excavation, forming, and finishing. Free on-site estimate is exact.</div>
                    </div>
                  )}
                </div>
              )}

              {!isWall && !isConcrete && (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>You can describe your project in the next step.</p>
              )}

              <div style={{ marginTop: 24 }}>
                <button onClick={() => setStep('details')} style={primaryBtn}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <div>
              <button onClick={() => setStep('dimensions')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16, fontSize: 14, padding: 0 }}>
                ← Back
              </button>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Project details</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>A few more questions to help us prepare.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Is there an existing structure that needs to be removed?">
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['yes', 'no', 'not sure'].map(v => (
                      <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 15 }}>
                        <input type="radio" name="existing" value={v} checked={form.existingStructure === v} onChange={() => set('existingStructure', v)} />
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Desired timeline">
                  <select value={form.timeline} onChange={e => set('timeline', e.target.value)} style={selectStyle}>
                    <option value="">Select timeline...</option>
                    <option>ASAP</option>
                    <option>Within 1 month</option>
                    <option>1–3 months</option>
                    <option>3–6 months</option>
                    <option>Just planning / no rush</option>
                  </select>
                </Field>
                <Field label="Project address (optional — helps us schedule)">
                  <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Omaha, NE" style={inputStyle} />
                </Field>
                <Field label="Anything else we should know?">
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Describe your project, any challenges, specific concerns..." rows={4}
                    style={{ ...inputStyle, resize: 'vertical' as const }} />
                </Field>
              </div>
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setStep('contact')} style={primaryBtn}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 'contact' && (
            <div>
              <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16, fontSize: 14, padding: 0 }}>
                ← Back
              </button>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Your contact info</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>We'll reach out to schedule your free on-site estimate.</p>

              {estimateRange() && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ color: '#15803d', fontWeight: 700, fontSize: 15 }}>Your rough estimate: {estimateRange()}</div>
                  <div style={{ color: '#16a34a', fontSize: 13, marginTop: 2 }}>A free on-site visit gives you the exact number.</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Full name *">
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" style={inputStyle} />
                </Field>
                <Field label="Phone number *">
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(402) 555-0100" style={inputStyle} />
                </Field>
                <Field label="Email address">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" style={inputStyle} />
                </Field>
              </div>

              {error && <p style={{ color: '#dc2626', marginTop: 12, fontSize: 14 }}>{error}</p>}

              <div style={{ marginTop: 24 }}>
                <button onClick={submit} disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Sending...' : 'Submit Quote Request'}
                </button>
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 10 }}>
                  No spam. We'll only contact you about your project.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, color: '#374151', fontSize: 14, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db',
  fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
};
const selectStyle: React.CSSProperties = { ...inputStyle, background: '#fff' };
const primaryBtn: React.CSSProperties = {
  background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10,
  padding: '13px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer',
  fontFamily: 'inherit', display: 'inline-block',
};
