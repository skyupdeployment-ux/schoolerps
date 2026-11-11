// @ts-nocheck
// CLASSES & TIMETABLE — real data only (backend/src/routes/classesManage.js + timetableManage.js).
// Each card is one class section ("Class 10 – A"). Teachers come from the Teachers page.
import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronDown, Users,
  UserCheck, GraduationCap, Clock, AlertTriangle, Info, LayoutGrid, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import TimetableGrid from '../components/common/TimetableGrid';

// ── Constants ─────────────────────────────────────────────────────────────────
// value = grade number saved in the database (0 for pre-primary)
const GRADES = [
  { label:'Nursery', grade:0 }, { label:'LKG', grade:0 }, { label:'UKG', grade:0 },
  ...Array.from({ length:12 }, (_, i) => ({ label:`Class ${i + 1}`, grade:i + 1 })),
];
const STREAMS  = ['Science', 'Commerce', 'Arts'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STREAM_COLOR = { Science:['#dbeafe','#1d4ed8'], Commerce:['#dcfce7','#16a34a'], Arts:['#fce7f3','#be185d'] };

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const currentAcademicYear = () => {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${pad((y + 1) % 100)}`;
};
const yearOptions = (extra = []) => {
  const y = parseInt(currentAcademicYear(), 10);
  return [...new Set([...extra, ...[y - 2, y - 1, y, y + 1].map(v => `${v}-${pad((v + 1) % 100)}`)])].sort().reverse();
};
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const errMsg = (err, fallback = 'Something went wrong') => {
  const r = err?.response;
  if (!r) return 'Cannot reach the server — is the backend running?';
  if (r.status === 429) return 'Too many requests — wait a minute and try again';
  if (r.data?.message) return r.data.message;
  return fallback;
};
const streamOf = (name = '') => STREAMS.find(s => new RegExp(`\\b${s}\\b`, 'i').test(name)) || '';
const className = (gradeLabel, stream) => (stream ? `${gradeLabel} ${stream}` : gradeLabel);

const Sel = ({ label, required, children, style = {}, ...p }) => (
  <div>
    {label && <label className="label">{label}{required && ' *'}</label>}
    <div style={{ position:'relative' }}>
      <select required={required} className="input-field" style={{ appearance:'none', paddingRight:28, ...style }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const BLANK = () => ({ gradeLabel:'Class 1', stream:'', section:'A', academicYear: currentAcademicYear(), classTeacher:'', roomNumber:'', capacity:'' });

// ══════════════════════════════════════════════════════════════════════════════
// CLASSES TAB
// ══════════════════════════════════════════════════════════════════════════════
function ClassesTab() {
  const [classes, setClasses]   = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees]         = useState({}); // classId -> yearly total for the current academic year
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState({ classes:'', teachers:'' });
  const [search, setSearch]     = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [view, setView]         = useState('grid');
  const [modal, setModal]       = useState(null); // { mode:'add'|'edit', section?, cls?, form }
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    // loaded separately: if one fails, the other still shows (and the real error is shown)
    const [c, t] = await Promise.allSettled([
      api.get('/classes'),
      api.get('/teachers', { params: { limit: 200 } }),
    ]);
    const errs = { classes:'', teachers:'' };
    if (c.status === 'fulfilled') setClasses(c.value.data.data || []);
    else { errs.classes = errMsg(c.reason, 'Could not load classes'); toast.error(`Classes: ${errs.classes}`, { duration: 8000 }); }
    if (t.status === 'fulfilled') setTeachers((t.value.data.data || []).filter(x => x.isActive !== false));
    else { errs.teachers = errMsg(t.reason, 'Could not load teachers'); toast.error(`Teachers: ${errs.teachers}`, { duration: 8000 }); }
    setLoadErr(errs);
    setLoading(false);
    // optional: yearly fee per class from Fees → Fee Structure (needs admin/accountant)
    api.get('/fees/structures').then(res => {
      const year = currentAcademicYear(); const map = {};
      (res.data.data || []).filter(s => s.academicYear === year && s.class).forEach(s => {
        const id = s.class._id || s.class; map[id] = (map[id] || 0) + (s.totalAmount || 0);
      });
      setFees(map);
    }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  // one row per section (classes with no section yet get their own row so they can be fixed/deleted)
  const rows = [];
  classes.forEach(cls => {
    if (!cls.sections?.length) rows.push({ key: cls._id, cls, sec: null });
    else cls.sections.forEach(sec => rows.push({ key: sec._id, cls, sec }));
  });

  const ctOf = {}; // teacherId -> ["Class 5 - A", ...]
  rows.forEach(r => { const t = r.sec?.classTeacher?._id; if (t) (ctOf[t] = ctOf[t] || []).push(`${r.cls.name} - ${r.sec.name}`); });

  const q = search.trim().toLowerCase();
  const shown = rows.filter(r =>
    (!yearFilter || r.cls.academicYear === yearFilter) &&
    (!q || `${r.cls.name} ${r.sec?.name || ''}`.toLowerCase().includes(q) || (r.sec?.classTeacher?.name || '').toLowerCase().includes(q)));

  const sectionsOnly = rows.filter(r => r.sec);
  const totalStudents = classes.reduce((n, c) => n + (c.studentCount || 0), 0);
  const noTeacher = sectionsOnly.filter(r => !r.sec.classTeacher).length;
  const years = yearOptions(classes.map(c => c.academicYear).filter(Boolean));

  // ── modal ───────────────────────────────────────────────────────────────────
  const openAdd = () => setModal({ mode:'add', form: BLANK() });
  const openEdit = (r) => setModal({
    mode:'edit', cls: r.cls, section: r.sec,
    form: { ...BLANK(), section: r.sec.name, classTeacher: r.sec.classTeacher?._id || '', roomNumber: r.sec.roomNumber || '', capacity: r.sec.capacity ? String(r.sec.capacity) : '' },
  });
  const setF = (patch) => setModal(m => ({ ...m, form: { ...m.form, ...patch } }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    const f = modal.form;
    const sectionBody = { name: f.section.trim().toUpperCase(), classTeacher: f.classTeacher || null, roomNumber: f.roomNumber, capacity: f.capacity };
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        await api.put(`/classes/sections/${modal.section._id}`, sectionBody);
        toast.success(`${modal.cls.name} – ${sectionBody.name} updated`);
      } else {
        const g = GRADES.find(x => x.label === f.gradeLabel);
        const name = className(f.gradeLabel, g.grade >= 11 ? f.stream : '');
        // reuse the class if it already exists for that year, otherwise create it
        let cls = classes.find(c => c.name.trim().toLowerCase() === name.toLowerCase() && c.academicYear === f.academicYear);
        if (!cls) {
          const res = await api.post('/classes', { name, grade: g.grade, academicYear: f.academicYear });
          cls = res.data.data;
        }
        await api.post(`/classes/${cls._id}/sections`, sectionBody);
        toast.success(`${name} – ${sectionBody.name} added`);
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save'), { duration: 6000 });
      load(); // a class may have been created before the section failed — show the real state
    }
    setSaving(false);
  };

  const deleteSection = async (r) => {
    if (!confirm(`Delete ${r.cls.name} – ${r.sec.name}?`)) return;
    try {
      await api.delete(`/classes/sections/${r.sec._id}`);
      toast.success('Section deleted');
      load();
    } catch (err) { toast.error(errMsg(err, 'Could not delete the section'), { duration: 6000 }); }
  };
  const deleteClass = async (cls) => {
    if (!confirm(`Delete ${cls.name} (${cls.academicYear}) and all its sections?`)) return;
    try {
      await api.delete(`/classes/${cls._id}`);
      toast.success('Class deleted');
      load();
    } catch (err) { toast.error(errMsg(err, 'Could not delete the class'), { duration: 6000 }); }
  };

  const occupancy = (sec) => {
    if (!sec?.capacity) return null;
    const pct = Math.round(((sec.studentCount || 0) / sec.capacity) * 100);
    return { pct, color: pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#16a34a' };
  };

  const ActionBtns = ({ r }) => (
    <div style={{ display:'flex', gap:5 }}>
      {r.sec && <button onClick={() => openEdit(r)} title="Edit section" style={{ padding:6, borderRadius:7, border:'1px solid #bfdbfe', background:'#eff6ff', cursor:'pointer', color:'#3b82f6', display:'flex' }}><Edit size={13}/></button>}
      <button onClick={() => (r.sec ? deleteSection(r) : deleteClass(r.cls))} title={r.sec ? 'Delete section' : 'Delete class'}
        style={{ padding:6, borderRadius:7, border:'1px solid #fecaca', background:'#fff5f5', cursor:'pointer', color:'#ef4444', display:'flex' }}><Trash2 size={13}/></button>
    </div>
  );

  const TeacherBox = ({ t }) => t ? (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'8px 10px', background:'#f8fafc', borderRadius:8 }}>
      <div style={{ width:30, height:30, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:'#1d4ed8', flexShrink:0 }}>
        {(t.name || '?').replace(/^(mr|mrs|ms|miss|dr)\.?\s+/i, '')[0]?.toUpperCase()}
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:12 }}>{t.name}</div>
        <div style={{ fontSize:11, color:'#64748b' }}>{t.department ? `${t.department} · ` : ''}Class Teacher</div>
      </div>
    </div>
  ) : (
    <div style={{ padding:'8px 10px', background:'#fff7ed', borderRadius:8, fontSize:12, color:'#d97706', fontWeight:600, marginBottom:10 }}>⚠️ No class teacher assigned</div>
  );

  const f = modal?.form;
  const gradeSel = f && GRADES.find(x => x.label === f.gradeLabel);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
        {[
          { label:'Class Sections',   value: sectionsOnly.length, color:'#3b82f6', icon:GraduationCap },
          { label:'Students',         value: totalStudents,       color:'#16a34a', icon:Users },
          { label:'Teachers',         value: teachers.length,     color:'#8b5cf6', icon:UserCheck },
          { label:'No Class Teacher', value: noTeacher,           color: noTeacher ? '#dc2626' : '#16a34a', icon:AlertTriangle },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'12px 14px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color }} />
            <div style={{ background:k.color + '18', borderRadius:9, padding:9 }}><k.icon size={16} color={k.color}/></div>
            <div>
              <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{loading ? '—' : k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="input-field" placeholder="Search class or teacher..." style={{ paddingLeft:28 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Sel value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={{ minWidth:150 }}>
          <option value="">All academic years</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </Sel>
        <div style={{ display:'flex', borderRadius:8, border:'1px solid #e2e8f0', overflow:'hidden' }}>
          {[['grid', LayoutGrid, 'Grid'], ['table', List, 'Table']].map(([v, Icon, l]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'7px 14px', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5,
              background: view === v ? '#3b82f6' : '#f8fafc', color: view === v ? '#fff' : '#64748b' }}>
              <Icon size={13}/> {l}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14}/> Add Class</button>
      </div>

      {!loading && (loadErr.classes || loadErr.teachers) && (
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, fontSize:13, color:'#b91c1c' }}>
          <AlertTriangle size={16} style={{ flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            {loadErr.classes && <div><b>Classes could not be loaded:</b> {loadErr.classes}</div>}
            {loadErr.teachers && <div><b>Teachers could not be loaded:</b> {loadErr.teachers}</div>}
          </div>
          <button className="btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !loadErr.teachers && teachers.length === 0 && (
        <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, fontSize:13, color:'#1e40af' }}>
          <Info size={16} style={{ flexShrink:0, marginTop:1 }}/> No teachers yet — add them on the <b>&nbsp;Teachers&nbsp;</b> page to assign class teachers.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}><Loader size={18} className="animate-spin" style={{ display:'inline' }}/> Loading classes...</div>
      ) : loadErr.classes ? null : shown.length === 0 ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
          <GraduationCap size={34} style={{ margin:'0 auto 8px', opacity:.4 }}/>
          <div style={{ fontSize:14, fontWeight:600 }}>{rows.length ? 'No class matches your search' : 'No classes yet — click "Add Class"'}</div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
          {shown.map(r => {
            const occ = occupancy(r.sec);
            const stream = streamOf(r.cls.name);
            const [bg, color] = STREAM_COLOR[stream] || [];
            return (
              <div key={r.key} className="card" style={{ padding:0, overflow:'hidden' }}>
                <div style={{ height:4, background: occ ? occ.color : '#3b82f6' }}/>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:900, fontSize:18, color:'#0f172a' }}>
                        {r.cls.name}{r.sec && <span style={{ color:'#3b82f6' }}> – {r.sec.name}</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2 }}>
                        <span style={{ fontSize:11, color:'#94a3b8' }}>{r.cls.academicYear}</span>
                        {stream && <span style={{ fontSize:11, fontWeight:700, padding:'1px 8px', borderRadius:12, background:bg, color }}>{stream}</span>}
                      </div>
                    </div>
                    <ActionBtns r={r}/>
                  </div>

                  {r.sec ? <TeacherBox t={r.sec.classTeacher}/> : (
                    <div style={{ padding:'8px 10px', background:'#fef2f2', borderRadius:8, fontSize:12, color:'#b91c1c', fontWeight:600, marginBottom:10 }}>
                      No sections — add one with "Add Class" (same class + year) or delete this class
                    </div>
                  )}

                  {r.sec && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
                      {[['Students', r.sec.studentCount || 0, '#3b82f6'], ['Capacity', r.sec.capacity || '—', '#8b5cf6'], ['Room', r.sec.roomNumber || '—', '#16a34a']].map(([l, v, c]) => (
                        <div key={l} style={{ textAlign:'center', padding:'6px 4px', background:'#f8fafc', borderRadius:7 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:c }}>{v}</div>
                          <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {occ && (
                    <>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:3 }}>
                        <span>Occupancy</span><span style={{ fontWeight:700, color:occ.color }}>{occ.pct}%{occ.pct >= 100 ? ' FULL' : ''}</span>
                      </div>
                      <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:Math.min(occ.pct, 100) + '%', height:'100%', background:occ.color, borderRadius:3 }}/>
                      </div>
                    </>
                  )}
                  {fees[r.cls._id] > 0 && (
                    <div style={{ marginTop:8, fontSize:11, color:'#64748b' }}>Fee ({currentAcademicYear()}): <strong style={{ color:'#0f172a' }}>{inr(fees[r.cls._id])}/year</strong></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead><tr><th>#</th><th>Class</th><th>Sec</th><th>Year</th><th>Class Teacher</th><th>Room</th><th>Students</th><th>Capacity</th><th>Fee/Year</th><th>Actions</th></tr></thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={r.key}>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>{i + 1}</td>
                    <td style={{ fontWeight:800 }}>{r.cls.name}</td>
                    <td>{r.sec ? <span style={{ fontWeight:700, fontSize:13, background:'#dbeafe', color:'#1d4ed8', padding:'2px 10px', borderRadius:12 }}>{r.sec.name}</span> : <span style={{ fontSize:11, color:'#b91c1c' }}>none</span>}</td>
                    <td style={{ fontSize:12, color:'#64748b' }}>{r.cls.academicYear}</td>
                    <td>{r.sec?.classTeacher ? <div><div style={{ fontWeight:600, fontSize:13 }}>{r.sec.classTeacher.name}</div><div style={{ fontSize:11, color:'#94a3b8' }}>{r.sec.classTeacher.department}</div></div> : <span style={{ fontSize:11, color:'#d97706' }}>Not assigned</span>}</td>
                    <td>{r.sec?.roomNumber || '—'}</td>
                    <td style={{ fontWeight:700, color:'#3b82f6', textAlign:'center' }}>{r.sec ? r.sec.studentCount || 0 : '—'}</td>
                    <td style={{ textAlign:'center' }}>{r.sec?.capacity || '—'}</td>
                    <td style={{ fontWeight:600 }}>{fees[r.cls._id] ? inr(fees[r.cls._id]) : '—'}</td>
                    <td><ActionBtns r={r}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, maxWidth:520, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div style={{ fontWeight:800, fontSize:15 }}>{modal.mode === 'edit' ? `Edit ${modal.cls.name} – ${modal.section.name}` : 'Add Class'}</div>
              <button onClick={() => setModal(null)} style={{ padding:7, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={14}/></button>
            </div>
            <form onSubmit={handleSave} style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              {modal.mode === 'add' && (
                <div style={{ display:'grid', gridTemplateColumns: gradeSel?.grade >= 11 ? '1fr 1fr' : '1fr', gap:12 }}>
                  <Sel label="Class" required value={f.gradeLabel} onChange={e => setF({ gradeLabel:e.target.value, stream:'' })}>
                    {GRADES.map(g => <option key={g.label}>{g.label}</option>)}
                  </Sel>
                  {gradeSel?.grade >= 11 && (
                    <Sel label="Stream" value={f.stream} onChange={e => setF({ stream:e.target.value })}>
                      <option value="">None</option>
                      {STREAMS.map(s => <option key={s}>{s}</option>)}
                    </Sel>
                  )}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns: modal.mode === 'add' ? '1fr 1fr' : '1fr', gap:12 }}>
                <div>
                  <label className="label">Section *</label>
                  <input required list="section-names" className="input-field" maxLength={20} placeholder="A"
                    value={f.section} onChange={e => setF({ section:e.target.value })}/>
                  <datalist id="section-names">{SECTIONS.map(s => <option key={s} value={s}/>)}</datalist>
                </div>
                {modal.mode === 'add' && (
                  <Sel label="Academic Year" required value={f.academicYear} onChange={e => setF({ academicYear:e.target.value })}>
                    {years.map(y => <option key={y}>{y}</option>)}
                  </Sel>
                )}
              </div>
              <div>
                <Sel label="Class Teacher" value={f.classTeacher} onChange={e => setF({ classTeacher:e.target.value })}>
                  <option value="">Select teacher</option>
                  {teachers.map(t => {
                    const other = (ctOf[t._id] || []).filter(x => !(modal.mode === 'edit' && x === `${modal.cls.name} - ${modal.section.name}`));
                    return <option key={t._id} value={t._id}>{t.name}{t.department ? ` — ${t.department}` : ''}{other.length ? `  (class teacher of ${other.join(', ')})` : ''}</option>;
                  })}
                </Sel>
                {loadErr.teachers
                  ? <div style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>Teachers could not be loaded: {loadErr.teachers}</div>
                  : teachers.length === 0 && <div style={{ fontSize:11, color:'#d97706', marginTop:4 }}>No teachers yet — add them on the Teachers page.</div>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label className="label">Room No.</label><input className="input-field" maxLength={20} placeholder="101" value={f.roomNumber} onChange={e => setF({ roomNumber:e.target.value })}/></div>
                <div><label className="label">Capacity</label><input type="number" min={1} max={500} className="input-field" placeholder="40" value={f.capacity} onChange={e => setF({ capacity:e.target.value })}/></div>
              </div>
              {modal.mode === 'add' && (
                <div style={{ fontSize:11, color:'#64748b', background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                  Will create <b>{className(f.gradeLabel, gradeSel?.grade >= 11 ? f.stream : '')} – {(f.section || '?').toUpperCase()}</b> for {f.academicYear}. Set the yearly fee in <b>Fees → Fee Structure</b>.
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : modal.mode === 'edit' ? 'Update' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — Classes + Timetable
// ══════════════════════════════════════════════════════════════════════════════
export default function Classes() {
  const [tab, setTab] = useState('classes');
  const TABS = [
    { id:'classes',   label:'Classes',   icon:GraduationCap },
    { id:'timetable', label:'Timetable', icon:Clock },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Classes & Timetable</h1>
        <p className="text-gray-500 text-sm">Manage classes and sections, assign class teachers and set the weekly timetable</p>
      </div>

      <div style={{ display:'flex', borderBottom:'2px solid #f1f5f9' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 24px', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent',
              color: tab === t.id ? '#1e40af' : '#64748b', borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent', marginBottom:'-2px' }}>
            <t.icon size={15}/> {t.label}
          </button>
        ))}
      </div>

      {/* each tab loads fresh data from the server when opened */}
      {tab === 'classes'   && <ClassesTab />}
      {tab === 'timetable' && <TimetableGrid />}
    </div>
  );
}