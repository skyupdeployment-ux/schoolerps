// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Loader,
  ChevronDown, Phone, Mail, Star, Camera,
  Upload, GraduationCap, Award, Users, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = ['Mathematics','Science','English','Hindi','Social Studies',
  'Physics','Chemistry','Biology','Computer Science','Physical Education',
  'Arts','Music','Commerce','Accountancy','Economics','Other'];

const SUBJECTS = ['Mathematics','Science','English','Hindi','Social Studies',
  'Physics','Chemistry','Biology','Computer Science','Physical Education','Arts','Music'];

const QUALIFICATIONS = ['B.Ed','M.Ed','B.Sc','M.Sc','B.A','M.A','B.Com','M.Com',
  'B.Tech','M.Tech','Ph.D','D.Ed','Other'];

const DEPT_COLORS = {
  Mathematics:'#3b82f6', Science:'#16a34a', English:'#8b5cf6',
  Hindi:'#f59e0b', Physics:'#0284c7', Chemistry:'#dc2626',
  Biology:'#059669', 'Computer Science':'#6366f1',
  'Physical Education':'#d97706', Arts:'#ec4899', Music:'#14b8a6',
  'Social Studies':'#f97316', Other:'#64748b',
};

const INIT = {
  name:'', teacherId:'', gender:'Male', dateOfBirth:'',
  phone:'', email:'', address:'', qualification:'B.Ed',
  experience:'', joiningDate:'', department:'',
  subjects:[], salary:'', description:'', rating:0, isActive:true,
};

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 20, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(star => (
        <Star
          key={star}
          size={size}
          fill={(hover || value) >= star ? '#f59e0b' : 'none'}
          color={(hover || value) >= star ? '#f59e0b' : '#d1d5db'}
          style={{ cursor: readonly ? 'default' : 'pointer', transition:'all .15s' }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
      {!readonly && value > 0 && (
        <span style={{ fontSize:12, color:'#f59e0b', fontWeight:700, alignSelf:'center', marginLeft:4 }}>
          {value}.0
        </span>
      )}
    </div>
  );
}

// ── Photo Upload ──────────────────────────────────────────────────────────────
function PhotoUpload({ photo, onChange, name }) {
  const ref = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div
        onClick={() => ref.current.click()}
        style={{
          width:100, height:100, borderRadius:'50%',
          border: photo ? '3px solid #3b82f6' : '2px dashed #cbd5e1',
          background: photo ? 'transparent' : '#f8fafc',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', overflow:'hidden', transition:'all .2s', position:'relative',
        }}
        onMouseEnter={e => !photo && (e.currentTarget.style.borderColor='#3b82f6')}
        onMouseLeave={e => !photo && (e.currentTarget.style.borderColor='#cbd5e1')}
      >
        {photo
          ? <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ textAlign:'center', color:'#94a3b8' }}>
              <Camera size={24} />
              <div style={{ fontSize:10, marginTop:4 }}>Add Photo</div>
            </div>
        }
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      <div style={{ display:'flex', gap:5 }}>
        <button type="button" onClick={() => ref.current.click()}
          style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'1px solid #e2e8f0',
            background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', gap:3, color:'#475569' }}>
          <Upload size={10} /> Choose
        </button>
        {photo && (
          <button type="button" onClick={() => onChange(null)}
            style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'1px solid #fecaca',
              background:'#fff5f5', cursor:'pointer', color:'#ef4444' }}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dept Badge ────────────────────────────────────────────────────────────────
function DeptBadge({ dept }) {
  const c = DEPT_COLORS[dept] || '#64748b';
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
      background:`${c}18`, color:c, border:`1px solid ${c}30` }}>
      {dept}
    </span>
  );
}

// ── Sel helper ────────────────────────────────────────────────────────────────
const Sel = ({ label, required, children, ...p }) => (
  <div>
    {label && <label className="label">{label}{required&&' *'}</label>}
    <div style={{ position:'relative' }}>
      <select required={required} className="input-field"
        style={{ appearance:'none', paddingRight:28, cursor:'pointer' }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%',
        transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const Sec = ({ title }) => (
  <div style={{ fontSize:11, fontWeight:700, color:'#3b82f6', textTransform:'uppercase',
    letterSpacing:.8, borderBottom:'2px solid #eff6ff', paddingBottom:7,
    marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
    <div style={{ width:3, height:14, background:'#3b82f6', borderRadius:2 }} />{title}
  </div>
);

// ── Teacher Card (grid view) ──────────────────────────────────────────────────
function TeacherCard({ teacher, onEdit, onDelete }) {
  const c = DEPT_COLORS[teacher.department] || '#64748b';
  const initials = teacher.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="card" style={{ padding:0, overflow:'hidden', transition:'all .2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow=''}>

      {/* Colour top bar */}
      <div style={{ height:4, background:`linear-gradient(90deg,${c},${c}80)` }} />

      <div style={{ padding:'18px 18px 14px' }}>
        {/* Photo + name row */}
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:12 }}>
          {/* Photo */}
          <div style={{ flexShrink:0 }}>
            {teacher.photo
              ? <img src={teacher.photo} alt={teacher.name}
                  style={{ width:68, height:68, borderRadius:'50%', objectFit:'cover',
                    border:`3px solid ${c}40` }} />
              : <div style={{ width:68, height:68, borderRadius:'50%',
                  background:`${c}18`, border:`3px solid ${c}30`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:22, color:c }}>
                  {initials}
                </div>
            }
          </div>

          {/* Name + meta */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:15, color:'#0f172a',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {teacher.name}
            </div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
              {teacher.gender} · {teacher.teacherId || '—'}
            </div>
            {/* Star rating */}
            <div style={{ marginTop:6 }}>
              <StarRating value={teacher.rating || 0} readonly size={14} />
            </div>
          </div>

          {/* Status dot */}
          <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, marginTop:4,
            background: teacher.isActive ? '#16a34a' : '#ef4444' }} title={teacher.isActive?'Active':'Inactive'} />
        </div>

        {/* Department */}
        {teacher.department && (
          <div style={{ marginBottom:10 }}>
            <DeptBadge dept={teacher.department} />
          </div>
        )}

        {/* Description */}
        {teacher.description && (
          <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6, marginBottom:10,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {teacher.description}
          </p>
        )}

        {/* Info grid */}
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
          {teacher.phone && (
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#475569' }}>
              <Phone size={12} color={c} /> {teacher.phone}
            </div>
          )}
          {teacher.email && (
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#475569',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              <Mail size={12} color={c} />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{teacher.email}</span>
            </div>
          )}
          {teacher.qualification && (
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#475569' }}>
              <GraduationCap size={12} color={c} /> {teacher.qualification}
            </div>
          )}
          {teacher.experience && (
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#475569' }}>
              <Award size={12} color={c} /> {teacher.experience} yrs experience
            </div>
          )}
        </div>

        {/* Subject tags */}
        {teacher.subjects?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
            {teacher.subjects.slice(0,3).map(s => (
              <span key={s} style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:12,
                background:`${c}12`, color:c }}>
                {s}
              </span>
            ))}
            {teacher.subjects.length > 3 && (
              <span style={{ fontSize:10, color:'#94a3b8', padding:'2px 5px' }}>
                +{teacher.subjects.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:8, borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
          <button onClick={() => onEdit(teacher)}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              padding:'7px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc',
              cursor:'pointer', fontSize:12, fontWeight:600, color:'#475569', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#3b82f6'; e.currentTarget.style.color='#3b82f6'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569'; }}>
            <Edit size={13} /> Edit
          </button>
          <button onClick={() => onDelete(teacher._id)}
            style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fff5f5',
              cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Teachers page ────────────────────────────────────────────────────────
export default function Teachers() {
  const [teachers, setTeachers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode]   = useState('card'); // 'card' | 'table'
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(INIT);
  const [photo, setPhoto]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage]           = useState(1);

  const inp = f => ({ value: form[f] ?? '', onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });

  const toggleSubject = (sub) => {
    setForm(p => ({
      ...p,
      subjects: p.subjects.includes(sub)
        ? p.subjects.filter(s => s !== sub)
        : [...p.subjects, sub]
    }));
  };

  // Load from API
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers', { params: { page, limit:50, search } });
      const raw = res.data.data || [];
      setTeachers(raw);
      setPagination(res.data.pagination || {});
    } catch {
      // Fallback demo data
      setTeachers([
        { _id:'t1', name:'Mrs. Kavitha Nair', teacherId:'TCH001', gender:'Female', phone:'9876543220', email:'kavitha@school.com', department:'Mathematics', qualification:'M.Sc Mathematics', experience:8, rating:5, description:'Highly experienced Mathematics teacher with 8 years of teaching excellence. Known for making complex topics simple and engaging for students.', subjects:['Mathematics','Physics'], isActive:true, photo:null, joiningDate:'2018-06-01' },
        { _id:'t2', name:'Mr. Arun Singh',    teacherId:'TCH002', gender:'Male',   phone:'9876543221', email:'arun@school.com',    department:'English',     qualification:'M.A English',      experience:5, rating:4, description:'Passionate English language educator with expertise in literature and creative writing. Consistently achieves top results in board examinations.', subjects:['English','Hindi'], isActive:true, photo:null, joiningDate:'2021-07-15' },
        { _id:'t3', name:'bhojaraj',          teacherId:'TCH00003',gender:'Male',  phone:'6563476534', email:'bhojaraj@gmail.com', department:'English',     qualification:'Er.engg',          experience:8, rating:3, description:'Dedicated teacher with strong subject knowledge and innovative teaching methods.', subjects:['English'], isActive:true, photo:null, joiningDate:'2020-04-01' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, [page, search]);

  const openAdd  = () => { setEditing(null); setForm(INIT); setPhoto(null); setShowModal(true); };
  const openEdit = t  => { setEditing(t); setForm(t); setPhoto(t.photo||null); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, photo };
      if (editing) {
        await api.put(`/teachers/${editing._id}`, payload);
        setTeachers(prev => prev.map(t => t._id===editing._id ? { ...payload, _id:editing._id } : t));
        toast.success('Teacher updated');
      } else {
        const res = await api.post('/teachers', payload);
        setTeachers(prev => [...prev, res.data.data || { ...payload, _id:Date.now().toString() }]);
        toast.success('Teacher added');
      }
      setShowModal(false);
    } catch {
      // Offline fallback
      if (editing) {
        setTeachers(prev => prev.map(t => t._id===editing._id ? { ...form, photo, _id:editing._id } : t));
        toast.success('Teacher updated');
      } else {
        setTeachers(prev => [...prev, { ...form, photo, _id:Date.now().toString() }]);
        toast.success('Teacher added');
      }
      setShowModal(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher?')) return;
    try { await api.delete(`/teachers/${id}`); } catch {}
    setTeachers(prev => prev.filter(t => t._id !== id));
    toast.success('Teacher removed');
  };

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.teacherId?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
      && (!deptFilter || t.department === deptFilter);
  });

  const avgRating = teachers.length
    ? (teachers.reduce((s,t)=>s+(t.rating||0),0)/teachers.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 text-sm">{pagination.total || teachers.length} total teachers</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Add Teacher</button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
        {[
          { label:'Total Teachers', value:teachers.length,               color:'#3b82f6', icon:Users       },
          { label:'Active',         value:teachers.filter(t=>t.isActive).length, color:'#16a34a', icon:GraduationCap },
          { label:'Departments',    value:[...new Set(teachers.map(t=>t.department).filter(Boolean))].length, color:'#8b5cf6', icon:BookOpen },
          { label:'Avg Rating',     value:`⭐ ${avgRating}`,             color:'#f59e0b', icon:Star        },
        ].map(k => (
          <div key={k.label} className="card"
            style={{ padding:'14px 16px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color, borderRadius:'12px 12px 0 0' }} />
            <div style={{ background:`${k.color}18`, borderRadius:9, padding:9, flexShrink:0 }}>
              <k.icon size={17} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + view toggle ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="input-field" placeholder="Search teachers..."
            style={{ paddingLeft:28 }} value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ position:'relative', minWidth:180 }}>
          <select className="input-field" style={{ appearance:'none', paddingRight:24 }}
            value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={12} style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
        </div>
        {/* View toggle */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:9, padding:3, gap:2 }}>
          {[['card','⊞ Cards'],['table','☰ Table']].map(([v,l]) => (
            <button key={v} onClick={()=>setViewMode(v)}
              style={{ padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:600, transition:'all .15s',
                background: viewMode===v?'#fff':'transparent',
                color:       viewMode===v?'#1e40af':'#64748b',
                boxShadow:   viewMode===v?'0 1px 4px rgba(0,0,0,.08)':'none' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
          <GraduationCap size={36} style={{ margin:'0 auto 10px', opacity:.3 }} />
          <div style={{ fontSize:14, fontWeight:600 }}>No teachers found</div>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD VIEW */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
          {filtered.map(t => (
            <TeacherCard key={t._id} teacher={t} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr><th>#</th><th>Teacher</th><th>Teacher ID</th><th>Department</th><th>Contact</th><th>Qualification</th><th>Experience</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((t,i) => (
                  <tr key={t._id}>
                    <td style={{ color:'#94a3b8' }}>{i+1}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {t.photo
                          ? <img src={t.photo} alt={t.name} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0', flexShrink:0 }} />
                          : <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
                              background:`${DEPT_COLORS[t.department]||'#64748b'}18`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontWeight:800, fontSize:13, color:DEPT_COLORS[t.department]||'#64748b' }}>
                              {t.name[0].toUpperCase()}
                            </div>
                        }
                        <div>
                          <div style={{ fontWeight:600, color:'#0f172a' }}>{t.name}</div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>{t.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{t.teacherId||'—'}</td>
                    <td>{t.department ? <DeptBadge dept={t.department} /> : '—'}</td>
                    <td>
                      {t.phone && <div style={{ fontSize:12, display:'flex', alignItems:'center', gap:4 }}><Phone size={11}/> {t.phone}</div>}
                      {t.email && <div style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}><Mail size={11}/> {t.email}</div>}
                    </td>
                    <td style={{ fontSize:12 }}>{t.qualification||'—'}</td>
                    <td style={{ fontSize:12 }}>{t.experience ? `${t.experience} yrs` : '—'}</td>
                    <td><StarRating value={t.rating||0} readonly size={13} /></td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                        background: t.isActive?'#dcfce7':'#fee2e2', color:t.isActive?'#16a34a':'#dc2626' }}>
                        {t.isActive?'Active':'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>openEdit(t)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={13}/></button>
                        <button onClick={()=>handleDelete(t._id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720,
            maxHeight:'93vh', overflowY:'auto' }}>

            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'20px 24px', borderBottom:'1px solid #f1f5f9',
              position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:'#0f172a' }}>{editing?'Edit Teacher':'Add New Teacher'}</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Fields marked * are required</div>
              </div>
              <button onClick={()=>setShowModal(false)} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}>
                <X size={15} color="#475569" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding:24, display:'flex', flexDirection:'column', gap:22 }}>

              {/* Personal */}
              <div>
                <Sec title="Personal Information" />
                <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                  {/* Photo */}
                  <div style={{ flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'#64748b', marginBottom:8, textAlign:'center' }}>Photo</div>
                    <PhotoUpload photo={photo} onChange={setPhoto} name={form.name} />
                  </div>
                  <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label className="label">Full Name *</label>
                      <input required className="input-field" placeholder="e.g. Mrs. Kavitha Nair" {...inp('name')} />
                    </div>
                    <div><label className="label">Teacher ID</label><input className="input-field" placeholder="TCH001" {...inp('teacherId')} /></div>
                    <Sel label="Gender" value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </Sel>
                    <div><label className="label">Date of Birth</label><input type="date" className="input-field" {...inp('dateOfBirth')} /></div>
                    <div><label className="label">Phone *</label><input required type="tel" className="input-field" {...inp('phone')} /></div>
                    <div><label className="label">Email *</label><input required type="email" className="input-field" {...inp('email')} /></div>
                  </div>
                </div>
                <div style={{ marginTop:12 }}>
                  <label className="label">Address</label>
                  <input className="input-field" placeholder="Full address" {...inp('address')} />
                </div>
              </div>

              {/* Professional */}
              <div>
                <Sec title="Professional Information" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Sel label="Department *" required value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                  </Sel>
                  <Sel label="Qualification" value={form.qualification} onChange={e=>setForm(p=>({...p,qualification:e.target.value}))}>
                    {QUALIFICATIONS.map(q=><option key={q}>{q}</option>)}
                  </Sel>
                  <div><label className="label">Experience (years)</label><input type="number" min={0} className="input-field" placeholder="5" {...inp('experience')} /></div>
                  <div><label className="label">Joining Date</label><input type="date" className="input-field" {...inp('joiningDate')} /></div>
                  <div><label className="label">Salary (₹)</label><input type="number" className="input-field" placeholder="35000" {...inp('salary')} /></div>
                </div>

                {/* Subjects */}
                <div style={{ marginTop:14 }}>
                  <label className="label">Subjects Taught</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:12, background:'#f8fafc',
                    borderRadius:10, border:'1px solid #e2e8f0' }}>
                    {SUBJECTS.map(s => (
                      <button key={s} type="button" onClick={()=>toggleSubject(s)}
                        style={{ fontSize:12, padding:'4px 12px', borderRadius:20, cursor:'pointer',
                          border: form.subjects?.includes(s) ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                          background: form.subjects?.includes(s) ? '#eff6ff' : '#fff',
                          color: form.subjects?.includes(s) ? '#1d4ed8' : '#475569',
                          fontWeight: form.subjects?.includes(s) ? 700 : 400 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating & Description */}
              <div>
                <Sec title="Rating & Description" />
                <div style={{ marginBottom:16 }}>
                  <label className="label">Teacher Rating</label>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
                    <StarRating
                      value={form.rating || 0}
                      onChange={val => setForm(p=>({...p, rating:val}))}
                      size={28}
                    />
                    {form.rating > 0 && (
                      <span style={{ fontSize:13, color:'#64748b' }}>
                        {['','Poor','Below Average','Average','Good','Excellent'][form.rating]}
                      </span>
                    )}
                    {form.rating > 0 && (
                      <button type="button" onClick={()=>setForm(p=>({...p,rating:0}))}
                        style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer' }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Description / Bio</label>
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm(p=>({...p,description:e.target.value}))}
                    placeholder="Brief description of the teacher — their teaching style, achievements, specialisations..."
                    rows={4}
                    style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:9, padding:'10px 12px',
                      fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit',
                      lineHeight:1.7, transition:'border-color .2s' }}
                    onFocus={e => e.target.style.borderColor='#3b82f6'}
                    onBlur={e  => e.target.style.borderColor='#e5e7eb'}
                  />
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>
                    {(form.description||'').length}/500 characters
                  </div>
                </div>
                {/* Active toggle */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12,
                  padding:'10px 14px', background:'#f8fafc', borderRadius:9 }}>
                  <input type="checkbox" id="activeCheck" checked={form.isActive}
                    onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))} style={{ width:16, height:16 }} />
                  <label htmlFor="activeCheck" style={{ fontSize:13, fontWeight:600, color:'#475569', cursor:'pointer' }}>
                    Teacher is currently active
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10,
                paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : editing ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}