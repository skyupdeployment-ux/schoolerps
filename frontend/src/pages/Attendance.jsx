// @ts-nocheck
// ATTENDANCE — uses the real API (backend/src/routes/attendanceManage.js):
//   GET  /attendance/sheet?section&date     students + what is already saved for that day
//   POST /attendance/mark                   save the sheet
//   GET  /attendance/report?section&month   monthly report
// "Saved" is only shown after the server confirms it.
import { useState, useEffect } from 'react';
import {
  Search, ChevronDown, Loader, Download, CheckCircle, XCircle, Clock,
  TrendingUp, MessageCircle, AlertCircle, CircleDashed, Info, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Status config (code shown on buttons ↔ value stored in the database) ─────
const STATUS = {
  P: { label:'Present',  api:'Present',  color:'#16a34a', bg:'#dcfce7', icon: CheckCircle  },
  A: { label:'Absent',   api:'Absent',   color:'#dc2626', bg:'#fee2e2', icon: XCircle      },
  L: { label:'Late',     api:'Late',     color:'#d97706', bg:'#fef9c3', icon: Clock        },
  H: { label:'Half Day', api:'Half Day', color:'#7c3aed', bg:'#ede9fe', icon: CircleDashed },
};
const FROM_API = { Present:'P', Absent:'A', Late:'L', 'Half Day':'H' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const todayYMD  = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const thisMonth = () => todayYMD().slice(0, 7);
const longDate  = (ymd) => new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
const fullName  = (s) => `${s.firstName || ''} ${s.lastName || ''}`.trim();

const errMsg = (err, fallback = 'Something went wrong') => {
  const r = err?.response;
  if (!r) return 'Cannot reach the server — is the backend running?';
  if (r.status === 429) return 'Too many requests — wait a minute and try again';
  if (r.data?.message) return r.data.message;
  return fallback;
};

const csvCell = (v) => {
  let t = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@]/.test(t)) t = `'${t}`; // stop Excel treating it as a formula
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const downloadCSV = (rows, filename) => {
  const blob = new Blob(['﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

const waLink = (phone, text) => {
  const raw = String(phone || '').replace(/\D/g, '');
  if (raw.length < 10) return null;
  return `https://wa.me/${raw.length === 10 ? `91${raw}` : raw}?text=${encodeURIComponent(text)}`;
};

const Sel = ({ label, children, ...p }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <div style={{ position:'relative' }}>
      <select className="input-field" style={{ appearance:'none', paddingRight:28, minWidth:140 }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%',
        transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

// ── Classes + sections from the database (Classes & Timetable page) ─────────
function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/classes')
      .then(res => setClasses((res.data.data || []).filter(c => (c.sections || []).length > 0)))
      .catch(err => toast.error(errMsg(err, 'Could not load classes')))
      .finally(() => setLoading(false));
  }, []);
  return { classes, loading };
}

// Class + section dropdowns. Picks the first class/section automatically.
function ClassSectionPicker({ classes, classId, sectionId, onChange }) {
  useEffect(() => {
    if (!classId && classes.length) onChange(classes[0]._id, classes[0].sections[0]._id);
  }, [classes]);
  const cls = classes.find(c => c._id === classId);
  return (
    <>
      <Sel label="Class" value={classId} onChange={e => {
        const c = classes.find(k => k._id === e.target.value);
        onChange(c._id, c.sections[0]?._id || '');
      }}>
        {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}
      </Sel>
      <Sel label="Section" value={sectionId} onChange={e => onChange(classId, e.target.value)}>
        {(cls?.sections || []).map(s => <option key={s._id} value={s._id}>Section {s.name}</option>)}
      </Sel>
    </>
  );
}

const NoClasses = () => (
  <div className="card" style={{ padding:40, textAlign:'center', color:'#64748b' }}>
    <Info size={30} style={{ margin:'0 auto 10px', color:'#93c5fd' }} />
    <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>No classes with sections yet</div>
    <div style={{ fontSize:13, marginTop:4 }}>
      Create classes and add sections in <b>Classes &amp; Timetable</b>, then come back here to mark attendance.
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// Mark Attendance
// ══════════════════════════════════════════════════════════════════════════════
function MarkAttendanceTab({ classes }) {
  const [classId, setClassId]     = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate]           = useState(todayYMD());
  const [students, setStudents]   = useState([]);
  const [marks, setMarks]         = useState({});  // { studentId: 'P'|'A'|'L'|'H' } — what's on screen
  const [saved, setSaved]         = useState({});  // what the server has
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [showNotify, setShowNotify] = useState(false);

  const cls = classes.find(c => c._id === classId);
  const sec = cls?.sections.find(s => s._id === sectionId);
  const label = cls && sec ? `${cls.name} - ${sec.name}` : '';

  const dirty = students.some(s => (marks[s._id] || null) !== (saved[s._id] || null));
  const alreadySaved = Object.keys(saved).length > 0;

  const loadSheet = async () => {
    if (!sectionId || !date) return;
    setLoading(true); setShowNotify(false);
    try {
      const res = await api.get('/attendance/sheet', { params: { section: sectionId, date } });
      const list = res.data.data?.students || [];
      const fromServer = {};
      list.forEach(s => { if (s.status && FROM_API[s.status]) fromServer[s._id] = FROM_API[s.status]; });
      setStudents(list);
      setSaved(fromServer);
      setMarks(fromServer);
    } catch (err) {
      setStudents([]); setSaved({}); setMarks({});
      toast.error(errMsg(err, 'Could not load students'));
    }
    setLoading(false);
  };

  useEffect(() => { loadSheet(); }, [sectionId, date]);

  // Ask before throwing away unsaved marks
  const guard = () => !dirty || confirm('You have unsaved attendance. Discard it?');
  const pickSection = (c, s) => { if (!guard()) return; setClassId(c); setSectionId(s); };
  const pickDate = (d) => { if (!d || !guard()) return; setDate(d); };

  const setStatus = (id, code) => setMarks(prev => {
    const next = { ...prev };
    if (next[id] === code) delete next[id]; else next[id] = code; // click again to un-mark
    return next;
  });
  const markAll = (code) => {
    const all = {};
    students.forEach(s => { all[s._id] = code; });
    setMarks(all);
  };

  const counts = { P:0, A:0, L:0, H:0 };
  students.forEach(s => { if (marks[s._id]) counts[marks[s._id]]++; });
  const unmarked = students.length - (counts.P + counts.A + counts.L + counts.H);

  const handleSave = async () => {
    if (saving) return;
    if (!students.length) { toast.error('No students to save'); return; }
    if (unmarked === students.length && !alreadySaved) { toast.error('Mark attendance first'); return; }
    if (unmarked > 0 && !confirm(`${unmarked} student${unmarked > 1 ? 's are' : ' is'} not marked.\n\nSave anyway? They will stay unmarked for ${longDate(date)}.`)) return;

    setSaving(true);
    try {
      const res = await api.post('/attendance/mark', {
        section: sectionId,
        date,
        records: students.map(s => ({ student: s._id, status: marks[s._id] ? STATUS[marks[s._id]].api : null })),
      });
      const t = res.data.data || {};
      setSaved({ ...marks });
      toast.success(`Saved for ${label}: ${t.Present || 0} present, ${t.Absent || 0} absent${t.Late ? `, ${t.Late} late` : ''}${t['Half Day'] ? `, ${t['Half Day']} half day` : ''}`);
    } catch (err) {
      toast.error(errMsg(err, 'Attendance was NOT saved'), { duration: 6000 });
    }
    setSaving(false);
  };

  const absentees = students.filter(s => saved[s._id] === 'A');
  const absentMessage = (s) =>
    `Dear Parent,\n\nYour child ${fullName(s)} (Adm: ${s.admissionNumber || '—'}, ${label}) was marked ABSENT on ${longDate(date)}.\n\nIf this is an error, please contact the school.`;

  const exportCSV = () => {
    downloadCSV([
      ['Roll No', 'Student', 'Admission No', 'Status', 'Date', 'Class'],
      ...students.map(s => [s.rollNumber || '', fullName(s), s.admissionNumber || '', marks[s._id] ? STATUS[marks[s._id]].label : 'Not marked', date, label]),
    ], `Attendance_${label.replace(/\s+/g, '')}_${date}.csv`);
  };

  const shown = students.filter(s => {
    const q = search.trim().toLowerCase();
    return !q || fullName(s).toLowerCase().includes(q) || String(s.admissionNumber || '').toLowerCase().includes(q) || String(s.rollNumber || '') === q;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card" style={{ padding:18 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <ClassSectionPicker classes={classes} classId={classId} sectionId={sectionId} onChange={pickSection} />
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={date} max={todayYMD()} onChange={e => pickDate(e.target.value)} />
          </div>
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="input-field" placeholder="Search name, admission or roll no..." style={{ paddingLeft:28 }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {alreadySaved && !loading && (
          <div style={{ marginTop:12, fontSize:12, color:'#1e40af', background:'#eff6ff', padding:'8px 12px', borderRadius:8, display:'flex', gap:6, alignItems:'center' }}>
            <Info size={14}/> Attendance for {label} on {longDate(date)} was already saved — changes will update it.
          </div>
        )}
      </div>

      {/* Bulk actions + save */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:13, color:'#64748b' }}>Mark all:</span>
          {Object.entries(STATUS).map(([code, s]) => (
            <button key={code} onClick={() => markAll(code)} disabled={!students.length}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8,
                border:`1px solid ${s.color}30`, background:s.bg, color:s.color,
                cursor:'pointer', fontSize:12, fontWeight:700 }}>
              <s.icon size={13}/> {s.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCSV} className="btn-secondary" style={{ fontSize:12 }} disabled={!students.length}>
            <Download size={13}/> Export CSV
          </button>
          {absentees.length > 0 && !dirty && (
            <button onClick={() => setShowNotify(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
                border:'1px solid #25D366', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:12, fontWeight:700 }}>
              <MessageCircle size={13}/> Notify {absentees.length} absent
            </button>
          )}
          <button onClick={handleSave} disabled={saving || !dirty || !students.length}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 18px', borderRadius:8, border:'none',
              cursor: saving || !dirty ? 'default' : 'pointer', fontSize:13, fontWeight:700, color:'#fff',
              background: !dirty && alreadySaved ? '#16a34a' : '#3b82f6', opacity: saving || (!dirty && !alreadySaved) ? .6 : 1 }}>
            {saving ? <><Loader size={13} className="animate-spin"/> Saving...</>
              : !dirty && alreadySaved ? <><CheckCircle size={13}/> Saved</>
              : dirty && alreadySaved ? 'Update Attendance'
              : 'Save Attendance'}
          </button>
        </div>
      </div>

      {dirty && (
        <div style={{ fontSize:12, color:'#92400e', background:'#fffbeb', border:'1px solid #fde68a', padding:'8px 12px', borderRadius:8, display:'flex', gap:6, alignItems:'center' }}>
          <AlertCircle size={14}/> Unsaved changes — click <b>&nbsp;{alreadySaved ? 'Update' : 'Save'} Attendance&nbsp;</b> to store them.
        </div>
      )}

      {/* Notify absent parents — one click per parent (browsers block opening many tabs at once) */}
      {showNotify && (
        <div className="card" style={{ padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Notify parents of absent students</div>
            <button onClick={() => setShowNotify(false)} style={{ border:'none', background:'#f1f5f9', borderRadius:6, padding:4, cursor:'pointer' }}><X size={13}/></button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {absentees.map(s => {
              const link = waLink(s.parentPhone, absentMessage(s));
              return (
                <button key={s._id} disabled={!link} onClick={() => window.open(link, '_blank')}
                  title={link ? s.parentPhone : 'No parent phone saved'}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                    border:`1px solid ${link ? '#86efac' : '#e2e8f0'}`, background: link ? '#f0fdf4' : '#f8fafc',
                    color: link ? '#15803d' : '#94a3b8', cursor: link ? 'pointer' : 'not-allowed' }}>
                  <MessageCircle size={12}/> {fullName(s)} {link ? '' : '(no phone)'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sheet */}
      <div className="card">
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <Loader size={18} className="animate-spin" /> Loading students...
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width:50 }}>#</th><th>Student</th><th>Roll No</th><th>Adm No</th>
                  <th style={{ textAlign:'center' }}>Status</th><th style={{ textAlign:'center', minWidth:220 }}>Mark</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s, i) => {
                  const cur = marks[s._id];
                  const cfg = cur ? STATUS[cur] : null;
                  const changed = (marks[s._id] || null) !== (saved[s._id] || null);
                  return (
                    <tr key={s._id} style={{ background: cfg ? `${cfg.bg}80` : 'transparent', transition:'background .2s' }}>
                      <td style={{ color:'#94a3b8', textAlign:'center' }}>{i + 1}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background: cfg ? cfg.bg : '#f1f5f9',
                            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color: cfg ? cfg.color : '#64748b' }}>
                            {(s.firstName || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, color:'#0f172a' }}>{fullName(s)}</div>
                            {s.parentPhone && <div style={{ fontSize:10, color:'#94a3b8' }}>{s.parentPhone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize:13, color:'#475569', fontWeight:600 }}>{s.rollNumber || '—'}</td>
                      <td style={{ fontSize:12, color:'#94a3b8' }}>{s.admissionNumber || '—'}</td>
                      <td style={{ textAlign:'center' }}>
                        {cfg ? (
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:20, background:cfg.bg, color:cfg.color,
                            display:'inline-flex', alignItems:'center', gap:4 }}>
                            <cfg.icon size={11}/> {cfg.label}{changed ? ' •' : ''}
                          </span>
                        ) : <span style={{ fontSize:11, color:'#cbd5e1' }}>Not marked{changed ? ' •' : ''}</span>}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                          {Object.entries(STATUS).map(([code, s2]) => (
                            <button key={code} onClick={() => setStatus(s._id, code)} title={s2.label}
                              style={{ width:36, height:36, borderRadius:9, border:'2px solid', cursor:'pointer', fontWeight:800, fontSize:12,
                                transition:'all .15s',
                                borderColor: cur === code ? s2.color : '#e2e8f0',
                                background:  cur === code ? s2.bg : '#fff',
                                color:       cur === code ? s2.color : '#94a3b8',
                                boxShadow:   cur === code ? `0 0 0 3px ${s2.color}20` : 'none' }}>
                              {code}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                    {students.length === 0
                      ? <>No students in {label || 'this section'}.<div style={{ fontSize:12, marginTop:4 }}>Check the students' class and section on the Students page.</div></>
                      : 'No student matches your search'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && students.length > 0 && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid #f1f5f9', display:'flex', gap:16, justifyContent:'space-between',
            alignItems:'center', background:'#f8fafc', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:18 }}>
              {[
                { label:'Total', value:students.length, color:'#3b82f6' },
                { label:'Present', value:counts.P, color:'#16a34a' },
                { label:'Absent', value:counts.A, color:'#ef4444' },
                { label:'Late', value:counts.L, color:'#d97706' },
                { label:'Half Day', value:counts.H, color:'#7c3aed' },
                { label:'Unmarked', value:unmarked, color:'#94a3b8' },
              ].map(k => (
                <div key={k.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>{k.label}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>{label} · {longDate(date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Monthly Report
// ══════════════════════════════════════════════════════════════════════════════
const pctColor = (p) => p === null ? '#94a3b8' : p >= 90 ? '#16a34a' : p >= 75 ? '#d97706' : '#ef4444';
const pctGrade = (p) => p === null ? '—' : p >= 90 ? 'Excellent' : p >= 75 ? 'Good' : p >= 60 ? 'Average' : 'Poor';

function ReportTab({ classes }) {
  const [classId, setClassId]     = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth]         = useState(thisMonth());
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);

  const cls = classes.find(c => c._id === classId);
  const sec = cls?.sections.find(s => s._id === sectionId);
  const label = cls && sec ? `${cls.name} - ${sec.name}` : '';

  useEffect(() => {
    if (!sectionId || !month) return;
    setLoading(true);
    api.get('/attendance/report', { params: { section: sectionId, month } })
      .then(res => setReport(res.data.data))
      .catch(err => { setReport(null); toast.error(errMsg(err, 'Could not load the report')); })
      .finally(() => setLoading(false));
  }, [sectionId, month]);

  const students = report?.students || [];
  const daily = report?.daily || [];
  const below75 = students.filter(s => s.percentage !== null && s.percentage < 75).length;
  const totalAbsent = students.reduce((n, s) => n + s.absent, 0);

  const exportCSV = () => {
    downloadCSV([
      ['Roll No', 'Student', 'Admission No', 'Present', 'Absent', 'Late', 'Half Day', 'Days Marked', 'Attendance %'],
      ...students.map(s => [s.rollNumber || '', fullName(s), s.admissionNumber || '', s.present, s.absent, s.late, s.halfDay, s.total, s.percentage ?? '']),
    ], `Attendance_Report_${label.replace(/\s+/g, '')}_${month}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="card" style={{ padding:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
        <ClassSectionPicker classes={classes} classId={classId} sectionId={sectionId}
          onChange={(c, s) => { setClassId(c); setSectionId(s); }} />
        <div>
          <label className="label">Month</label>
          <input type="month" className="input-field" value={month} max={thisMonth()} onChange={e => e.target.value && setMonth(e.target.value)} />
        </div>
        <button onClick={exportCSV} className="btn-secondary" disabled={!students.length}><Download size={13}/> Export CSV</button>
      </div>

      {loading ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
          <Loader size={18} className="animate-spin" style={{ display:'inline' }} /> Loading report...
        </div>
      ) : report && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
            {[
              { label:'Days Marked',       value: report.daysMarked, color:'#3b82f6' },
              { label:'Class Average',     value: report.average === null ? '—' : `${report.average}%`, color: pctColor(report.average) },
              { label:'Below 75%',         value: below75, color:'#ef4444' },
              { label:'Total Absences',    value: totalAbsent, color:'#d97706' },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding:'14px 16px', borderTop:`3px solid ${k.color}` }}>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:k.color, marginTop:4 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Day-by-day */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:16 }}>Day by day — {label}</div>
            {daily.length === 0 ? (
              <div style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>No attendance marked for this month yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {daily.map(d => {
                  const pct = d.total ? Math.round(((d.present + d.late + d.halfDay * 0.5) / d.total) * 100) : 0;
                  return (
                    <div key={d.date} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:11, color:'#64748b', width:90, flexShrink:0 }}>
                        {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}
                      </span>
                      <div style={{ flex:1, height:20, background:'#f1f5f9', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:pctColor(pct), borderRadius:4, display:'flex', alignItems:'center', paddingLeft:8 }}>
                          <span style={{ fontSize:10, color:'#fff', fontWeight:700 }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'#64748b', width:150, flexShrink:0 }}>
                        P {d.present} · A {d.absent} · L {d.late}{d.halfDay ? ` · HD ${d.halfDay}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per student */}
          <div className="card">
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr><th>Roll</th><th>Student</th><th style={{ textAlign:'center' }}>Present</th><th style={{ textAlign:'center' }}>Absent</th>
                    <th style={{ textAlign:'center' }}>Late</th><th style={{ textAlign:'center' }}>Half Day</th><th>Attendance</th><th>Grade</th></tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const c = pctColor(s.percentage);
                    return (
                      <tr key={s._id}>
                        <td style={{ color:'#64748b', fontWeight:600 }}>{s.rollNumber || '—'}</td>
                        <td>
                          <div style={{ fontWeight:600, color:'#0f172a' }}>{fullName(s)}</div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>{s.admissionNumber}</div>
                        </td>
                        <td style={{ textAlign:'center', fontWeight:700, color:'#16a34a' }}>{s.present}</td>
                        <td style={{ textAlign:'center', fontWeight:700, color:'#ef4444' }}>{s.absent}</td>
                        <td style={{ textAlign:'center', fontWeight:700, color:'#d97706' }}>{s.late}</td>
                        <td style={{ textAlign:'center', fontWeight:700, color:'#7c3aed' }}>{s.halfDay}</td>
                        <td>
                          {s.percentage === null ? <span style={{ fontSize:12, color:'#94a3b8' }}>Not marked</span> : (
                            <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:140 }}>
                              <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ width:`${s.percentage}%`, height:'100%', background:c, borderRadius:3 }} />
                              </div>
                              <span style={{ fontWeight:800, color:c, fontSize:13, width:44 }}>{s.percentage}%</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background:`${c}18`, color:c }}>{pctGrade(s.percentage)}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No students in {label || 'this section'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Attendance page
// ══════════════════════════════════════════════════════════════════════════════
export default function Attendance() {
  const [tab, setTab] = useState('mark');
  const { classes, loading } = useClasses();

  const TABS = [
    { id:'mark',   label:'Mark Attendance',   icon: CheckCircle },
    { id:'report', label:'Monthly Report',    icon: TrendingUp  },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm">Mark daily attendance and view monthly reports</p>
      </div>

      <div style={{ display:'flex', gap:0, borderBottom:'2px solid #f1f5f9' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, background:'transparent', transition:'all .2s',
              color: tab === t.id ? '#1e40af' : '#64748b',
              borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent', marginBottom:'-2px' }}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
          <Loader size={18} className="animate-spin" style={{ display:'inline' }} /> Loading classes...
        </div>
      ) : classes.length === 0 ? <NoClasses /> : (
        <>
          {tab === 'mark'   && <MarkAttendanceTab classes={classes} />}
          {tab === 'report' && <ReportTab classes={classes} />}
        </>
      )}
    </div>
  );
}