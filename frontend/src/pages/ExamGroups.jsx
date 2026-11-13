import { useState } from 'react';
import { Plus, Edit, Trash2, X, Loader, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CLASSES  = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'];
const TYPES    = ['Preparatory Exam','Unit Test','Mid Term','Quarterly','Pre-Board','Final Exam','Annual Exam'];
const SUBJECTS = ['Mathematics','Science','English','Hindi','Kannada','Social Science','Physics','Chemistry','Biology','Computer Science','Physical Education','Art','Music'];
const MARK_OPTIONS = [10, 20, 25, 30, 40, 50, 80, 100];

// pass marks for a given max and pass percentage, rounded up (25 @35% -> 9, 100 @35% -> 35)
const passFor = (max, pct) => Math.ceil((Number(max) || 0) * (Number(pct) || 0) / 100);
const mk = (name, maxMarks) => ({ name, maxMarks, passMarks: passFor(maxMarks, 35) });

// Optional ready-made patterns. Marks stay editable after loading.
const PRESETS = {
  'SSLC pattern — 625 marks': [
    mk('First Language', 125), mk('Second Language', 100), mk('Third Language', 100),
    mk('Mathematics', 100), mk('Science', 100), mk('Social Science', 100),
  ],
  '6 subjects — English, Hindi, Maths, Science, Social, Computer': [
    mk('English', 100), mk('Hindi', 100), mk('Mathematics', 100),
    mk('Science', 100), mk('Social Science', 100), mk('Computer Science', 100),
  ],
};

const INITIAL = {
  name:'', examType:'Preparatory Exam', class:'', section:'',
  startDate:'', endDate:'',
  subjects:[], description:'', academicYear:'2026-27', status:'Upcoming',
};

// ── helpers ──────────────────────────────────────────────────────────────────
const sumOf = (subs, key) => subs.reduce((n, s) => n + (Number(s[key]) || 0), 0);
// older records may store subjects as plain names — turn them into objects
const normSubjects = (arr = [], fallbackMax = 100, fallbackPass = 35) =>
  arr.map(s => (typeof s === 'string' ? { name: s, maxMarks: fallbackMax, passMarks: fallbackPass } : s));

const Sel = ({ label, required, children, ...p }) => (
  <div>
    {label && <label className="label">{label}{required && ' *'}</label>}
    <div style={{ position:'relative' }}>
      <select required={required} className="input-field" style={{ appearance:'none', paddingRight:28, cursor:'pointer' }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const statusColor = {
  Upcoming: { bg:'#eff6ff', color:'#1d4ed8' },
  Ongoing:  { bg:'#f0fdf4', color:'#16a34a' },
  Completed:{ bg:'#f8fafc', color:'#64748b' },
  Cancelled:{ bg:'#fff1f2', color:'#e11d48' },
};

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO = [
  { _id:'1', name:'Mid Term 2025', examType:'Mid Term', class:'10', section:'A', startDate:'2025-10-01', endDate:'2025-10-10', subjects:[mk('Mathematics',100), mk('Science',100), mk('English',100)], academicYear:'2025-26', status:'Upcoming', description:'Mid term examination for Class 10' },
  { _id:'2', name:'Unit Test – Sept', examType:'Unit Test', class:'9', section:'B', startDate:'2025-09-15', endDate:'2025-09-18', subjects:[mk('Mathematics',50), mk('Physics',50)], academicYear:'2025-26', status:'Completed', description:'' },
  { _id:'3', name:'Annual Exam 2026', examType:'Annual Exam', class:'12', section:'A', startDate:'2026-03-01', endDate:'2026-03-15', subjects:[mk('Physics',100), mk('Chemistry',100), mk('Mathematics',100)], academicYear:'2025-26', status:'Upcoming', description:'Final annual examination' },
].map(g => ({ ...g, totalMarks: sumOf(g.subjects, 'maxMarks'), passingMarks: sumOf(g.subjects, 'passMarks') }));

export default function ExamGroups() {
  const [groups, setGroups]       = useState(DEMO);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(INITIAL);
  const [saving, setSaving]       = useState(false);
  const [customName, setCustomName] = useState('');
  const [defaultMax, setDefaultMax] = useState(25);   // marks given to every subject you add
  const [passPct, setPassPct]       = useState(35);   // pass percentage
  const [customMax, setCustomMax]   = useState('');

  const inp = f => ({ value: form[f]||'', onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });

  const subs      = form.subjects;
  const total     = sumOf(subs, 'maxMarks');
  const passTotal = sumOf(subs, 'passMarks');
  const allSame   = subs.length > 0 && subs.every(s => Number(s.maxMarks) === Number(subs[0].maxMarks));
  const activeMax = subs.length ? (allSame ? Number(subs[0].maxMarks) : null) : defaultMax;

  const openAdd  = () => {
    setEditing(null); setForm(INITIAL); setCustomName(''); setCustomMax('');
    setDefaultMax(25); setPassPct(35); setShowModal(true);
  };
  const openEdit = g  => {
    const gs = normSubjects(g.subjects, g.totalMarks, g.passingMarks).map(s => ({ ...s }));
    setEditing(g); setForm({ ...g, subjects: gs }); setCustomName(''); setCustomMax('');
    setDefaultMax(Number(gs[0]?.maxMarks) || 100); setPassPct(35); setShowModal(true);
  };

  // ── marks helpers ──────────────────────────────────────────────────────────
  // set the same max marks for ALL subjects (and for subjects added later)
  const applyToAll = (max) => {
    const m = Number(max);
    if (!(m > 0)) { toast.error('Enter marks greater than 0'); return; }
    setDefaultMax(m);
    setForm(p => ({ ...p, subjects: p.subjects.map(s => ({ ...s, maxMarks: m, passMarks: passFor(m, passPct) })) }));
  };
  const changePassPct = (v) => {
    setPassPct(v);
    setForm(p => ({ ...p, subjects: p.subjects.map(s => ({ ...s, passMarks: passFor(s.maxMarks, v) })) }));
  };

  // ── subject helpers ────────────────────────────────────────────────────────
  const addSubject = (name) => {
    const n = name.trim();
    if (!n) return;
    if (subs.some(s => s.name.toLowerCase() === n.toLowerCase())) { toast.error(`${n} is already added`); return; }
    setForm(p => ({ ...p, subjects: [...p.subjects, { name: n, maxMarks: defaultMax, passMarks: passFor(defaultMax, passPct) }] }));
  };
  const removeSubject = (name) => setForm(p => ({ ...p, subjects: p.subjects.filter(s => s.name !== name) }));
  const toggleSubject = (name) => (subs.some(s => s.name === name) ? removeSubject(name) : addSubject(name));
  const updateSubject = (name, key, value) =>
    setForm(p => ({ ...p, subjects: p.subjects.map(s => (s.name === name ? { ...s, [key]: value } : s)) }));
  const loadPreset = (key) => {
    if (!key) return;
    setForm(p => ({ ...p, subjects: PRESETS[key].map(s => ({ ...s })) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!subs.length) { toast.error('Add at least one subject'); return; }
    const bad = subs.find(s => !(Number(s.maxMarks) > 0) || Number(s.passMarks) < 0 || Number(s.passMarks) > Number(s.maxMarks));
    if (bad) { toast.error(`Check the marks for ${bad.name} (pass marks cannot be more than max marks)`); return; }

    const clean = subs.map(s => ({ name: s.name, maxMarks: Number(s.maxMarks), passMarks: Number(s.passMarks) }));
    const payload = { ...form, subjects: clean, totalMarks: sumOf(clean, 'maxMarks'), passingMarks: sumOf(clean, 'passMarks') };

    setSaving(true);
    try {
      if (editing) {
        setGroups(g => g.map(x => x._id === editing._id ? { ...payload, _id: editing._id } : x));
        toast.success('Exam group updated');
      } else {
        setGroups(g => [...g, { ...payload, _id: Date.now().toString() }]);
        toast.success('Exam group created');
      }
      setShowModal(false);
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this exam group?')) return;
    setGroups(g => g.filter(x => x._id !== id));
    toast.success('Deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{groups.length} exam groups</p>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> New Exam Group</button>
      </div>

      {/* Cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        {groups.map(g => {
          const sc = statusColor[g.status] || statusColor.Upcoming;
          const gs = normSubjects(g.subjects, g.totalMarks, g.passingMarks);
          const gTotal = sumOf(gs, 'maxMarks') || g.totalMarks;
          const gPass  = sumOf(gs, 'passMarks') || g.passingMarks;
          return (
            <div key={g._id} className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{g.name}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{g.examType} · {/^\d+$/.test(g.class) ? `Class ${g.class}` : g.class}{g.section ? ` · Sec ${g.section}` : ''}</div>
                </div>
                <span style={{ ...sc, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{g.status}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Start', new Date(g.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})],
                  ['End',   new Date(g.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})],
                  ['Total Marks', gTotal],
                  ['Pass Marks',  gPass],
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.4 }}>{k}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:.4 }}>Subjects (max marks)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {gs.map(s => (
                    <span key={s.name} style={{ fontSize:11, background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                      {s.name} · {s.maxMarks}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:8, borderTop:'1px solid #f1f5f9', paddingTop:12, marginTop:12 }}>
                <button onClick={() => openEdit(g)} className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:12 }}><Edit size={13} /> Edit</button>
                <button onClick={() => handleDelete(g._id)} className="btn-danger" style={{ fontSize:12 }}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, maxWidth:680, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#0f172a' }}>{editing ? 'Edit Exam Group' : 'New Exam Group'}</div>
                <div style={{ fontSize:12, color:'#94a3b8' }}>Pick the exam, then choose the marks for its subjects</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={15} color="#475569" /></button>
            </div>

            <form onSubmit={handleSave} style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}><label className="label">Exam Group Name *</label><input required className="input-field" placeholder="e.g. Preparatory Exam – LKG" {...inp('name')} /></div>
                <Sel label="Exam Type *" required value={form.examType} onChange={e => setForm(p => ({ ...p, examType: e.target.value }))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </Sel>
                <Sel label="Academic Year *" required value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}>
                  {['2023-24','2024-25','2025-26','2026-27','2027-28'].map(y => <option key={y}>{y}</option>)}
                </Sel>
                <Sel label="Class *" required value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))}>
                  <option value="">Select class</option>
                  {CLASSES.map(c => <option key={c} value={c}>{/^\d+$/.test(c) ? `Class ${c}` : c}</option>)}
                </Sel>
                <Sel label="Section" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}>
                  <option value="">All sections</option>
                  {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </Sel>
                <div><label className="label">Start Date *</label><input type="date" required className="input-field" {...inp('startDate')} /></div>
                <div><label className="label">End Date *</label><input type="date" required className="input-field" {...inp('endDate')} /></div>
                <Sel label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['Upcoming','Ongoing','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </Sel>
              </div>

              {/* ── Marks for this exam ── */}
              <div style={{ border:'1px solid #bfdbfe', borderRadius:12, padding:14, background:'#f8fbff' }}>
                <div style={{ fontWeight:800, fontSize:13, color:'#1e3a8a', marginBottom:2 }}>Marks per subject for this exam</div>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>Choose one option and every subject below gets these marks. You can still change a single subject afterwards.</div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                  {MARK_OPTIONS.map(m => {
                    const on = activeMax === m;
                    return (
                      <button key={m} type="button" onClick={() => applyToAll(m)}
                        style={{
                          minWidth:46, fontSize:13, padding:'6px 12px', borderRadius:9, cursor:'pointer',
                          border: on ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: on ? '#2563eb' : '#fff',
                          color: on ? '#fff' : '#334155',
                          fontWeight: on ? 800 : 600,
                        }}>
                        {m}
                      </button>
                    );
                  })}
                  <input type="number" min={1} className="input-field" placeholder="Other" style={{ width:80 }}
                    value={customMax} onChange={e => setCustomMax(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyToAll(customMax); } }} />
                  <button type="button" className="btn-secondary" style={{ fontSize:12 }} onClick={() => applyToAll(customMax)}>Apply</button>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, fontSize:12, color:'#475569' }}>
                  Pass percentage
                  <input type="number" min={0} max={100} className="input-field" style={{ width:70 }} value={passPct} onChange={e => changePassPct(e.target.value)} />
                  %
                </div>
              </div>

              {/* ── Subjects & marks ── */}
              <div style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:14, background:'#fcfdff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:10 }}>
                  <label className="label" style={{ margin:0 }}>Subjects *</label>
                  <select className="input-field" style={{ width:'auto', maxWidth:260, fontSize:12 }} value="" onChange={e => loadPreset(e.target.value)}>
                    <option value="">Load preset…</option>
                    {Object.keys(PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  {SUBJECTS.map(s => {
                    const on = subs.some(x => x.name === s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSubject(s)}
                        style={{
                          fontSize:12, padding:'3px 11px', borderRadius:20, cursor:'pointer',
                          border: on ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                          background: on ? '#eff6ff' : '#fff',
                          color: on ? '#1d4ed8' : '#475569',
                          fontWeight: on ? 700 : 400,
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <input className="input-field" placeholder="Add a custom subject (e.g. Sanskrit)" value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubject(customName); setCustomName(''); } }} />
                  <button type="button" className="btn-secondary" style={{ whiteSpace:'nowrap' }}
                    onClick={() => { addSubject(customName); setCustomName(''); }}>
                    <Plus size={13} /> Add
                  </button>
                </div>

                {subs.length === 0 ? (
                  <p style={{ fontSize:12, color:'#ef4444', margin:0 }}>Pick subjects above (they get {defaultMax} marks each), or load a preset.</p>
                ) : (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 96px 96px 32px', gap:8, fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', padding:'0 2px 4px' }}>
                      <div>Subject</div><div>Max marks</div><div>Pass marks</div><div />
                    </div>
                    {subs.map(s => (
                      <div key={s.name} style={{ display:'grid', gridTemplateColumns:'1fr 96px 96px 32px', gap:8, alignItems:'center', marginBottom:6 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{s.name}</div>
                        <input type="number" min={1} className="input-field" value={s.maxMarks} onChange={e => updateSubject(s.name, 'maxMarks', e.target.value)} />
                        <input type="number" min={0} className="input-field" value={s.passMarks} onChange={e => updateSubject(s.name, 'passMarks', e.target.value)} />
                        <button type="button" onClick={() => removeSubject(s.name)} title="Remove"
                          style={{ padding:6, borderRadius:7, border:'1px solid #fecaca', background:'#fff5f5', cursor:'pointer', color:'#ef4444', display:'flex' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ))}

                    <div style={{ display:'flex', gap:10, marginTop:10, paddingTop:10, borderTop:'1px dashed #e2e8f0' }}>
                      <div style={{ flex:1, background:'#eff6ff', borderRadius:9, padding:'8px 12px' }}>
                        <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase' }}>Total marks ({subs.length} subjects)</div>
                        <div style={{ fontSize:20, fontWeight:800, color:'#1d4ed8' }}>{total}</div>
                      </div>
                      <div style={{ flex:1, background:'#f0fdf4', borderRadius:9, padding:'8px 12px' }}>
                        <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase' }}>Pass marks (sum)</div>
                        <div style={{ fontSize:20, fontWeight:800, color:'#16a34a' }}>{passTotal}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div><label className="label">Description</label><input className="input-field" placeholder="Optional notes" {...inp('description')} /></div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : editing ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
