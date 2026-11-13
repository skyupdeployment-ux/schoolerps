import { useEffect, useState } from 'react';
import { Plus, X, Loader, Trash2, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Used until the school saves its own timings (same defaults as the server)
const DEFAULT_ROWS = [
  { type: 'class', start: '09:00', end: '09:45' },
  { type: 'class', start: '09:45', end: '10:30' },
  { type: 'class', start: '10:30', end: '11:15' },
  { type: 'class', start: '11:15', end: '12:00' },
  { type: 'break', label: 'Lunch Break', start: '12:00', end: '12:45' },
  { type: 'class', start: '12:45', end: '13:30' },
  { type: 'class', start: '13:30', end: '14:15' },
  { type: 'class', start: '14:15', end: '15:00' },
  { type: 'class', start: '15:00', end: '15:45' }
];

const COMMON_SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education', 'Arts', 'Music', 'Library'];

// Tailwind needs full class names written out, so the palette is listed like this
const COLORS = [
  'bg-blue-50 text-blue-800 border-blue-200',
  'bg-green-50 text-green-800 border-green-200',
  'bg-purple-50 text-purple-800 border-purple-200',
  'bg-orange-50 text-orange-800 border-orange-200',
  'bg-pink-50 text-pink-800 border-pink-200',
  'bg-teal-50 text-teal-800 border-teal-200',
  'bg-yellow-50 text-yellow-800 border-yellow-200',
  'bg-indigo-50 text-indigo-800 border-indigo-200'
];
const colorFor = (subject = '') => {
  let h = 0;
  for (const ch of subject.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
};

// ── time helpers ─────────────────────────────────────────────────────────────
const to12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const range = (r) => `${to12(r.start)} - ${to12(r.end)}`;
const addMinutes = (t, mins) => {
  const [h, m] = t.split(':').map(Number);
  const total = Math.min(h * 60 + m + Number(mins || 0), 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
// class + extra rows get period numbers 1, 2, 3...; breaks have no number
const numberRows = (rows) => { let n = 0; return rows.map(r => (r.type === 'break' ? { ...r } : { ...r, no: ++n })); };

export default function TimetableGrid() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [modal, setModal] = useState(null); // { day, period, slot | null }
  const [form, setForm] = useState({ subject: '', teacher: '', room: '' });
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState(DEFAULT_ROWS);          // the school's period timings
  const [showExtra, setShowExtra] = useState(false);       // show empty extra-class rows
  const [timings, setTimings] = useState(null);            // draft rows while the editor is open
  const [savingTimings, setSavingTimings] = useState(false);
  const [gen, setGen] = useState({ start: '09:00', minutes: 45, count: 8 });

  const cls = classes.find(c => c._id === classId);
  const section = cls?.sections?.find(s => s._id === sectionId);

  // Load classes (with sections), teachers and period timings once
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/classes');
        const list = res.data.data || [];
        setClasses(list);
        const first = list.find(c => c.sections?.length) || list[0];
        if (first) { setClassId(first._id); setSectionId(first.sections?.[0]?._id || ''); }
      } catch { toast.error('Failed to load classes'); }
      finally { setLoadingClasses(false); }

      try {
        const res = await api.get('/teachers', { params: { limit: 100 } });
        const body = res.data;
        const list = Array.isArray(body) ? body : (body.data ?? body.teachers ?? []);
        setTeachers(list.filter(t => t.isActive !== false));
      } catch { /* teachers are optional */ }

      try {
        const res = await api.get('/timetable/periods');
        const r = res.data?.data?.rows;
        if (Array.isArray(r) && r.length) setRows(r);
      } catch { /* default timings stay */ }
    })();
  }, []);

  const fetchSlots = async (id = sectionId) => {
    if (!id) { setSlots([]); return; }
    setLoadingSlots(true);
    try {
      const res = await api.get('/timetable', { params: { section: id } });
      setSlots(Array.isArray(res.data.data) ? res.data.data : []);
    } catch { toast.error('Failed to load timetable'); setSlots([]); }
    finally { setLoadingSlots(false); }
  };

  useEffect(() => { fetchSlots(); }, [sectionId]);

  const onClassChange = (id) => {
    setClassId(id);
    const c = classes.find(x => x._id === id);
    setSectionId(c?.sections?.[0]?._id || '');
  };

  const slotAt = (day, period) => slots.find(s => s.day === day && s.period === period);

  // ── rows shown in the grid ─────────────────────────────────────────────────
  const periods = numberRows(rows);
  const extraNos = new Set(periods.filter(r => r.type === 'extra').map(r => r.no));
  const hasExtraRows = extraNos.size > 0;
  const hasExtraSlots = slots.some(s => extraNos.has(s.period));
  const visibleRows = periods.filter(r => r.type !== 'extra' || showExtra || hasExtraSlots);
  const periodRow = (no) => periods.find(p => p.no === no);
  const periodTime = (no) => { const p = periodRow(no); return p ? range(p) : ''; };
  const periodName = (p) => (p.type === 'extra' ? 'Extra class' : `Period ${p.no}`);

  // ── open / save one period ─────────────────────────────────────────────────
  const openCell = (day, period) => {
    const slot = slotAt(day, period);
    setForm({ subject: slot?.subject || '', teacher: slot?.teacher?._id || '', room: slot?.room || '' });
    setModal({ day, period, slot: slot || null });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/timetable/slot', {
        section: sectionId, day: modal.day, period: modal.period,
        subject: form.subject, teacher: form.teacher || null, room: form.room
      });
      toast.success('Period saved');
      setModal(null);
      fetchSlots();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving period'); }
    finally { setSaving(false); }
  };

  const clear = async () => {
    if (!modal.slot) return;
    setSaving(true);
    try {
      await api.delete(`/timetable/slot/${modal.slot._id}`);
      toast.success('Period cleared');
      setModal(null);
      fetchSlots();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to clear period'); }
    finally { setSaving(false); }
  };

  // ── timings editor ─────────────────────────────────────────────────────────
  const openTimings = (addExtra = false) => {
    const draft = rows.map(r => ({ ...r }));
    if (addExtra) {
      const lastEnd = draft.length ? draft[draft.length - 1].end : '16:00';
      draft.push({ type: 'extra', start: lastEnd, end: addMinutes(lastEnd, 45) });
    }
    setTimings(draft);
  };
  const updateRow = (i, patch) => setTimings(t => t.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => setTimings(t => t.filter((_, idx) => idx !== i));
  const moveRow = (i, dir) => setTimings(t => {
    const j = i + dir;
    if (j < 0 || j >= t.length) return t;
    const copy = [...t];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });
  const addRow = (type) => setTimings(t => {
    const lastEnd = t.length ? t[t.length - 1].end : '09:00';
    const len = type === 'break' ? 30 : 45;
    return [...t, { type, label: type === 'break' ? 'Break' : '', start: lastEnd, end: addMinutes(lastEnd, len) }];
  });
  const generate = () => {
    const count = Math.max(1, Math.min(12, Number(gen.count) || 1));
    const out = []; let cur = gen.start;
    for (let i = 0; i < count; i++) {
      const end = addMinutes(cur, gen.minutes);
      out.push({ type: 'class', start: cur, end });
      cur = end;
    }
    setTimings(out);
  };

  const saveTimings = async () => {
    const numbered = timings.filter(r => r.type !== 'break').length;
    if (!numbered) { toast.error('Add at least one class period'); return; }
    if (numbered > 12) { toast.error('Maximum 12 periods (extra classes included)'); return; }
    if (timings.some(r => !r.start || !r.end || r.end <= r.start)) { toast.error('Each row needs an end time after its start time'); return; }
    setSavingTimings(true);
    try {
      const res = await api.put('/timetable/periods', {
        rows: timings.map(r => ({ type: r.type, label: r.label || '', start: r.start, end: r.end }))
      });
      setRows(res.data.data.rows);
      toast.success('Timings saved');
      setTimings(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save timings'); }
    finally { setSavingTimings(false); }
  };

  const subjectSuggestions = [...new Set([...COMMON_SUBJECTS, ...teachers.map(t => t.department), ...slots.map(s => s.subject)].filter(Boolean))];

  if (loadingClasses) {
    return <div className="card flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (classes.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <p className="text-lg font-medium">No classes yet</p>
        <p className="text-sm mt-1">Add a class and a section in the Classes tab first, then come back to build its timetable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Class</label>
            <select className="input-field !w-56" value={classId} onChange={e => onClassChange(e.target.value)}>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.academicYear})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input-field !w-40" value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!cls?.sections?.length}>
              {!cls?.sections?.length && <option value="">No sections</option>}
              {cls?.sections?.map(s => <option key={s._id} value={s._id}>Section {s.name}</option>)}
            </select>
          </div>
          {section && (
            <p className="text-sm text-gray-500 pb-2">
              {cls.name} · Section {section.name}
              {section.classTeacher?.name ? ` · Class teacher: ${section.classTeacher.name}` : ''}
              {section.roomNumber ? ` · Room ${section.roomNumber}` : ''}
            </p>
          )}

          <div className="ml-auto flex flex-wrap gap-2">
            {hasExtraRows ? (
              <button type="button" className="btn-secondary" onClick={() => setShowExtra(v => !v)}>
                {showExtra ? 'Hide' : 'Show'} extra class periods
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => openTimings(true)}>
                <Plus size={14} /> Add extra class period
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={() => openTimings(false)}>
              <Clock size={14} /> Edit timings
            </button>
          </div>
        </div>
      </div>

      {!sectionId ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-lg font-medium">This class has no sections</p>
          <p className="text-sm mt-1">Open the Classes tab and click "+ Section" to add one (for example A).</p>
        </div>
      ) : (
        <div className="card p-4 relative">
          {loadingSlots && <div className="absolute top-3 right-4 text-gray-400"><Loader size={16} className="animate-spin" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1.5 min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-32 text-left text-xs font-semibold uppercase text-gray-400 px-2">Period</th>
                  {DAYS.map(d => <th key={d} className="text-xs font-semibold uppercase text-gray-500 py-2">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((p, idx) => (
                  p.type === 'break' ? (
                    <tr key={`b${idx}`}>
                      <td colSpan={DAYS.length + 1} className="text-center text-xs font-medium text-gray-400 bg-gray-50 rounded-lg py-2">
                        {p.label || 'Break'}  {range(p)}
                      </td>
                    </tr>
                  ) : (
                    <tr key={`p${p.no}`}>
                      <td className="px-2 align-middle">
                        <p className={`text-sm font-semibold ${p.type === 'extra' ? 'text-amber-700' : 'text-gray-700'}`}>{periodName(p)}</p>
                        <p className="text-xs text-gray-400">{range(p)}</p>
                      </td>
                      {DAYS.map(day => {
                        const s = slotAt(day, p.no);
                        return (
                          <td key={day} className="align-top">
                            {s ? (
                              <button onClick={() => openCell(day, p.no)} className={`w-full min-h-[68px] text-left p-2 rounded-lg border hover:shadow-sm transition ${colorFor(s.subject)}`}>
                                <p className="text-sm font-semibold leading-tight">{s.subject}</p>
                                {s.teacher?.name && <p className="text-xs opacity-80 mt-0.5">{s.teacher.name}</p>}
                                {s.room && <p className="text-xs opacity-60">Room {s.room}</p>}
                              </button>
                            ) : (
                              <button onClick={() => openCell(day, p.no)}
                                className={`w-full min-h-[68px] rounded-lg border border-dashed flex items-center justify-center transition ${p.type === 'extra' ? 'border-amber-300 text-amber-400 hover:bg-amber-50' : 'border-gray-200 text-gray-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40'}`}
                                title="Add period">
                                <Plus size={16} />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 px-1">
            Click any box to add or change a period. A teacher cannot be given two classes in the same period.
            Extra class periods only show for a class that uses them (use "Show extra class periods" to add one).
          </p>
        </div>
      )}

      {/* Period modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modal.day} · {periodRow(modal.period)?.type === 'extra' ? 'Extra class' : `Period ${modal.period}`}
                </h2>
                <p className="text-xs text-gray-400">{periodTime(modal.period)} · {cls?.name} Section {section?.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="label">Subject *</label>
                <input required list="tt-subjects" maxLength={60} className="input-field" placeholder="Mathematics" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                <datalist id="tt-subjects">{subjectSuggestions.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div>
                <label className="label">Teacher</label>
                <select className="input-field" value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}{t.department ? ` (${t.department})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Room</label>
                <input maxLength={20} className="input-field" placeholder="101" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t">
                <div>
                  {modal.slot && (
                    <button type="button" onClick={clear} disabled={saving} className="btn-secondary text-red-600"><Trash2 size={14} />Clear period</button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <><Loader size={14} className="animate-spin" /> Saving...</> : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timings editor */}
      {timings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">School timings</h2>
                <p className="text-xs text-gray-400">These times apply to every class's timetable.</p>
              </div>
              <button onClick={() => setTimings(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* quick setup */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                <p className="text-xs font-bold text-blue-900 mb-2">Quick setup (replaces the list below)</p>
                <div className="flex flex-wrap items-end gap-2">
                  <div><label className="label !text-xs">School starts</label><input type="time" className="input-field !w-32" value={gen.start} onChange={e => setGen(g => ({ ...g, start: e.target.value }))} /></div>
                  <div><label className="label !text-xs">Period length (min)</label><input type="number" min={10} max={120} className="input-field !w-28" value={gen.minutes} onChange={e => setGen(g => ({ ...g, minutes: e.target.value }))} /></div>
                  <div><label className="label !text-xs">Periods</label><input type="number" min={1} max={12} className="input-field !w-20" value={gen.count} onChange={e => setGen(g => ({ ...g, count: e.target.value }))} /></div>
                  <button type="button" className="btn-secondary" onClick={generate}>Generate</button>
                </div>
                <p className="text-[11px] text-blue-800/70 mt-2">Then use "+ Break" to add lunch/short breaks and move them into place with the arrows.</p>
              </div>

              {/* rows */}
              <div className="space-y-2">
                {numberRows(timings).map((r, i) => (
                  <div key={i} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2 ${r.type === 'extra' ? 'border-amber-200 bg-amber-50/50' : r.type === 'break' ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
                    <div className="flex flex-col">
                      <button type="button" onClick={() => moveRow(i, -1)} className="text-gray-400 hover:text-gray-700" title="Move up"><ChevronUp size={14} /></button>
                      <button type="button" onClick={() => moveRow(i, 1)} className="text-gray-400 hover:text-gray-700" title="Move down"><ChevronDown size={14} /></button>
                    </div>
                    <select className="input-field !w-36 !py-1.5" value={r.type} onChange={e => updateRow(i, { type: e.target.value })}>
                      <option value="class">Class period</option>
                      <option value="extra">Extra class</option>
                      <option value="break">Break</option>
                    </select>
                    {r.type === 'break' ? (
                      <input className="input-field !w-32 !py-1.5" maxLength={40} placeholder="Lunch Break" value={r.label || ''} onChange={e => updateRow(i, { label: e.target.value })} />
                    ) : (
                      <span className={`w-24 text-sm font-semibold ${r.type === 'extra' ? 'text-amber-700' : 'text-gray-700'}`}>
                        {r.type === 'extra' ? 'Extra class' : `Period ${r.no}`}
                      </span>
                    )}
                    <input type="time" className="input-field !w-32 !py-1.5" value={r.start} onChange={e => updateRow(i, { start: e.target.value })} />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="time" className="input-field !w-32 !py-1.5" value={r.end} onChange={e => updateRow(i, { end: e.target.value })} />
                    <button type="button" onClick={() => removeRow(i)} className="ml-auto p-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50" title="Remove"><X size={13} /></button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => addRow('class')}><Plus size={13} /> Period</button>
                <button type="button" className="btn-secondary" onClick={() => addRow('break')}><Plus size={13} /> Break</button>
                <button type="button" className="btn-secondary" onClick={() => addRow('extra')}><Plus size={13} /> Extra class</button>
                <button type="button" className="btn-secondary ml-auto" onClick={() => setTimings(DEFAULT_ROWS.map(r => ({ ...r })))}>Reset to default</button>
              </div>

              <p className="text-[11px] text-gray-400">
                Changing only the times is always safe. If you add, remove or move rows, saved periods stay attached to their period number,
                so check the timetable afterwards. Maximum 12 periods (extra classes included).
              </p>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
              <button type="button" className="btn-secondary" onClick={() => setTimings(null)}>Cancel</button>
              <button type="button" className="btn-primary" disabled={savingTimings} onClick={saveTimings}>
                {savingTimings ? <><Loader size={14} className="animate-spin" /> Saving...</> : 'Save timings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
