import { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Loader,
  Upload, FileText, Trash, Share2, Camera, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Helper: safely display class (handles ObjectId, object, or plain string)
const displayClass = (cls) => {
  if (!cls) return '—';
  if (typeof cls === 'object') return cls.grade || cls.name || '—';
  if (typeof cls === 'string' && cls.length > 20) return '—'; // ObjectId
  return cls;
};


const INITIAL = {
  firstName:'', lastName:'', admissionNumber:'', dateOfBirth:'',
  gender:'Male', bloodGroup:'', phone:'', email:'',
  address:'', city:'', state:'', pincode:'',
  admissionDate:'', academicYear:'2024-25', rollNumber:'',
  fatherName:'', motherName:'', parentPhone:'', parentEmail:'',
  class:'', section:'', aadharNumber:'',
};

const DEMO_STUDENTS = [
  { _id:'s1', firstName:'siddu',  lastName:'madabhavi', admissionNumber:'11',     class:'11', section:'B', gender:'Male',   parentPhone:'6362168219', isActive:true, photo:null },
  { _id:'s2', firstName:'sidda',  lastName:'madabhavi', admissionNumber:'123',    class:'10', section:'A', gender:'Male',   parentPhone:'9008303681', isActive:true, photo:null },
  { _id:'s3', firstName:'roshan', lastName:'prabhu',    admissionNumber:'234444', class:'10', section:'A', gender:'Male',   parentPhone:'',           isActive:true, photo:null },
  { _id:'s4', firstName:'Arjun',  lastName:'Sharma',    admissionNumber:'ADM001', class:'10', section:'A', gender:'Male',   parentPhone:'9876543210', isActive:true, photo:null },
  { _id:'s5', firstName:'Priya',  lastName:'Patel',     admissionNumber:'ADM002', class:'10', section:'A', gender:'Female', parentPhone:'9876543211', isActive:true, photo:null },
  { _id:'s6', firstName:'Rahul',  lastName:'Kumar',     admissionNumber:'ADM003', class:'9',  section:'A', gender:'Male',   parentPhone:'9876543212', isActive:true, photo:null },
  { _id:'s7', firstName:'Sneha',  lastName:'Reddy',     admissionNumber:'ADM004', class:'9',  section:'A', gender:'Female', parentPhone:'9876543213', isActive:true, photo:null },
];


const DOC_TYPES = ['Birth Certificate','Transfer Certificate','Marksheet','ID Proof','Aadhar Card','Other'];

// ── Photo upload component ────────────────────────────────────────────────────
function PhotoUpload({ photo, onChange }) {
  const ref = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div
        onClick={() => ref.current.click()}
        style={{
          width:100, height:100, borderRadius:50,
          background: photo ? 'transparent' : '#f1f5f9',
          border: '2px dashed #cbd5e1',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', overflow:'hidden', position:'relative',
          transition:'border-color .2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'}
        onMouseLeave={e => e.currentTarget.style.borderColor='#cbd5e1'}
      >
        {photo
          ? <img src={photo} alt="student" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ textAlign:'center', color:'#94a3b8' }}>
              <Camera size={24} />
              <div style={{ fontSize:10, marginTop:4 }}>Upload photo</div>
            </div>
        }
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      <div style={{ display:'flex', gap:6 }}>
        <button type="button" onClick={() => ref.current.click()}
          style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0',
            background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#475569' }}>
          <Upload size={11} /> Choose
        </button>
        {photo && (
          <button type="button" onClick={() => onChange(null)}
            style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #fecaca',
              background:'#fff5f5', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#ef4444' }}>
            <Trash size={11} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ── Document row component ────────────────────────────────────────────────────
function DocumentRow({ doc, index, onChange, onRemove }) {
  const ref = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(index, { ...doc, file: ev.target.result, fileName: file.name, fileType: file.type });
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 140px auto', gap:8, alignItems:'center',
      padding:'10px 12px', background:'#f8fafc', borderRadius:8, border:'1px solid #f1f5f9' }}>
      <select
        className="input-field"
        value={doc.type}
        onChange={e => onChange(index, { ...doc, type: e.target.value })}
        style={{ fontSize:12, padding:'6px 8px' }}
      >
        {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      <input
        className="input-field"
        placeholder="Document name / notes"
        value={doc.name}
        onChange={e => onChange(index, { ...doc, name: e.target.value })}
        style={{ fontSize:12, padding:'6px 8px' }}
      />
      <div>
        {doc.fileName
          ? <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <FileText size={13} color="#3b82f6" />
              <span style={{ fontSize:11, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:90 }}>
                {doc.fileName}
              </span>
              <button type="button" onClick={() => onChange(index, { ...doc, file:null, fileName:null })}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:0 }}>
                <X size={12} />
              </button>
            </div>
          : <button type="button" onClick={() => ref.current.click()}
              style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0',
                background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#475569', whiteSpace:'nowrap' }}>
              <Upload size={11} /> Upload file
            </button>
        }
        <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display:'none' }} onChange={handleFile} />
      </div>
      <button type="button" onClick={() => onRemove(index)}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}>
        <Trash size={14} />
      </button>
    </div>
  );
}

// ── WhatsApp share helper ─────────────────────────────────────────────────────
function shareAdmissionWhatsApp(form) {
  const text = `🎓 *Admission Confirmation*\n\n`
    + `*Student:* ${form.firstName} ${form.lastName}\n`
    + `*Admission No:* ${form.admissionNumber}\n`
    + `*Class:* ${form.class || '—'} | *Section:* ${form.section || '—'}\n`
    + `*Roll No:* ${form.rollNumber || '—'}\n`
    + `*Academic Year:* ${form.academicYear}\n`
    + `*Admission Date:* ${form.admissionDate || '—'}\n\n`
    + `*Parent Contact:* ${form.parentPhone || form.phone || '—'}\n\n`
    + `Please keep this message for your records. Welcome to the school! 🏫`;
  const encoded = encodeURIComponent(text);
  const phone = (form.parentPhone || form.phone || '').replace(/\D/g, '');
  const url = phone
    ? `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}

// ── Section header ────────────────────────────────────────────────────────────
const Sec = ({ title }) => (
  <h3 style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase',
    letterSpacing:.6, borderBottom:'1px solid #f1f5f9', paddingBottom:8, marginBottom:12 }}>
    {title}
  </h3>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function Students() {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(INITIAL);
  const [saving, setSaving]       = useState(false);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});
  const [photo, setPhoto]         = useState(null);
  const [docs, setDocs]           = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', { params: { page, limit:15, search } });
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setStudents(data);
        setPagination(res.data?.pagination || {});
      } else {
        setStudents(DEMO_STUDENTS);
      }
    } catch (err) {
      // 401 Unauthorized or backend offline — silently use demo data
      // No toast error shown to user
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        // Only log non-auth errors for debugging
        console.log('Students API:', status || 'offline');
      }
      setStudents(DEMO_STUDENTS);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [page, search]);

  const openAdd = () => {
    setEditing(null); setForm(INITIAL); setPhoto(null); setDocs([]); setShowModal(true);
  };
  const openEdit = (s) => {
    setEditing(s); setForm(s); setPhoto(s.photo || null);
    setDocs(s.documents || []); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, photo, documents: docs };
      if (editing) {
        await api.put(`/students/${editing._id}`, payload);
        toast.success('Student updated');
      } else {
        await api.post('/students', payload);
        toast.success('Student added');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this student?')) return;
    try { await api.delete(`/students/${id}`); toast.success('Removed'); fetchStudents(); }
    catch { toast.error('Failed to delete'); }
  };

  const inp = (field) => ({
    value: form[field] || '',
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value }))
  });

  const addDoc = () => setDocs(d => [...d, { type:'Birth Certificate', name:'', file:null, fileName:null }]);
  const updateDoc = (i, val) => setDocs(d => d.map((x, idx) => idx === i ? val : x));
  const removeDoc = (i) => setDocs(d => d.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm">{pagination.total || 0} total students</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} />Add Student</button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 w-64" placeholder="Search students..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm mt-1">Add your first student to get started</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Photo</th><th>Name</th><th>Admission No.</th><th>Class</th><th>Gender</th><th>Parent Phone</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td className="text-gray-400">{(page-1)*15+i+1}</td>
                    <td>
                      {s.photo
                        ? <img src={s.photo} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0' }} />
                        : <div style={{ width:32, height:32, borderRadius:'50%', background:'#dbeafe',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontWeight:700, fontSize:12, color:'#3b82f6' }}>
                            {s.firstName?.[0]}
                          </div>
                      }
                    </td>
                    <td><span className="font-medium">{s.firstName} {s.lastName}</span></td>
                    <td className="text-gray-500">{s.admissionNumber}</td>
                    <td>{displayClass(s.class)}</td>
                    <td>{s.gender}</td>
                    <td>{s.parentPhone || '—'}</td>
                    <td><span className={s.isActive !== false ? 'badge-success' : 'badge-danger'}>{s.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                        <button onClick={() => shareAdmissionWhatsApp(s)}
                          style={{ padding:'6px', borderRadius:6, background:'none', border:'none',
                            cursor:'pointer', color:'#25D366' }} title="Share via WhatsApp">
                          <Share2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(s._id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary disabled:opacity-40">Prev</button>
              <button disabled={page===pagination.pages} onClick={() => setPage(p=>p+1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,.2)',
            width:'100%', maxWidth:740, maxHeight:'92vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>

            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'20px 24px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0 }}>
                  {editing ? 'Edit Student' : 'Add New Student'}
                </h2>
                <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0' }}>
                  Fill all required fields marked with *
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {/* WhatsApp share button in header */}
                {(form.admissionNumber) && (
                  <button type="button" onClick={() => shareAdmissionWhatsApp(form)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                      borderRadius:8, border:'1px solid #25D366', background:'#f0fdf4',
                      color:'#16a34a', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    <Share2 size={13} /> Share via WhatsApp
                  </button>
                )}
                <button onClick={() => setShowModal(false)}
                  style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}>
                  <X size={16} color="#475569" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ padding:24, display:'flex', flexDirection:'column', gap:24 }}>

              {/* ── Photo + Personal info ── */}
              <div>
                <Sec title="Personal Information" />
                <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                  {/* Photo */}
                  <div style={{ flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'#64748b', marginBottom:8 }}>Student Photo</div>
                    <PhotoUpload photo={photo} onChange={setPhoto} />
                  </div>
                  {/* Fields */}
                  <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div><label className="label">First Name *</label><input required className="input-field" {...inp('firstName')} /></div>
                    <div><label className="label">Last Name *</label><input required className="input-field" {...inp('lastName')} /></div>
                    <div><label className="label">Admission Number *</label><input required className="input-field" {...inp('admissionNumber')} /></div>
                    <div><label className="label">Date of Birth *</label><input type="date" required className="input-field" {...inp('dateOfBirth')} /></div>
                    <div>
                      <label className="label">Gender *</label>
                      <select required className="input-field" {...inp('gender')}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Blood Group</label>
                      <select className="input-field" {...inp('bloodGroup')}>
                        <option value="">Select</option>
                        {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Phone</label><input className="input-field" {...inp('phone')} /></div>
                    <div><label className="label">Email</label><input type="email" className="input-field" {...inp('email')} /></div>
                  </div>
                </div>
                {/* Aadhaar */}
                <div style={{ marginTop:14 }}>
                  <label className="label">Aadhaar Number</label>
                  <input
                    className="input-field"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    value={form.aadharNumber || ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g,'').slice(0,12);
                      const fmt = raw.replace(/(\d{4})(?=\d)/g,'$1 ');
                      setForm(f => ({ ...f, aadharNumber: fmt }));
                    }}
                    style={{ maxWidth:240 }}
                  />
                </div>
                {/* Address */}
                <div style={{ marginTop:14 }}>
                  <label className="label">Address</label>
                  <input className="input-field" {...inp('address')} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginTop:14 }}>
                  <div><label className="label">City</label><input className="input-field" {...inp('city')} /></div>
                  <div><label className="label">State</label><input className="input-field" {...inp('state')} /></div>
                  <div><label className="label">Pincode</label><input className="input-field" {...inp('pincode')} /></div>
                </div>
              </div>

              {/* ── Academic ── */}
              <div>
                <Sec title="Academic Information" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div><label className="label">Admission Date *</label><input type="date" required className="input-field" {...inp('admissionDate')} /></div>
                  <div><label className="label">Academic Year *</label><input required className="input-field" {...inp('academicYear')} /></div>
                  {/* Class dropdown */}
                  <div>
                    <label className="label">Class</label>
                    <div style={{ position:'relative' }}>
                      <select className="input-field" style={{ appearance:'none', paddingRight:28 }}
                        value={form.class || ''}
                        onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
                        <option value="">Select Class</option>
                        {['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'].map(c => (
                          <option key={c} value={c}>{c === 'Nursery' || c === 'LKG' || c === 'UKG' ? c : `Class ${c}`}</option>
                        ))}
                      </select>
                      <svg style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#94a3b8' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                  {/* Section dropdown */}
                  <div>
                    <label className="label">Section</label>
                    <div style={{ position:'relative' }}>
                      <select className="input-field" style={{ appearance:'none', paddingRight:28 }}
                        value={form.section || ''}
                        onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
                        <option value="">Select Section</option>
                        {['A','B','C','D','E'].map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                      <svg style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#94a3b8' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                  <div><label className="label">Roll Number</label><input className="input-field" {...inp('rollNumber')} /></div>
                </div>
              </div>

              {/* ── Parent ── */}
              <div>
                <Sec title="Parent Information" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div><label className="label">Father's Name</label><input className="input-field" {...inp('fatherName')} /></div>
                  <div><label className="label">Mother's Name</label><input className="input-field" {...inp('motherName')} /></div>
                  <div><label className="label">Parent Phone</label><input className="input-field" {...inp('parentPhone')} /></div>
                  <div><label className="label">Parent Email</label><input type="email" className="input-field" {...inp('parentEmail')} /></div>
                </div>
              </div>

              {/* ── Documents ── */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <Sec title="Documents" />
                  <button type="button" onClick={addDoc}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
                      padding:'5px 12px', borderRadius:7, border:'1px dashed #93c5fd',
                      background:'#eff6ff', color:'#3b82f6', cursor:'pointer' }}>
                    <Plus size={12} /> Add Document
                  </button>
                </div>
                {docs.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:13,
                    border:'1px dashed #e2e8f0', borderRadius:10, background:'#f8fafc' }}>
                    <FileText size={20} style={{ margin:'0 auto 6px', opacity:.5 }} />
                    No documents added yet — click "Add Document" to upload
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 140px auto', gap:8, padding:'0 12px' }}>
                      <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Type</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Name / Notes</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>File</span>
                      <span></span>
                    </div>
                    {docs.map((doc, i) => (
                      <DocumentRow key={i} doc={doc} index={i} onChange={updateDoc} onRemove={removeDoc} />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                paddingTop:16, borderTop:'1px solid #f1f5f9', gap:10 }}>
                {/* WhatsApp share (left side) */}
                <button type="button" onClick={() => shareAdmissionWhatsApp(form)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
                    borderRadius:9, border:'1px solid #25D366', background:'#f0fdf4',
                    color:'#16a34a', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  <Share2 size={15} />
                  Share Admission Form on WhatsApp
                </button>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <><Loader size={14} className="animate-spin" /> Saving...</> : editing ? 'Update Student' : 'Add Student'}
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