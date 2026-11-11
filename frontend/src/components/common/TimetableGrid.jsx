import { Fragment, useEffect, useState } from 'react';
import { Plus, X, Loader, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// >>> Change the period times here to match your school <<<
const PERIODS = [
  { no: 1, time: '09:00 - 09:45' },
  { no: 2, time: '09:45 - 10:30' },
  { no: 3, time: '10:30 - 11:15' },
  { no: 4, time: '11:15 - 12:00' },
  { no: 5, time: '12:45 - 01:30' },
  { no: 6, time: '01:30 - 02:15' },
  { no: 7, time: '02:15 - 03:00' },
  { no: 8, time: '03:00 - 03:45' }
];
const BREAK_AFTER = 4;                 // the lunch row is shown after this period
const BREAK_LABEL = 'Lunch Break  12:00 - 12:45';

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

  const cls = classes.find(c => c._id === classId);
  const section = cls?.sections?.find(s => s._id === sectionId);

  // Load classes (with sections) and teachers once
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

  const subjectSuggestions = [...new Set([...COMMON_SUBJECTS, ...teachers.map(t => t.department), ...slots.map(s => s.subject)].filter(Boolean))];
  const periodTime = (no) => PERIODS.find(p => p.no === no)?.time;

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
                  <th className="w-28 text-left text-xs font-semibold uppercase text-gray-400 px-2">Period</th>
                  {DAYS.map(d => <th key={d} className="text-xs font-semibold uppercase text-gray-500 py-2">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p => (
                  <Fragment key={p.no}>
                    <tr>
                      <td className="px-2 align-middle">
                        <p className="text-sm font-semibold text-gray-700">Period {p.no}</p>
                        <p className="text-xs text-gray-400">{p.time}</p>
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
                              <button onClick={() => openCell(day, p.no)} className="w-full min-h-[68px] rounded-lg border border-dashed border-gray-200 text-gray-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40 flex items-center justify-center transition" title="Add period">
                                <Plus size={16} />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {p.no === BREAK_AFTER && (
                      <tr>
                        <td colSpan={DAYS.length + 1} className="text-center text-xs font-medium text-gray-400 bg-gray-50 rounded-lg py-2">{BREAK_LABEL}</td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 px-1">Click any box to add or change a period. A teacher cannot be given two classes in the same period.</p>
        </div>
      )}

      {/* Period modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{modal.day} · Period {modal.period}</h2>
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
    </div>
  );
}