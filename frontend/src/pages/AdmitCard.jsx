import { useState, useEffect, useRef } from 'react';
import { Printer, Search, ChevronDown, Eye, Loader, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import api from '../services/api';

const DEMO_GROUPS = [
  {
    _id:'1', name:'Mid Term 2025', examType:'Mid Term', class:'10', section:'A',
    startDate:'2025-10-01', endDate:'2025-10-10', totalMarks:100, passingMarks:35,
    academicYear:'2025-26',
    schedule:[
      { subject:'Mathematics', date:'2025-10-01', day:'Wednesday', time:'9:00 AM – 12:00 PM', room:'101' },
      { subject:'Science',     date:'2025-10-03', day:'Friday',    time:'9:00 AM – 12:00 PM', room:'102' },
      { subject:'English',     date:'2025-10-06', day:'Monday',    time:'9:00 AM – 12:00 PM', room:'103' },
      { subject:'Hindi',       date:'2025-10-08', day:'Wednesday', time:'9:00 AM – 12:00 PM', room:'104' },
    ]
  },
];

const SCHOOL = { name:'Greenfield Public School', address:'123 School Road, Bengaluru, Karnataka – 560001', phone:'080-12345678', email:'info@greenfieldschool.edu', logo:'🏫' };

// ── Admit card component (rendered & printed) ─────────────────────────────────
function AdmitCardPreview({ student, group, school, showBorder }) {
  return (
    <div id={`admit-${student._id}`} style={{
      width: 740, minHeight: 520, fontFamily:"'Times New Roman',serif",
      border: showBorder ? '2px solid #0f172a' : '1px solid #e2e8f0',
      borderRadius: 4, background:'#fff', overflow:'hidden',
      pageBreakAfter:'always',
    }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)', padding:'18px 24px', color:'#fff', display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ fontSize:40 }}>{school.logo}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:.5 }}>{school.name}</div>
          <div style={{ fontSize:11, opacity:.85, marginTop:2 }}>{school.address}</div>
          <div style={{ fontSize:11, opacity:.85 }}>Ph: {school.phone} | {school.email}</div>
        </div>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,.15)', borderRadius:8, padding:'10px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.8, opacity:.8 }}>Hall Ticket</div>
          <div style={{ fontSize:16, fontWeight:800, marginTop:2 }}>{group.academicYear}</div>
        </div>
      </div>

      {/* Exam title bar */}
      <div style={{ background:'#f0f4ff', borderBottom:'2px solid #c7d7ff', padding:'10px 24px', textAlign:'center' }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#1e3a8a', letterSpacing:.4 }}>
          {group.name.toUpperCase()} — {group.examType.toUpperCase()} EXAMINATION
        </span>
      </div>

      {/* Body */}
      <div style={{ padding:'16px 24px', display:'flex', gap:20 }}>

        {/* Student info */}
        <div style={{ flex:1 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <tbody>
              {[
                ['Student Name', student.name],
                ['Admission No.', student.admNo],
                ['Roll Number',  student.rollNo],
                ['Class & Section', `Class ${group.class}${group.section ? ' – Section '+group.section : ''}`],
                ['Date of Birth', new Date(student.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})],
                ['Exam Period', `${new Date(group.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} – ${new Date(group.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`],
              ].map(([k,v]) => (
                <tr key={k} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'6px 10px 6px 0', color:'#475569', fontWeight:600, whiteSpace:'nowrap', width:140 }}>{k}</td>
                  <td style={{ padding:'6px 0', color:'#0f172a', fontWeight:700 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Photo box */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ width:90, height:110, border:'2px solid #1d4ed8', borderRadius:6,
            background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, color:'#94a3b8', textAlign:'center', lineHeight:1.4 }}>
            {student.photo
              ? <img src={student.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }} />
              : 'Student\nPhoto'
            }
          </div>
          <div style={{ fontSize:9, color:'#64748b', textAlign:'center' }}>Affix passport<br/>size photo</div>
        </div>
      </div>

      {/* Exam schedule table */}
      <div style={{ padding:'0 24px 16px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#1e3a8a', marginBottom:8, borderBottom:'1px solid #c7d7ff', paddingBottom:4 }}>
          EXAMINATION SCHEDULE
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:'#1e3a8a', color:'#fff' }}>
              {['Subject','Date','Day','Time','Room'].map(h => (
                <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:700, letterSpacing:.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.schedule.map((r, i) => (
              <tr key={i} style={{ background: i%2===0 ? '#f8fafc' : '#fff', borderBottom:'1px solid #e8edf5' }}>
                <td style={{ padding:'6px 10px', fontWeight:600, color:'#0f172a' }}>{r.subject}</td>
                <td style={{ padding:'6px 10px', color:'#475569' }}>{new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                <td style={{ padding:'6px 10px', color:'#475569' }}>{r.day}</td>
                <td style={{ padding:'6px 10px', color:'#475569' }}>{r.time}</td>
                <td style={{ padding:'6px 10px', color:'#475569' }}>{r.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div style={{ padding:'8px 24px 12px', background:'#fefce8', borderTop:'1px solid #fef08a' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#854d0e', marginBottom:4 }}>IMPORTANT INSTRUCTIONS:</div>
        <div style={{ fontSize:10, color:'#713f12', lineHeight:1.6 }}>
          1. Candidates must carry this admit card to every examination. &nbsp;
          2. Report 15 minutes before the exam. &nbsp;
          3. Mobile phones are strictly prohibited. &nbsp;
          4. No student will be allowed without this card.
        </div>
      </div>

      {/* Signature row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'12px 24px', borderTop:'1px solid #e2e8f0' }}>
        {['Student Signature','Class Teacher Signature','Principal Signature'].map(s => (
          <div key={s} style={{ textAlign:'center' }}>
            <div style={{ borderTop:'1px solid #0f172a', width:120, margin:'0 auto 4px' }} />
            <div style={{ fontSize:10, color:'#475569' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main AdmitCard page ───────────────────────────────────────────────────────
export default function AdmitCard() {
  const [selectedGroup, setSelectedGroup]   = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [search, setSearch]     = useState('');
  const [preview, setPreview]   = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const printRef = useRef();

  // Load ALL real students from the database
  useEffect(() => {
    setLoadingStudents(true);
    api.get('/students', { params: { limit: 500 } })
      .then(res => {
        const raw = res.data.data || [];
        // Normalise to the shape AdmitCardPreview needs
        setStudents(raw.map((s, i) => ({
          _id:         s._id,
          name:        `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          rollNo:      s.rollNumber || String(i + 1).padStart(2, '0'),
          admNo:       s.admissionNumber || '—',
          dob:         s.dateOfBirth || '',
          photo:       s.photo || null,
          parentPhone: s.parentPhone || s.phone || '',
          fatherName:  s.fatherName  || '',
          motherName:  s.motherName  || '',
        })));
      })
      .catch(() => {
        // Fallback to demo if API is down
        setStudents([
          { _id:'s1', name:'Arjun Sharma',    rollNo:'01', admNo:'ADM001', dob:'2009-05-12', photo:null, parentPhone:'9876543210', fatherName:'Rajesh Sharma',   motherName:'Priya Sharma'   },
          { _id:'s2', name:'Priya Patel',     rollNo:'02', admNo:'ADM002', dob:'2009-08-22', photo:null, parentPhone:'9876543211', fatherName:'Suresh Patel',    motherName:'Meena Patel'    },
          { _id:'s3', name:'Rahul Kumar',     rollNo:'03', admNo:'ADM003', dob:'2010-01-09', photo:null, parentPhone:'9876543212', fatherName:'Anil Kumar',      motherName:'Sunita Kumar'   },
          { _id:'s4', name:'Sneha Reddy',     rollNo:'04', admNo:'ADM004', dob:'2009-11-30', photo:null, parentPhone:'9876543213', fatherName:'Venkat Reddy',    motherName:'Laxmi Reddy'    },
          { _id:'s5', name:'Sidda Madabhavi', rollNo:'05', admNo:'123',    dob:'2010-03-17', photo:null, parentPhone:'9008303681', fatherName:'Madabhavi Senior', motherName:'Siddamma'       },
        ]);
      })
      .finally(() => setLoadingStudents(false));
  }, []);

  const group = DEMO_GROUPS.find(g => g._id === selectedGroup);
  const filteredStudents = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Capture card as image then open WhatsApp ─────────────────────────────
  const [capturing, setCapturing] = useState(false);

  // ── Direct WhatsApp send — no modal, uses saved parent phone ───────────────
  const sendWhatsApp = async (student) => {
    const rawPhone = (student.parentPhone || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      toast.error(`No parent phone saved for ${student.name}. Update the student record first.`);
      return;
    }

    setCapturing(true);
    toast.loading('Preparing admit card...', { id: 'wa-capture' });

    // Auto-set preview so the card renders on screen
    setPreview(student);

    // Wait for React to render the card element in the DOM
    await new Promise(resolve => setTimeout(resolve, 600));

    const cardEl = document.getElementById(`admit-${student._id}`);
    if (!cardEl) {
      toast.dismiss('wa-capture');
      toast.error('Could not render card. Try clicking the student name first.');
      setCapturing(false);
      return;
    }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardEl, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });

      canvas.toBlob(async (blob) => {
        toast.dismiss('wa-capture');
        const fileName = `AdmitCard_${student.name.replace(/\s+/g,'_')}_${student.admNo}.png`;
        const file     = new File([blob], fileName, { type: 'image/png' });
        const fullPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

        // ── Method 1: Web Share API (mobile — shares image directly) ──────
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            toast.success('Admit card shared!');
            setCapturing(false);
            return;
          } catch (e) {
            if (e.name === 'AbortError') { setCapturing(false); return; }
          }
        }

        // ── Method 2: Copy to clipboard + download + open parent chat ─────
        let copied = false;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copied = true;
        } catch (_) {}

        // Download image
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Open WhatsApp directly to parent's number
        setTimeout(() => {
          window.open(`https://wa.me/${fullPhone}`, '_blank');
          toast.success(
            copied
              ? `✅ Image copied! WhatsApp opened with ${student.parentPhone} — paste (Ctrl+V) and Send.`
              : `✅ Image downloaded! WhatsApp opened with ${student.parentPhone} — tap 📎 attach → Send.`,
            { duration: 8000 }
          );
        }, 400);

        setCapturing(false);
      }, 'image/png', 1.0);

    } catch (err) {
      toast.dismiss('wa-capture');
      toast.error('Failed to generate image.');
      console.error(err);
      setCapturing(false);
    }
  };

  // ── Single / Bulk Print ───────────────────────────────────────────────────
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current:0, total:0 });

  const handlePrint = () => {
    // Single student print
    const win = window.open('', '_blank');
    const cards = (selectedStudent === 'all' ? filteredStudents : filteredStudents.filter(s => s._id === selectedStudent))
      .map(s => document.getElementById(`admit-${s._id}`)?.outerHTML || '')
      .filter(Boolean)
      .join('<div style="page-break-after:always"></div>');
    win.document.write(`
      <html><head><title>Admit Cards</title>
      <style>
        body { font-family:'Times New Roman',serif; margin:0; padding:20px; background:#fff; }
        @media print { @page { margin:10mm; } }
        * { box-sizing:border-box; }
      </style>
      </head><body>${cards}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
    toast.success('Print dialog opened');
  };

  // ── Bulk Print ALL students ───────────────────────────────────────────────
  const handleBulkPrint = async () => {
    if (!filteredStudents.length) { toast.error('No students to print'); return; }

    toast.loading(`Preparing ${filteredStudents.length} admit cards...`, { id:'bulk-print' });

    // First set all students as preview so cards render in DOM
    // We render all cards in the hidden ref container
    const html2canvasLib = (await import('html2canvas')).default;
    const win = window.open('', '_blank');

    win.document.write(`
      <html><head><title>Bulk Admit Cards – ${group?.name}</title>
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Times New Roman',serif; background:#fff; }
        .card-wrapper { page-break-after: always; padding:20px; }
        .card-wrapper:last-child { page-break-after: auto; }
        @media print {
          @page { size: A4; margin: 8mm; }
          .card-wrapper { page-break-after: always; padding:10px; }
        }
        /* Copy all card styles inline */
        table { width:100%; border-collapse:collapse; }
        td,th { padding:6px 10px; font-size:12px; }
        .admit-card { border:2px solid #1e3a8a; border-radius:10px; overflow:hidden; max-width:750px; margin:0 auto; }
      </style></head>
      <body>`);

    // Generate each student's card HTML
    filteredStudents.forEach((s, i) => {
      const cardEl = document.getElementById(`admit-${s._id}`);
      if (cardEl) {
        win.document.write(`<div class="card-wrapper">${cardEl.outerHTML}</div>`);
      } else {
        // Build card HTML if element not in DOM
        const schedule = (group?.schedule || []);
        win.document.write(`
          <div class="card-wrapper">
            <div class="admit-card">
              <div style="background:#1e3a8a;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:18px;font-weight:700">🏫 ${SCHOOL.name}</div>
                  <div style="font-size:11px;opacity:.85;margin-top:2px">${SCHOOL.address}</div>
                  <div style="font-size:11px;opacity:.85">Ph: ${SCHOOL.phone} | ${SCHOOL.email}</div>
                </div>
                <div style="background:rgba(255,255,255,.15);border-radius:8px;padding:8px 14px;text-align:center">
                  <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase">Hall Ticket</div>
                  <div style="font-size:16px;font-weight:800">${group?.academicYear || '2025-26'}</div>
                </div>
              </div>
              <div style="background:#e8f0fe;padding:8px;text-align:center;font-size:14px;font-weight:700;color:#1e3a8a;letter-spacing:.5px">
                ${group?.name?.toUpperCase()} — ${group?.examType?.toUpperCase() || 'EXAMINATION'}
              </div>
              <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:flex-start">
                <table style="width:auto">
                  <tr><td style="color:#475569;font-weight:600;width:130px">Student Name</td><td style="font-weight:700">${s.name}</td></tr>
                  <tr><td style="color:#475569;font-weight:600">Admission No.</td><td style="font-weight:700">${s.admNo}</td></tr>
                  <tr><td style="color:#475569;font-weight:600">Roll Number</td><td style="font-weight:700">${s.rollNo}</td></tr>
                  <tr><td style="color:#475569;font-weight:600">Class &amp; Section</td><td style="font-weight:700">Class ${group?.class} – Section ${group?.section}</td></tr>
                  <tr><td style="color:#475569;font-weight:600">Date of Birth</td><td style="font-weight:700">${s.dob ? new Date(s.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—'}</td></tr>
                  <tr><td style="color:#475569;font-weight:600">Exam Period</td><td style="font-weight:700">${group?.startDate ? new Date(group.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''} – ${group?.endDate ? new Date(group.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''}</td></tr>
                </table>
                <div style="width:90px;height:110px;border:1px solid #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#f8fafc;flex-shrink:0">
                  ${s.photo ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:6px"/>` : '<div style="font-size:9px;text-align:center;color:#94a3b8;padding:8px">Affix passport size photo</div>'}
                </div>
              </div>
              <div style="padding:0 20px 16px">
                <div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #1e3a8a;padding-bottom:5px;margin-bottom:10px">Examination Schedule</div>
                <table style="width:100%;border-collapse:collapse">
                  <thead><tr style="background:#1e3a8a;color:#fff">
                    <th style="padding:7px 12px;text-align:left;font-size:11px">Subject</th>
                    <th style="padding:7px 12px;text-align:left;font-size:11px">Date</th>
                    <th style="padding:7px 12px;text-align:left;font-size:11px">Day</th>
                    <th style="padding:7px 12px;text-align:left;font-size:11px">Time</th>
                    <th style="padding:7px 12px;text-align:left;font-size:11px">Room</th>
                  </thead></tr>
                  <tbody>${schedule.map((r,ri) => `
                    <tr style="background:${ri%2===0?'#fff':'#f8fafc'}">
                      <td style="padding:7px 12px;font-weight:600;font-size:12px">${r.subject}</td>
                      <td style="padding:7px 12px;font-size:12px">${new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                      <td style="padding:7px 12px;font-size:12px">${r.day}</td>
                      <td style="padding:7px 12px;font-size:12px">${r.time}</td>
                      <td style="padding:7px 12px;font-size:12px">${r.room}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <div style="padding:10px 20px;border-top:1px solid #e2e8f0;font-size:10px;color:#dc2626">
                <strong>Important Instructions:</strong> 1. Candidates must carry this admit card to every examination. &nbsp;
                2. Report 15 minutes before the exam. &nbsp;3. Mobile phones are strictly prohibited. &nbsp;4. No student will be allowed without this card.
              </div>
              <div style="padding:16px 20px;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0">
                <div style="text-align:center"><div style="border-top:1px solid #000;width:130px;padding-top:4px;font-size:10px;color:#475569">Student Signature</div></div>
                <div style="text-align:center"><div style="border-top:1px solid #000;width:130px;padding-top:4px;font-size:10px;color:#475569">Class Teacher Signature</div></div>
                <div style="text-align:center"><div style="border-top:1px solid #000;width:130px;padding-top:4px;font-size:10px;color:#475569">Principal Signature</div></div>
              </div>
            </div>
          </div>`);
      }
    });

    win.document.write('</body></html>');
    win.document.close();
    toast.dismiss('bulk-print');
    setTimeout(() => { win.print(); }, 800);
    toast.success(`${filteredStudents.length} admit cards ready to print!`);
  };

  // ── Bulk WhatsApp — send to all parents one by one ────────────────────────
  const handleBulkWhatsApp = async () => {
    const withPhone = filteredStudents.filter(s => s.parentPhone);
    const noPhone   = filteredStudents.filter(s => !s.parentPhone);

    if (!withPhone.length) {
      toast.error('No students have parent phone numbers saved');
      return;
    }
    if (!window.confirm(
      `Send admit cards to ${withPhone.length} parent(s) via WhatsApp?\n` +
      (noPhone.length ? `⚠️ ${noPhone.length} student(s) have no phone number and will be skipped.\n` : '') +
      `\nWhatsApp will open ${withPhone.length} time(s) with each parent's number.`
    )) return;

    setBulkSending(true);
    setBulkProgress({ current:0, total:withPhone.length });

    for (let i = 0; i < withPhone.length; i++) {
      const s = withPhone[i];
      setBulkProgress({ current: i + 1, total: withPhone.length });

      // Auto-preview the student so the card renders
      setPreview(s);
      await new Promise(res => setTimeout(res, 700));

      const raw   = s.parentPhone.replace(/\D/g, '');
      const phone = raw.startsWith('91') ? raw : `91${raw}`;

      const msg =
`🎓 *Admit Card / Hall Ticket*
${SCHOOL.name}

👤 *Student:* ${s.name}
🪪 *Adm No:* ${s.admNo} | *Roll:* ${s.rollNo}
📚 *Exam:* ${group?.name}
📅 ${group?.startDate ? new Date(group.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''} – ${group?.endDate ? new Date(group.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''}

📎 Please find the admit card attached.
⚠️ Carry this card to every examination.
📞 ${SCHOOL.phone}`;

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

      // Wait between each to avoid popup blocker
      if (i < withPhone.length - 1) {
        await new Promise(res => setTimeout(res, 1200));
      }
    }

    setBulkSending(false);
    setBulkProgress({ current:0, total:0 });
    toast.success(
      `✅ WhatsApp opened for ${withPhone.length} parent(s)!` +
      (noPhone.length ? ` (${noPhone.length} skipped — no phone)` : ''),
      { duration: 6000 }
    );
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="card p-4" style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label className="label">Exam Group</label>
          <div style={{ position:'relative' }}>
            <select className="input-field" style={{ appearance:'none', paddingRight:28 }}
              value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setPreview(null); }}>
              <option value="">Select exam group</option>
              {DEMO_GROUPS.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
          </div>
        </div>
        {group && (
          <>
            <div style={{ flex:1, minWidth:180 }}>
              <label className="label">Student</label>
              <div style={{ position:'relative' }}>
                <select className="input-field" style={{ appearance:'none', paddingRight:28 }}
                  value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                  <option value="all">All Students</option>
                  {filteredStudents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
              </div>
            </div>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
              <input className="input-field" placeholder="Search student..."
                style={{ paddingLeft:28, width:180, fontSize:12 }}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {/* Single / Bulk Print */}
              <button onClick={handlePrint} className="btn-secondary" style={{ fontSize:12 }}>
                <Printer size={14} /> Print {preview ? 'This Card' : 'Selected'}
              </button>
              <button onClick={handleBulkPrint}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                  borderRadius:8, border:'none', background:'#1e40af', color:'#fff',
                  cursor:'pointer', fontSize:13, fontWeight:700 }}>
                <Printer size={14} /> 🖨️ Bulk Print All ({filteredStudents.length})
              </button>
              {/* Bulk WhatsApp */}
              <button onClick={handleBulkWhatsApp} disabled={bulkSending}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                  borderRadius:8, border:'1px solid #25D366',
                  background: bulkSending ? '#dcfce7' : '#f0fdf4',
                  color:'#16a34a', cursor: bulkSending ? 'not-allowed' : 'pointer',
                  fontSize:13, fontWeight:700 }}>
                {bulkSending
                  ? <><Loader size={13} className="animate-spin"/> Sending {bulkProgress.current}/{bulkProgress.total}...</>
                  : <><MessageCircle size={14}/> 💬 Send All to WhatsApp ({filteredStudents.filter(s=>s.parentPhone).length})</>
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bulk send progress banner */}
      {bulkSending && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10,
          padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <Loader size={16} className="animate-spin" color="#3b82f6" />
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
              Sending admit cards via WhatsApp... {bulkProgress.current}/{bulkProgress.total}
            </div>
            <div style={{ fontSize:11, color:'#3b82f6', marginTop:2 }}>
              WhatsApp is opening for each parent. Please allow popups if blocked.
            </div>
          </div>
          <div style={{ marginLeft:'auto', background:'#3b82f6', color:'#fff',
            borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
            {Math.round((bulkProgress.current/bulkProgress.total)*100)}%
          </div>
        </div>
      )}

      {/* Student list with individual preview/print */}
      {group && (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
          {/* List */}
          <div className="card" style={{ padding:0, overflow:'hidden', maxHeight:600, overflowY:'auto' }}>
            <div style={{ padding:'12px 14px', fontWeight:700, fontSize:13, color:'#0f172a', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff' }}>
              Students ({filteredStudents.length})
            </div>
            {loadingStudents && (
              <div style={{ padding:24, textAlign:'center', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Loader size={14} className="animate-spin" /> Loading...
              </div>
            )}
            {!loadingStudents && filteredStudents.map(s => (
              <div key={s._id}
                onClick={() => setPreview(preview?._id === s._id ? null : s)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                  cursor:'pointer', borderBottom:'1px solid #f8fafc',
                  background: preview?._id === s._id ? '#eff6ff' : 'transparent',
                  transition:'background .15s',
                }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#dbeafe',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:13, color:'#1d4ed8', flexShrink:0 }}>
                  {s.name[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>Roll: {s.rollNo} · {s.admNo}</div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); sendWhatsApp(s); }}
                    disabled={capturing}
                    title={s.parentPhone ? `Send to ${s.parentPhone}` : 'No parent phone saved'}
                    style={{ background:'none', border:'none', cursor: s.parentPhone ? 'pointer' : 'not-allowed',
                      padding:3, borderRadius:5,
                      color: s.parentPhone ? '#25D366' : '#cbd5e1',
                      display:'flex', alignItems:'center' }}>
                    <MessageCircle size={14} />
                  </button>
                  <Eye size={13} color={preview?._id === s._id ? '#3b82f6' : '#cbd5e1'} />
                </div>
              </div>
            ))}
          </div>

          {/* Preview pane */}
          <div>
            {preview ? (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
                    Admit Card Preview — {preview.name}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => sendWhatsApp(preview)} disabled={capturing}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                        borderRadius:7, border:'1px solid #25D366',
                        background: capturing ? '#dcfce7' : '#f0fdf4',
                        color:'#16a34a', cursor: capturing ? 'not-allowed' : 'pointer',
                        fontSize:12, fontWeight:600 }}>
                      {capturing ? <><Loader size={12} className="animate-spin" /> Capturing...</> : <><MessageCircle size={13} /> Send to WhatsApp</>}
                    </button>
                    <button onClick={handlePrint} className="btn-secondary" style={{ fontSize:12 }}>
                      <Printer size={13} /> Print this card
                    </button>
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <div ref={printRef}>
                    <AdmitCardPreview student={preview} group={group} school={SCHOOL} showBorder={true} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                height:400, color:'#94a3b8', gap:10 }}>
                <Eye size={36} style={{ opacity:.3 }} />
                <div style={{ fontSize:14, fontWeight:600 }}>Click a student to preview their admit card</div>
                <div style={{ fontSize:12 }}>or click Print to print all at once</div>
              </div>
            )}

            {/* Hidden print-all container */}
            {!preview && (
              <div ref={printRef} style={{ display:'none' }}>
                {filteredStudents.map(s => (
                  <AdmitCardPreview key={s._id} student={s} group={group} school={SCHOOL} showBorder={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!group && (
        <div className="card" style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>
          <Printer size={40} style={{ margin:'0 auto 12px', opacity:.3 }} />
          <div style={{ fontSize:15, fontWeight:600 }}>Select an exam group to design and print admit cards</div>
        </div>
      )}

    </div>
  );
}