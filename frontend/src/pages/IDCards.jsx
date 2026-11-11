// @ts-nocheck
import { useState } from 'react';
import {
  Plus, Search, Download, Printer, X, Loader,
  ChevronDown, Users, CreditCard, Eye,
  MessageCircle, CheckCircle, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── School Info ───────────────────────────────────────────
const SCHOOL = {
  name:    'Greenfield Public School',
  address: '123 School Road, Bengaluru, Karnataka – 560001',
  phone:   '080-12345678',
  email:   'info@greenfieldschool.edu',
  website: 'www.greenfieldschool.edu',
  logo:    '🏫',
  color:   '#1e3a8a', // Primary color for ID card
  session: '2025-26',
};

const CLASSES   = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS  = ['A','B','C','D','E'];
const CARD_TYPES = ['Student','Teacher','Staff'];

// ── Demo Students ─────────────────────────────────────────
const DEMO_STUDENTS = [
  { _id:'s1', name:'Arjun Sharma',    admNo:'ADM001', class:'10', section:'A', dob:'2009-05-12', bloodGroup:'B+', parentName:'Rajesh Sharma',   parentPhone:'9876543210', address:'12, MG Road, Bengaluru', photo:null },
  { _id:'s2', name:'Priya Patel',     admNo:'ADM002', class:'10', section:'A', dob:'2009-08-22', bloodGroup:'O+', parentName:'Suresh Patel',    parentPhone:'9876543211', address:'45, JP Nagar, Bengaluru', photo:null },
  { _id:'s3', name:'Rahul Kumar',     admNo:'ADM003', class:'9',  section:'A', dob:'2010-01-09', bloodGroup:'A+', parentName:'Anil Kumar',      parentPhone:'9876543212', address:'78, Koramangala, Bengaluru', photo:null },
  { _id:'s4', name:'Sneha Reddy',     admNo:'ADM004', class:'9',  section:'A', dob:'2009-11-30', bloodGroup:'AB+',parentName:'Venkat Reddy',    parentPhone:'9876543213', address:'34, HSR Layout, Bengaluru', photo:null },
  { _id:'s5', name:'Sidda Madabhavi', admNo:'123',    class:'10', section:'A', dob:'2010-03-17', bloodGroup:'O-', parentName:'Madabhavi Senior', parentPhone:'9008303681', address:'56, Whitefield, Bengaluru', photo:null },
  { _id:'s6', name:'siddu madabhavi', admNo:'11',     class:'11', section:'B', dob:'2008-07-21', bloodGroup:'B-', parentName:'Senior Madabhavi', parentPhone:'6362168219', address:'89, Indiranagar, Bengaluru', photo:null },
];

const DEMO_TEACHERS = [
  { _id:'t1', name:'Mrs. Kavitha Nair', empId:'EMP001', designation:'Mathematics Teacher', department:'Mathematics', phone:'9876543220', email:'kavitha@school.edu', bloodGroup:'A+', photo:null },
  { _id:'t2', name:'Mr. Rajan Pillai',  empId:'EMP002', designation:'Science Teacher',     department:'Science',     phone:'9876543221', email:'rajan@school.edu',   bloodGroup:'O+', photo:null },
];

// ── Helpers ───────────────────────────────────────────────
const Sel = ({ label, children, ...p }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <div style={{ position:'relative' }}>
      <select className="input-field" style={{ appearance:'none', paddingRight:28 }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%',
        transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

// ── Student ID Card Component ─────────────────────────────
function StudentIDCard({ student, school, mini = false }) {
  const scale = mini ? 0.55 : 1;
  const W = 320, H = 200;

  return (
    <div id={`id-card-${student._id}`}
      style={{
        width: W, height: H,
        fontFamily: "'Arial', sans-serif",
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: mini ? 'none' : '0 4px 20px rgba(0,0,0,.15)',
        transform: mini ? `scale(${scale})` : 'none',
        transformOrigin: 'top left',
        border: '1px solid #e2e8f0',
        background: '#fff',
        position: 'relative',
        flexShrink: 0,
      }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${school.color}, #3b82f6)`,
        padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:24 }}>{school.logo}</div>
        <div style={{ flex:1 }}>
          <div style={{ color:'#fff', fontWeight:900, fontSize:11, letterSpacing:.3 }}>{school.name}</div>
          <div style={{ color:'rgba(255,255,255,.8)', fontSize:8, marginTop:1 }}>{school.address}</div>
        </div>
        <div style={{ background:'rgba(255,255,255,.2)', borderRadius:6, padding:'3px 8px',
          color:'#fff', fontSize:8, fontWeight:700, textAlign:'center', lineHeight:1.4 }}>
          STUDENT<br/>ID CARD
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'flex', padding:'10px 14px', gap:12, flex:1 }}>
        {/* Photo */}
        <div style={{ width:64, height:80, border:`2px solid ${school.color}`,
          borderRadius:8, overflow:'hidden', flexShrink:0, background:'#f8fafc',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {student.photo
            ? <img src={student.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ textAlign:'center', fontSize:9, color:'#94a3b8', padding:4 }}>
                <div style={{ fontSize:22, marginBottom:2 }}>👤</div>
                Photo
              </div>
          }
        </div>

        {/* Details */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:900, fontSize:13, color:school.color, marginBottom:6,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {student.name}
          </div>
          {[
            ['Adm No',  student.admNo],
            ['Class',   `Class ${student.class} – Sec ${student.section}`],
            ['DOB',     student.dob ? new Date(student.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
            ['Blood',   student.bloodGroup || '—'],
            ['Parent',  student.parentName || '—'],
            ['Ph',      student.parentPhone || '—'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', gap:4, marginBottom:2 }}>
              <span style={{ fontSize:8, color:'#94a3b8', fontWeight:600, minWidth:30 }}>{k}:</span>
              <span style={{ fontSize:8, fontWeight:700, color:'#0f172a',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:`${school.color}12`, borderTop:`2px solid ${school.color}30`,
        padding:'5px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:8, color:'#64748b' }}>Session: {school.session}</div>
        <div style={{ fontSize:8, color:'#64748b', fontWeight:600 }}>
          📞 {school.phone}
        </div>
        <div style={{ background:school.color, color:'#fff', fontSize:7,
          fontWeight:700, padding:'2px 6px', borderRadius:4 }}>
          VALID {school.session}
        </div>
      </div>
    </div>
  );
}

// ── Teacher ID Card ───────────────────────────────────────
function TeacherIDCard({ teacher, school, mini = false }) {
  const scale = mini ? 0.55 : 1;
  const W = 320, H = 200;

  return (
    <div id={`id-card-${teacher._id}`}
      style={{ width:W, height:H, fontFamily:"'Arial',sans-serif", borderRadius:14,
        overflow:'hidden', boxShadow: mini?'none':'0 4px 20px rgba(0,0,0,.15)',
        transform: mini?`scale(${scale})`:'none', transformOrigin:'top left',
        border:'1px solid #e2e8f0', background:'#fff', position:'relative', flexShrink:0 }}>

      {/* Header — different color for teacher */}
      <div style={{ background:'linear-gradient(135deg,#065f46,#10b981)',
        padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:24 }}>{school.logo}</div>
        <div style={{ flex:1 }}>
          <div style={{ color:'#fff', fontWeight:900, fontSize:11 }}>{school.name}</div>
          <div style={{ color:'rgba(255,255,255,.8)', fontSize:8, marginTop:1 }}>{school.address}</div>
        </div>
        <div style={{ background:'rgba(255,255,255,.2)', borderRadius:6, padding:'3px 8px',
          color:'#fff', fontSize:8, fontWeight:700, textAlign:'center', lineHeight:1.4 }}>
          STAFF<br/>ID CARD
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'flex', padding:'10px 14px', gap:12 }}>
        <div style={{ width:64, height:80, border:'2px solid #10b981', borderRadius:8,
          overflow:'hidden', flexShrink:0, background:'#f0fdf4',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {teacher.photo
            ? <img src={teacher.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ textAlign:'center', fontSize:9, color:'#94a3b8', padding:4 }}>
                <div style={{ fontSize:22, marginBottom:2 }}>👤</div>Photo
              </div>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:900, fontSize:13, color:'#065f46', marginBottom:6,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{teacher.name}</div>
          {[
            ['Emp ID',  teacher.empId],
            ['Role',    teacher.designation],
            ['Dept',    teacher.department],
            ['Ph',      teacher.phone],
            ['Email',   teacher.email],
            ['Blood',   teacher.bloodGroup || '—'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', gap:4, marginBottom:2 }}>
              <span style={{ fontSize:8, color:'#94a3b8', fontWeight:600, minWidth:30 }}>{k}:</span>
              <span style={{ fontSize:8, fontWeight:700, color:'#0f172a',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#f0fdf4', borderTop:'2px solid #a7f3d0',
        padding:'5px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:8, color:'#64748b' }}>Session: {school.session}</div>
        <div style={{ fontSize:8, color:'#64748b', fontWeight:600 }}>📞 {school.phone}</div>
        <div style={{ background:'#065f46', color:'#fff', fontSize:7,
          fontWeight:700, padding:'2px 6px', borderRadius:4 }}>VALID {school.session}</div>
      </div>
    </div>
  );
}

// ── Print all cards ───────────────────────────────────────
function bulkPrintCards(people, type, school) {
  const cards = people.map((p, i) => {
    const isLast = i === people.length - 1;
    const pb = isLast ? '' : 'page-break-after:always;';
    const isTeacher = type === 'Teacher';
    const headerBg = isTeacher ? 'linear-gradient(135deg,#065f46,#10b981)' : `linear-gradient(135deg,${school.color},#3b82f6)`;
    const headerLabel = isTeacher ? 'STAFF<br/>ID CARD' : 'STUDENT<br/>ID CARD';
    const footerBg = isTeacher ? '#f0fdf4' : `${school.color}12`;
    const footerBorder = isTeacher ? '#a7f3d0' : `${school.color}30`;
    const badgeBg = isTeacher ? '#065f46' : school.color;

    const rows = isTeacher ? [
      ['Emp ID', p.empId], ['Role', p.designation], ['Dept', p.department],
      ['Ph', p.phone], ['Email', p.email], ['Blood', p.bloodGroup||'—'],
    ] : [
      ['Adm No', p.admNo], ['Class', 'Class '+p.class+' – Sec '+p.section],
      ['DOB', p.dob ? new Date(p.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
      ['Blood', p.bloodGroup||'—'], ['Parent', p.parentName||'—'], ['Ph', p.parentPhone||'—'],
    ];

    return `
      <div style="${pb}padding:20px;display:flex;justify-content:center;">
        <div style="width:320px;height:200px;font-family:Arial,sans-serif;border-radius:14px;
          overflow:hidden;border:1px solid #e2e8f0;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.12);">
          <div style="background:${headerBg};padding:10px 14px;display:flex;align-items:center;gap:10px;">
            <div style="font-size:24px;">${school.logo}</div>
            <div style="flex:1;">
              <div style="color:#fff;font-weight:900;font-size:11px;">${school.name}</div>
              <div style="color:rgba(255,255,255,.8);font-size:8px;margin-top:1px;">${school.address}</div>
            </div>
            <div style="background:rgba(255,255,255,.2);border-radius:6px;padding:3px 8px;
              color:#fff;font-size:8px;font-weight:700;text-align:center;line-height:1.4;">
              ${headerLabel}
            </div>
          </div>
          <div style="display:flex;padding:10px 14px;gap:12px;">
            <div style="width:64px;height:80px;border:2px solid ${badgeBg};border-radius:8px;
              overflow:hidden;flex-shrink:0;background:#f8fafc;
              display:flex;align-items:center;justify-content:center;">
              ${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;"/>` :
                '<div style="text-align:center;font-size:9px;color:#94a3b8;padding:4px;"><div style="font-size:22px;margin-bottom:2px;">👤</div>Photo</div>'}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:900;font-size:13px;color:${badgeBg};margin-bottom:6px;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
              ${rows.map(([k,v])=>`
                <div style="display:flex;gap:4px;margin-bottom:2px;">
                  <span style="font-size:8px;color:#94a3b8;font-weight:600;min-width:30px;">${k}:</span>
                  <span style="font-size:8px;font-weight:700;color:#0f172a;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${v||'—'}</span>
                </div>`).join('')}
            </div>
          </div>
          <div style="background:${footerBg};border-top:2px solid ${footerBorder};
            padding:5px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:8px;color:#64748b;">Session: ${school.session}</div>
            <div style="font-size:8px;color:#64748b;font-weight:600;">📞 ${school.phone}</div>
            <div style="background:${badgeBg};color:#fff;font-size:7px;
              font-weight:700;padding:2px 6px;border-radius:4px;">VALID ${school.session}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html><head><title>ID Cards – ${school.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#f8fafc;font-family:Arial,sans-serif;}
  .toolbar{position:sticky;top:0;z-index:99;background:#1e3a8a;color:#fff;
    padding:12px 24px;display:flex;align-items:center;justify-content:space-between;}
  .toolbar button{background:#fff;color:#1e3a8a;border:none;padding:8px 20px;
    border-radius:7px;font-weight:700;cursor:pointer;font-size:13px;}
  @media print{.toolbar{display:none;}body{background:#fff;}
    @page{size:A4;margin:8mm;}}
</style></head>
<body>
  <div class="toolbar">
    <span>🪪 ${people.length} ID Card${people.length>1?'s':''} — ${school.name}</span>
    <button onclick="window.print()">🖨️ Print All ${people.length} Cards</button>
  </div>
  <div style="padding:10px;">${cards}</div>
</body></html>`);
  win.document.close();
  toast.success(people.length + ' ID cards ready to print!');
}

// ── Main ID Cards Page ────────────────────────────────────
export default function IDCards() {
  const [cardType,     setCardType]     = useState('Student');
  const [classFilter,  setClassFilter]  = useState('');
  const [sectionFilter,setSectionFilter]= useState('');
  const [search,       setSearch]       = useState('');
  const [preview,      setPreview]      = useState(null);
  const [selected,     setSelected]     = useState(new Set());
  const [loading,      setLoading]      = useState(false);
  const [students]                      = useState(DEMO_STUDENTS);
  const [teachers]                      = useState(DEMO_TEACHERS);

  const people = cardType === 'Student' ? students : teachers;

  const filtered = people.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q)
      || (p.admNo||p.empId||'').toLowerCase().includes(q);
    const matchClass   = cardType !== 'Student' || !classFilter   || p.class   === classFilter;
    const matchSection = cardType !== 'Student' || !sectionFilter || p.section === sectionFilter;
    return matchSearch && matchClass && matchSection;
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll  = () => setSelected(new Set(filtered.map(p=>p._id)));
  const clearAll   = () => setSelected(new Set());

  const printSelected = () => {
    const toPrint = filtered.filter(p => selected.has(p._id));
    if (!toPrint.length) { toast.error('Select at least one card'); return; }
    bulkPrintCards(toPrint, cardType, SCHOOL);
  };

  const printAll = () => {
    if (!filtered.length) { toast.error('No cards to print'); return; }
    bulkPrintCards(filtered, cardType, SCHOOL);
  };

  const sendWhatsApp = (student) => {
    const raw = (student.parentPhone||'').replace(/\D/g,'');
    if (!raw) { toast.error('No parent phone saved'); return; }
    const ph  = raw.startsWith('91') ? raw : '91'+raw;
    const msg =
`🪪 *ID Card Ready – ${SCHOOL.name}*

Dear Parent,

The ID Card for *${student.name}* (${student.admNo}, Class ${student.class}) is ready for collection.

Please visit the school office to collect the ID card.

📞 ${SCHOOL.phone}
🏫 ${SCHOOL.name}`;
    window.open('https://wa.me/'+ph+'?text='+encodeURIComponent(msg), '_blank');
    toast.success('WhatsApp notification sent!');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🪪 ID Cards</h1>
          <p className="text-gray-500 text-sm">Generate, preview and bulk print ID cards for students and staff</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={printSelected} className="btn-secondary">
            <Printer size={14}/> Print Selected ({selected.size})
          </button>
          <button onClick={printAll} className="btn-primary">
            <Printer size={14}/> 🖨️ Print All ({filtered.length})
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
        {[
          { label:'Total Students', value:students.length, color:'#3b82f6', icon:Users      },
          { label:'Total Teachers', value:teachers.length, color:'#16a34a', icon:Users      },
          { label:'Selected',       value:selected.size,   color:'#8b5cf6', icon:CheckCircle},
          { label:'Filtered',       value:filtered.length, color:'#f59e0b', icon:Filter     },
        ].map(k=>(
          <div key={k.label} className="card"
            style={{ padding:'12px 14px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color }} />
            <div style={{ background:k.color+'18', borderRadius:9, padding:9 }}>
              <k.icon size={16} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        {/* Card type toggle */}
        <div style={{ display:'flex', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0' }}>
          {['Student','Teacher'].map(t=>(
            <button key={t} onClick={()=>{ setCardType(t); setSelected(new Set()); setPreview(null); }}
              style={{ padding:'8px 18px', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                background: cardType===t ? '#1e3a8a' : '#fff',
                color:      cardType===t ? '#fff'    : '#475569' }}>
              {t==='Student'?'👨‍🎓':'👩‍🏫'} {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="input-field" placeholder={`Search ${cardType.toLowerCase()}s...`}
            style={{ paddingLeft:28 }} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {/* Class/Section filters (students only) */}
        {cardType === 'Student' && <>
          <Sel value={classFilter} onChange={e=>setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {CLASSES.map(c=><option key={c} value={c}>{c==='Nursery'||c==='LKG'||c==='UKG'?c:'Class '+c}</option>)}
          </Sel>
          <Sel value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
            {SECTIONS.map(s=><option key={s}>Section {s}</option>)}
          </Sel>
        </>}

        {/* Select all / clear */}
        <button onClick={selectAll}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0',
            background:'#f8fafc', color:'#3b82f6', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          ✓ All
        </button>
        <button onClick={clearAll}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0',
            background:'#f8fafc', color:'#ef4444', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          ✗ Clear
        </button>
      </div>

      {/* Main layout — list + preview */}
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:16, alignItems:'start' }}>

        {/* People list */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', fontWeight:700, fontSize:13, borderBottom:'1px solid #f1f5f9',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            position:'sticky', top:0, background:'#fff', zIndex:2 }}>
            <span>{cardType}s ({filtered.length})</span>
            <span style={{ fontSize:11, color:'#94a3b8' }}>{selected.size} selected</span>
          </div>
          <div style={{ maxHeight:520, overflowY:'auto' }}>
            {filtered.map(p => {
              const isSelected = selected.has(p._id);
              const isPreviewing = preview?._id === p._id;
              return (
                <div key={p._id}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    borderBottom:'1px solid #f8fafc', cursor:'pointer',
                    background: isPreviewing?'#eff6ff': isSelected?'#f0fdf4':'#fff',
                    transition:'background .12s' }}
                  onClick={() => setPreview(p)}>

                  {/* Checkbox */}
                  <input type="checkbox" checked={isSelected}
                    onChange={e=>{ e.stopPropagation(); toggleSelect(p._id); }}
                    style={{ width:15, height:15, cursor:'pointer', accentColor:'#3b82f6' }}
                    onClick={e=>e.stopPropagation()} />

                  {/* Avatar */}
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
                    background: cardType==='Student'?'#dbeafe':'#dcfce7',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:800, fontSize:14,
                    color: cardType==='Student'?'#1d4ed8':'#16a34a' }}>
                    {p.name[0]}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>
                      {cardType==='Student'
                        ? `${p.admNo} · Class ${p.class}-${p.section}`
                        : `${p.empId} · ${p.designation}`}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>setPreview(p)} title="Preview"
                      style={{ padding:5, borderRadius:6, border:'1px solid #bfdbfe',
                        background:'#eff6ff', cursor:'pointer', color:'#3b82f6', display:'flex' }}>
                      <Eye size={12}/>
                    </button>
                    {cardType==='Student' && (
                      <button onClick={()=>sendWhatsApp(p)} title="Notify parent"
                        style={{ padding:5, borderRadius:6, border:'1px solid #25D366',
                          background:'#f0fdf4', cursor:'pointer', color:'#16a34a', display:'flex' }}>
                        <MessageCircle size={12}/>
                      </button>
                    )}
                    <button onClick={()=>bulkPrintCards([p], cardType, SCHOOL)} title="Print this card"
                      style={{ padding:5, borderRadius:6, border:'1px solid #e2e8f0',
                        background:'#f8fafc', cursor:'pointer', color:'#475569', display:'flex' }}>
                      <Printer size={12}/>
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length===0 && (
              <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
                No {cardType.toLowerCase()}s found
              </div>
            )}
          </div>
        </div>

        {/* Preview pane */}
        <div>
          {preview ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>
                  🪪 Preview — {preview.name}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {cardType==='Student' && (
                    <button onClick={()=>sendWhatsApp(preview)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8,
                        border:'1px solid #25D366', background:'#f0fdf4', color:'#16a34a',
                        cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      <MessageCircle size={13}/> Notify Parent
                    </button>
                  )}
                  <button onClick={()=>bulkPrintCards([preview], cardType, SCHOOL)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8,
                      border:'none', background:'#1e3a8a', color:'#fff',
                      cursor:'pointer', fontSize:12, fontWeight:700 }}>
                    <Printer size={13}/> Print This Card
                  </button>
                </div>
              </div>

              {/* Card preview — front */}
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                    marginBottom:8 }}>Front Side</div>
                  {cardType==='Student'
                    ? <StudentIDCard student={preview} school={SCHOOL} />
                    : <TeacherIDCard teacher={preview} school={SCHOOL} />
                  }
                </div>

                {/* Back side */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                    marginBottom:8 }}>Back Side</div>
                  <div style={{ width:320, height:200, borderRadius:14, overflow:'hidden',
                    border:'1px solid #e2e8f0', background:'#fff',
                    boxShadow:'0 4px 20px rgba(0,0,0,.1)' }}>
                    <div style={{ background:`linear-gradient(135deg,${SCHOOL.color},#3b82f6)`,
                      padding:'10px 14px', textAlign:'center' }}>
                      <div style={{ color:'#fff', fontWeight:900, fontSize:12 }}>{SCHOOL.name}</div>
                      <div style={{ color:'rgba(255,255,255,.8)', fontSize:9 }}>{SCHOOL.address}</div>
                    </div>
                    <div style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:9, color:'#0f172a', lineHeight:1.8 }}>
                        <div style={{ fontWeight:700, fontSize:10, color:SCHOOL.color, marginBottom:6 }}>📋 RULES & REGULATIONS</div>
                        <div>1. This card must be carried at all times in school</div>
                        <div>2. Lost card must be reported immediately to office</div>
                        <div>3. Card is not transferable</div>
                        <div>4. Replacement card fee: ₹50</div>
                      </div>
                      <div style={{ marginTop:10, paddingTop:8, borderTop:'1px dashed #e2e8f0',
                        display:'flex', justifyContent:'space-between', fontSize:8, color:'#64748b' }}>
                        <div>📞 {SCHOOL.phone}</div>
                        <div>✉️ {SCHOOL.email}</div>
                        <div>🌐 {SCHOOL.website}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details below preview */}
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Card Details</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {(cardType==='Student' ? [
                    ['Name',          preview.name],
                    ['Admission No',  preview.admNo],
                    ['Class',         'Class '+preview.class+' – Section '+preview.section],
                    ['Date of Birth', preview.dob ? new Date(preview.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—'],
                    ['Blood Group',   preview.bloodGroup||'—'],
                    ['Parent Name',   preview.parentName||'—'],
                    ['Parent Phone',  preview.parentPhone||'—'],
                    ['Address',       preview.address||'—'],
                  ] : [
                    ['Name',          preview.name],
                    ['Employee ID',   preview.empId],
                    ['Designation',   preview.designation],
                    ['Department',    preview.department],
                    ['Phone',         preview.phone],
                    ['Email',         preview.email],
                    ['Blood Group',   preview.bloodGroup||'—'],
                  ]).map(([k,v])=>(
                    <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>{k}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              height:400, color:'#94a3b8', gap:12 }}>
              <div style={{ fontSize:48 }}>🪪</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Click a student to preview their ID card</div>
              <div style={{ fontSize:12 }}>or click Print All to print all cards at once</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}