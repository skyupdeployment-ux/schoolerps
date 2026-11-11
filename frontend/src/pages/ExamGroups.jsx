import { useState } from 'react';
import { Plus, Edit, Trash2, X, Loader, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CLASSES  = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'];
const TYPES    = ['Unit Test','Mid Term','Final Exam','Pre-Board','Annual Exam','Quarterly'];
const SUBJECTS = ['Mathematics','Science','English','Hindi','Social Studies','Physics','Chemistry','Biology','Computer Science','Physical Education','Art','Music'];

const INITIAL = {
  name:'', examType:'Unit Test', class:'', section:'',
  startDate:'', endDate:'', totalMarks:100, passingMarks:35,
  subjects:[], description:'', academicYear:'2025-26', status:'Upcoming',
};

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
  { _id:'1', name:'Mid Term 2025', examType:'Mid Term', class:'10', section:'A', startDate:'2025-10-01', endDate:'2025-10-10', totalMarks:100, passingMarks:35, subjects:['Mathematics','Science','English'], academicYear:'2025-26', status:'Upcoming', description:'Mid term examination for Class 10' },
  { _id:'2', name:'Unit Test – Sept', examType:'Unit Test', class:'9', section:'B', startDate:'2025-09-15', endDate:'2025-09-18', totalMarks:50, passingMarks:18, subjects:['Mathematics','Physics'], academicYear:'2025-26', status:'Completed', description:'' },
  { _id:'3', name:'Annual Exam 2026', examType:'Annual Exam', class:'12', section:'A', startDate:'2026-03-01', endDate:'2026-03-15', totalMarks:100, passingMarks:35, subjects:['Physics','Chemistry','Mathematics'], academicYear:'2025-26', status:'Upcoming', description:'Final annual examination' },
];

export default function ExamGroups() {
  const [groups, setGroups]   = useState(DEMO);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(INITIAL);
  const [saving, setSaving]   = useState(false);

  const inp = f => ({ value: form[f]||'', onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });

  const openAdd  = () => { setEditing(null); setForm(INITIAL); setShowModal(true); };
  const openEdit = g  => { setEditing(g); setForm(g); setShowModal(true); };

  const toggleSubject = (sub) => {
    setForm(p => ({
      ...p,
      subjects: p.subjects.includes(sub) ? p.subjects.filter(s => s !== sub) : [...p.subjects, sub]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        setGroups(g => g.map(x => x._id === editing._id ? { ...form, _id: editing._id } : x));
        toast.success('Exam group updated');
      } else {
        setGroups(g => [...g, { ...form, _id: Date.now().toString() }]);
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
          return (
            <div key={g._id} className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{g.name}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{g.examType} · Class {g.class}{g.section ? ` · Sec ${g.section}` : ''}</div>
                </div>
                <span style={{ ...sc, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{g.status}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Start', new Date(g.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})],
                  ['End',   new Date(g.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})],
                  ['Total Marks', g.totalMarks],
                  ['Pass Marks',  g.passingMarks],
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.4 }}>{k}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:.4 }}>Subjects</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {(g.subjects||[]).map(s => (
                    <span key={s} style={{ fontSize:11, background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{s}</span>
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
          <div style={{ background:'#fff', borderRadius:18, maxWidth:640, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#0f172a' }}>{editing ? 'Edit Exam Group' : 'New Exam Group'}</div>
                <div style={{ fontSize:12, color:'#94a3b8' }}>Fill in the exam details</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={15} color="#475569" /></button>
            </div>

            <form onSubmit={handleSave} style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}><label className="label">Exam Group Name *</label><input required className="input-field" placeholder="e.g. Mid Term 2025" {...inp('name')} /></div>
                <Sel label="Exam Type *" required value={form.examType} onChange={e => setForm(p => ({ ...p, examType: e.target.value }))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </Sel>
                <Sel label="Academic Year *" required value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}>
                  {['2023-24','2024-25','2025-26','2026-27'].map(y => <option key={y}>{y}</option>)}
                </Sel>
                <Sel label="Class *" required value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))}>
                  <option value="">Select class</option>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </Sel>
                <Sel label="Section" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}>
                  <option value="">All sections</option>
                  {['A','B','C','D','E'].map(s => <option key={s}>Section {s}</option>)}
                </Sel>
                <div><label className="label">Start Date *</label><input type="date" required className="input-field" {...inp('startDate')} /></div>
                <div><label className="label">End Date *</label><input type="date" required className="input-field" {...inp('endDate')} /></div>
                <div><label className="label">Total Marks *</label><input type="number" required className="input-field" {...inp('totalMarks')} /></div>
                <div><label className="label">Passing Marks *</label><input type="number" required className="input-field" {...inp('passingMarks')} /></div>
                <Sel label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['Upcoming','Ongoing','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </Sel>
              </div>

              <div>
                <label className="label">Subjects *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:12, background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
                  {SUBJECTS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSubject(s)}
                      style={{
                        fontSize:12, padding:'4px 12px', borderRadius:20, cursor:'pointer',
                        border: form.subjects.includes(s) ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        background: form.subjects.includes(s) ? '#eff6ff' : '#fff',
                        color: form.subjects.includes(s) ? '#1d4ed8' : '#475569',
                        fontWeight: form.subjects.includes(s) ? 700 : 400,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
                {form.subjects.length === 0 && <p style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>Select at least one subject</p>}
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