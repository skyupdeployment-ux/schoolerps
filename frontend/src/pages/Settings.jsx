import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const EMPTY = {
  schoolName: '', address: '', phone: '', email: '', website: '',
  academicYear: '', currency: 'INR', timezone: 'Asia/Kolkata',
  gradingSystem: [],
  feeSettings: { lateFinePerDay: 0, receiptPrefix: '' },
  reportCardSettings: { showAttendance: true, showGrade: true },
};

const Field = ({ label, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
  </div>
);

export default function Settings() {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/settings');
        const d = res.data.data || {};
        setForm({
          ...EMPTY, ...d,
          feeSettings: { ...EMPTY.feeSettings, ...(d.feeSettings || {}) },
          reportCardSettings: { ...EMPTY.reportCardSettings, ...(d.reportCardSettings || {}) },
          gradingSystem: d.gradingSystem || [],
        });
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Could not load settings');
      } finally { setLoading(false); }
    })();
  }, []);

  const set  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setN = (group, k, v) => setForm(p => ({ ...p, [group]: { ...p[group], [k]: v } }));
  const setGrade = (i, k, v) => setForm(p => ({ ...p, gradingSystem: p.gradingSystem.map((g, j) => j === i ? { ...g, [k]: v } : g) }));
  const addGrade = () => setForm(p => ({ ...p, gradingSystem: [...p.gradingSystem, { grade: '', minPercent: 0, maxPercent: 100, points: 0 }] }));
  const delGrade = i => setForm(p => ({ ...p, gradingSystem: p.gradingSystem.filter((_, j) => j !== i) }));

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save settings');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm" style={{ color: '#64748b' }}>Loading settings…</p></div>;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">School information, academic year, fees and grading</p>
          {loadError && <p className="text-sm" style={{ color: '#dc2626' }}>{loadError}</p>}
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Settings</>}
        </button>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>School Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          <Field label="School Name *"><input required className="input-field" value={form.schoolName} onChange={e => set('schoolName', e.target.value)} /></Field>
          <Field label="Phone"><input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Email"><input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Website"><input className="input-field" value={form.website} onChange={e => set('website', e.target.value)} /></Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Address"><textarea rows={2} className="input-field" value={form.address} onChange={e => set('address', e.target.value)} /></Field>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Academic & Fees</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          <Field label="Academic Year"><input className="input-field" placeholder="2026-27" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} /></Field>
          <Field label="Currency"><input className="input-field" value={form.currency} onChange={e => set('currency', e.target.value)} /></Field>
          <Field label="Timezone"><input className="input-field" value={form.timezone} onChange={e => set('timezone', e.target.value)} /></Field>
          <Field label="Late Fine per Day"><input type="number" min="0" className="input-field" value={form.feeSettings.lateFinePerDay} onChange={e => setN('feeSettings', 'lateFinePerDay', e.target.value)} /></Field>
          <Field label="Receipt Prefix"><input className="input-field" placeholder="RCP" value={form.feeSettings.receiptPrefix} onChange={e => setN('feeSettings', 'receiptPrefix', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.reportCardSettings.showAttendance} onChange={e => setN('reportCardSettings', 'showAttendance', e.target.checked)} />
            Show attendance on report card
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.reportCardSettings.showGrade} onChange={e => setN('reportCardSettings', 'showGrade', e.target.checked)} />
            Show grade on report card
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Grading System</div>
          <button type="button" onClick={addGrade} className="btn-secondary"><Plus size={13} /> Add Grade</button>
        </div>
        {form.gradingSystem.length === 0 && <p className="text-sm" style={{ color: '#94a3b8' }}>No grades defined yet. Click "Add Grade" to start (for example A+ 90–100).</p>}
        {form.gradingSystem.map((g, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
            <Field label="Grade"><input className="input-field" value={g.grade} onChange={e => setGrade(i, 'grade', e.target.value)} /></Field>
            <Field label="Min %"><input type="number" min="0" max="100" className="input-field" value={g.minPercent} onChange={e => setGrade(i, 'minPercent', e.target.value)} /></Field>
            <Field label="Max %"><input type="number" min="0" max="100" className="input-field" value={g.maxPercent} onChange={e => setGrade(i, 'maxPercent', e.target.value)} /></Field>
            <Field label="Points"><input type="number" min="0" className="input-field" value={g.points} onChange={e => setGrade(i, 'points', e.target.value)} /></Field>
            <button type="button" onClick={() => delGrade(i)} style={{ padding: 9, borderRadius: 8, border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </form>
  );
}
