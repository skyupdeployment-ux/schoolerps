// @ts-nocheck
// FEES — every action here goes to the real API (backend/src/routes/feesManage.js).
// Nothing is faked: if the server says no, the admin sees why and nothing is shown as "paid".
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, X, Loader, ChevronDown, CreditCard, FileText, Download,
  CheckCircle, AlertCircle, Printer, Trash2, Edit, MessageCircle, FileDown,
  Ban, ChevronLeft, ChevronRight, Info, Wallet, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Must match the backend (models/Fee.js) ────────────────────────────────────
const FEE_TYPES   = ['Tuition','Admission','Exam','Transport','Library','Lab','Other'];
const METHODS     = ['Cash','UPI','Card','Bank Transfer','Online'];
const ADMIN_ROLES = ['super_admin','school_admin'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad  = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayYMD = () => toYMD(new Date()); // local date (toISOString() gives yesterday before 5:30 AM IST)
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

const currentAcademicYear = () => {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; // year starts in April
  return `${y}-${pad((y + 1) % 100)}`;
};
const yearOptions = () => {
  const y = parseInt(currentAcademicYear(), 10);
  return [y - 2, y - 1, y, y + 1].map(v => `${v}-${pad((v + 1) % 100)}`);
};

const errMsg = (err, fallback = 'Something went wrong') => {
  const r = err?.response;
  if (!r) return 'Cannot reach the server — is the backend running?';
  if (r.status === 429) return 'Too many requests — wait a minute and try again';
  if (r.data?.message) return r.data.message;
  if (typeof r.data === 'string' && r.data && r.data.length < 200) return r.data;
  return fallback;
};
// For file downloads the error body arrives as a Blob
const blobErrMsg = async (err, fallback) => {
  const d = err?.response?.data;
  if (d instanceof Blob) { try { const j = JSON.parse(await d.text()); if (j.message) return j.message; } catch { /* not JSON */ } }
  return errMsg(err, fallback);
};
const downloadFile = async (url, filename, params) => {
  const res = await api.get(url, { params, responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

// ── Receipt actions (work on the receipt object the API returns) ─────────────
const downloadReceiptPDF = async (r) => {
  const id = toast.loading('Preparing PDF...');
  try {
    await downloadFile(`/fees/payments/${r._id}/pdf`, `${r.receiptNumber}.pdf`);
    toast.success('Receipt PDF downloaded', { id });
  } catch (err) {
    toast.error(await blobErrMsg(err, 'Could not download the PDF'), { id });
  }
};

const receiptCard = (r, isLast) => {
  const s = r.school || {};
  const st = r.student || {};
  const rows = [
    ['Student Name', st.name], ['Admission No.', st.admissionNumber],
    st.className ? ['Class', st.className] : null,
    st.parentName ? ['Parent / Guardian', st.parentName] : null,
    ['Fee Type', `${r.feeType}${r.academicYear ? ` (${r.academicYear})` : ''}`],
    ['Amount', inr(r.amount)],
    r.discount > 0 ? ['Discount', `− ${inr(r.discount)}`] : null,
    r.fine > 0 ? ['Fine', `+ ${inr(r.fine)}`] : null,
    ['Payment Mode', `${r.paymentMethod}${r.transactionId ? ` · ${r.transactionId}` : ''}`],
    ['Payment Date', fmtDate(r.paymentDate)],
    r.collectedBy ? ['Collected By', r.collectedBy] : null,
    r.remarks ? ['Remarks', r.remarks] : null,
  ].filter(Boolean);

  return `
  <div style="${isLast ? '' : 'page-break-after:always;'}padding:16px 20px;position:relative">
    ${r.isCancelled ? '<div style="position:absolute;top:40%;left:18%;font-size:64px;font-weight:900;color:rgba(220,38,38,.18);transform:rotate(-25deg)">CANCELLED</div>' : ''}
    <div style="font-family:'Times New Roman',serif;max-width:700px;margin:0 auto;border:2px solid #1e3a8a;border-radius:10px;overflow:hidden">
      <div style="background:#1e3a8a;color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:18px;font-weight:700">${esc(s.name || 'School')}</div>
          ${s.address ? `<div style="font-size:11px;opacity:.85;margin-top:2px">${esc(s.address)}</div>` : ''}
          ${s.phone || s.email ? `<div style="font-size:11px;opacity:.85">${esc([s.phone && `Ph: ${s.phone}`, s.email].filter(Boolean).join(' | '))}</div>` : ''}
        </div>
        <div style="background:rgba(255,255,255,.15);border-radius:8px;padding:10px 16px;text-align:center">
          <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;opacity:.85">Fee Receipt</div>
          <div style="font-size:15px;font-weight:800;margin-top:3px">${esc(r.receiptNumber)}</div>
        </div>
      </div>
      <div style="padding:16px 22px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          ${rows.map(([k, v], i) => `<tr style="border-bottom:${i < rows.length - 1 ? '1px solid #f1f5f9' : 'none'}">
            <td style="padding:7px 0;color:#64748b;font-weight:600;width:170px">${esc(k)}</td>
            <td style="font-weight:700;color:#0f172a">${esc(v)}</td></tr>`).join('')}
        </table>
      </div>
      <div style="background:${r.isCancelled ? '#fef2f2' : '#f0fdf4'};border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:14px;text-align:center">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Total Paid</div>
        <div style="font-size:30px;font-weight:900;color:${r.isCancelled ? '#dc2626' : '#16a34a'};margin:4px 0">${esc(inr(r.totalAmount))}</div>
        <div style="font-size:11px;font-weight:700;color:${r.isCancelled ? '#dc2626' : '#16a34a'}">${r.isCancelled ? 'CANCELLED' : '✓ PAID'}</div>
      </div>
      <div style="padding:30px 22px 14px;display:flex;justify-content:space-between">
        <div style="border-top:1px solid #000;width:150px;padding-top:5px;font-size:10px;color:#475569;text-align:center">Parent / Student Signature</div>
        <div style="border-top:1px solid #000;width:150px;padding-top:5px;font-size:10px;color:#475569;text-align:center">Cashier Signature</div>
      </div>
      <div style="text-align:center;font-size:10px;color:#94a3b8;padding:6px 0 10px;border-top:1px solid #f1f5f9">
        Computer-generated receipt · ${esc(s.name || '')}
      </div>
    </div>
  </div>`;
};

const printReceipts = (list, autoPrint = false) => {
  if (!list.length) { toast.error('No receipts to print'); return; }
  const w = window.open('', '_blank');
  if (!w) { toast.error('Popup blocked — allow popups for this site and try again'); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>Fee Receipt${list.length > 1 ? 's' : ''}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f8fafc}
      .bar{position:sticky;top:0;z-index:9;background:#1e3a8a;color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-family:sans-serif}
      .bar button{background:#fff;color:#1e3a8a;border:none;padding:8px 22px;border-radius:7px;font-weight:700;cursor:pointer}
      @media print{.bar{display:none}body{background:#fff}@page{size:A4;margin:8mm}}</style></head>
    <body><div class="bar"><span>${list.length} receipt${list.length > 1 ? 's' : ''}</span><button onclick="window.print()">Print</button></div>
    ${list.map((r, i) => receiptCard(r, i === list.length - 1)).join('')}</body></html>`);
  w.document.close();
  if (autoPrint) setTimeout(() => w.print(), 400);
};

const waLink = (phone, text) => {
  const raw = String(phone || '').replace(/\D/g, '');
  if (raw.length < 10) return null;
  const ph = raw.length === 10 ? `91${raw}` : raw;
  return `https://wa.me/${ph}?text=${encodeURIComponent(text)}`;
};
const receiptText = (r) =>
  `Fee receipt ${r.receiptNumber}\n` +
  `Student: ${r.student?.name || ''} (${r.student?.admissionNumber || ''})\n` +
  `${r.feeType} fee${r.academicYear ? ` (${r.academicYear})` : ''}: ${inr(r.totalAmount)}\n` +
  `Paid by ${r.paymentMethod} on ${fmtDate(r.paymentDate)}\n\n` +
  `Thank you.\n${r.school?.name || ''}`;

const sendReceiptWA = async (r, waConfigured) => {
  if (r.isCancelled) { toast.error('This receipt is cancelled'); return; }
  if (waConfigured) {
    const id = toast.loading('Sending on WhatsApp...');
    try {
      const res = await api.post(`/fees/payments/${r._id}/whatsapp`, {});
      toast.success(res.data.message || 'Sent on WhatsApp', { id });
      return;
    } catch (err) {
      toast.dismiss(id);
      if (!confirm(`Automatic sending failed:\n${errMsg(err, 'WhatsApp error')}\n\nOpen the parent's WhatsApp chat instead?`)) return;
    }
  }
  const link = waLink(r.student?.parentPhone, receiptText(r));
  if (!link) { toast.error(`No parent phone saved for ${r.student?.name || 'this student'} — update the student record`); return; }
  window.open(link, '_blank');
};

// ── Small UI pieces ───────────────────────────────────────────────────────────
const Sel = ({ label, required, children, ...p }) => (
  <div>
    {label && <label className="label">{label}{required && ' *'}</label>}
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

const Sec = ({ title, right }) => (
  <div style={{ fontSize:11, fontWeight:700, color:'#3b82f6', textTransform:'uppercase',
    letterSpacing:.8, borderBottom:'2px solid #eff6ff', paddingBottom:7,
    marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
    <div style={{ width:3, height:14, background:'#3b82f6', borderRadius:2 }} />{title}
    {right && <div style={{ marginLeft:'auto', textTransform:'none', letterSpacing:0 }}>{right}</div>}
  </div>
);

const IconBtn = ({ title, onClick, color, bg, children, disabled }) => (
  <button type="button" title={title} onClick={onClick} disabled={disabled}
    style={{ padding:5, borderRadius:6, background:bg, border:'none', display:'flex', alignItems:'center',
      cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#cbd5e1' : color }}>
    {children}
  </button>
);

const Empty = ({ text, colSpan }) => (
  <tr><td colSpan={colSpan} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>{text}</td></tr>
);

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Collect Fee
// ══════════════════════════════════════════════════════════════════════════════
const BLANK_PAYMENT = () => ({
  feeType:'Tuition', amount:'', discount:'', fine:'', paymentMethod:'Cash',
  transactionId:'', paymentDate: todayYMD(), remarks:'',
});

function CollectFeeTab({ onCollected, waConfigured }) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [picked, setPicked]       = useState(null);   // the selected student (search result)
  const [dues, setDues]           = useState(null);   // GET /fees/dues response
  const [loadingDues, setLoadingDues] = useState(false);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [form, setForm]           = useState(BLANK_PAYMENT());
  const [saving, setSaving]       = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const searchSeq = useRef(0);

  const inp = f => ({ value: form[f] ?? '', onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });

  // Student search (debounced, ignores out-of-order responses)
  useEffect(() => {
    const q = query.trim();
    if (picked || q.length < 2) { setResults([]); return; }
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/fees/students', { params: { q } });
        if (seq !== searchSeq.current) return;
        setResults(res.data.data || []);
        setShowResults(true);
      } catch (err) {
        if (seq === searchSeq.current) toast.error(errMsg(err, 'Student search failed'));
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, picked]);

  const loadDues = async (studentId, year, prefill) => {
    setLoadingDues(true);
    try {
      const res = await api.get(`/fees/dues/${studentId}`, { params: { academicYear: year } });
      const d = res.data.data;
      setDues(d);
      if (prefill) {
        const firstDue = (d.items || []).find(i => i.due > 0);
        setForm(f => ({ ...f, feeType: firstDue ? firstDue.type : f.feeType, amount: firstDue ? String(firstDue.due) : '' }));
      }
    } catch (err) {
      setDues(null);
      toast.error(errMsg(err, 'Could not load this student\'s fees'));
    }
    setLoadingDues(false);
  };

  const pickStudent = (s) => {
    setPicked(s);
    setQuery(`${s.firstName || ''} ${s.lastName || ''}`.trim() + (s.admissionNumber ? ` (${s.admissionNumber})` : ''));
    setShowResults(false); setResults([]);
    setLastReceipt(null);
    setForm(BLANK_PAYMENT());
    loadDues(s._id, academicYear, true);
  };

  const clearStudent = () => {
    setPicked(null); setDues(null); setQuery(''); setResults([]);
    setForm(BLANK_PAYMENT()); setLastReceipt(null);
  };

  const changeYear = (y) => {
    setAcademicYear(y);
    if (picked) loadDues(picked._id, y, true);
  };

  const amount   = Number(form.amount) || 0;
  const discount = Number(form.discount) || 0;
  const fine     = Number(form.fine) || 0;
  const total    = Math.round((amount - discount + fine) * 100) / 100;
  const dueLine  = dues?.items?.find(i => i.type === form.feeType);

  const handleCollect = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!dues?.student?._id) { toast.error('Search and select a student first'); return; }
    if (!(amount > 0)) { toast.error('Enter an amount greater than 0'); return; }
    if (discount > amount) { toast.error('Discount cannot be more than the amount'); return; }

    setSaving(true);
    try {
      const res = await api.post('/fees/pay', {
        student: dues.student._id,
        feeType: form.feeType,
        amount, discount, fine,
        paymentMethod: form.paymentMethod,
        transactionId: form.paymentMethod === 'Cash' ? '' : form.transactionId,
        paymentDate: form.paymentDate,
        academicYear,
        remarks: form.remarks,
      });
      const r = res.data.data;
      setLastReceipt(r);
      toast.success(`Fee collected — Receipt ${r.receiptNumber}`);
      setForm(f => ({ ...BLANK_PAYMENT(), paymentMethod: f.paymentMethod, feeType: f.feeType }));
      onCollected?.();
      loadDues(dues.student._id, academicYear, false); // refresh dues, but don't pre-fill another amount
    } catch (err) {
      toast.error(errMsg(err, 'Could not collect the fee — nothing was saved'), { duration: 6000 });
    }
    setSaving(false);
  };

  const st = dues?.student;

  return (
    <div className="space-y-4">
      {/* ── Find student ── */}
      <div className="card" style={{ padding:20 }}>
        <Sec title="Find Student" right={
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b' }}>
            Academic year
            <select className="input-field" style={{ width:110, padding:'4px 8px', fontSize:12 }}
              value={academicYear} onChange={e => changeYear(e.target.value)}>
              {yearOptions().map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        } />
        <div style={{ position:'relative' }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="input-field" style={{ paddingLeft:32, paddingRight:36 }}
            placeholder="Type student name, admission number or parent phone..."
            value={query}
            onChange={e => { setQuery(e.target.value); if (picked) { setPicked(null); setDues(null); } }}
            onFocus={() => results.length && setShowResults(true)} />
          {searching && <Loader size={14} className="animate-spin" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#3b82f6' }} />}
          {picked && !searching && (
            <button type="button" onClick={clearStudent} title="Clear"
              style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', border:'none', background:'#f1f5f9', borderRadius:6, padding:4, cursor:'pointer' }}>
              <X size={13} color="#475569" />
            </button>
          )}

          {showResults && !picked && query.trim().length >= 2 && !searching && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:'#fff', zIndex:20,
              border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.08)', maxHeight:300, overflowY:'auto' }}>
              {results.length === 0
                ? <div style={{ padding:14, fontSize:13, color:'#94a3b8' }}>No student found for "{query.trim()}"</div>
                : results.map(s => (
                  <button key={s._id} type="button" onClick={() => pickStudent(s)}
                    style={{ display:'flex', width:'100%', textAlign:'left', gap:10, padding:'10px 14px', border:'none',
                      borderBottom:'1px solid #f8fafc', background:'#fff', cursor:'pointer', alignItems:'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>
                        Adm {s.admissionNumber}{s.className ? ` · ${s.className}` : ''}{s.parentPhone ? ` · ${s.parentPhone}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {loadingDues && (
        <div className="card" style={{ padding:32, textAlign:'center', color:'#94a3b8' }}>
          <Loader size={18} className="animate-spin" style={{ display:'inline' }} /> Loading fees...
        </div>
      )}

      {/* ── Last receipt ── */}
      {lastReceipt && (
        <div className="card" style={{ padding:16, background:'#f0fdf4', border:'1px solid #bbf7d0',
          display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <CheckCircle size={26} color="#16a34a" />
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontWeight:800, color:'#15803d' }}>
              {inr(lastReceipt.totalAmount)} collected — Receipt {lastReceipt.receiptNumber}
            </div>
            <div style={{ fontSize:12, color:'#166534' }}>
              {lastReceipt.student?.name} · {lastReceipt.feeType} · {lastReceipt.paymentMethod} · saved to database
            </div>
          </div>
          <button className="btn-secondary" onClick={() => downloadReceiptPDF(lastReceipt)}><FileDown size={14}/> PDF</button>
          <button className="btn-secondary" onClick={() => printReceipts([lastReceipt], true)}><Printer size={14}/> Print</button>
          <button className="btn-secondary" onClick={() => sendReceiptWA(lastReceipt, waConfigured)}
            style={{ color:'#16a34a', borderColor:'#86efac' }}><MessageCircle size={14}/> WhatsApp</button>
        </div>
      )}

      {st && !loadingDues && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.2fr)', gap:16, alignItems:'start' }}>
          {/* ── Student + dues ── */}
          <div className="card" style={{ padding:20 }}>
            <Sec title="Student" />
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'#eff6ff', color:'#1d4ed8',
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, flexShrink:0 }}>
                {(st.firstName || '?')[0].toUpperCase()}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{st.firstName} {st.lastName}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>
                  Adm {st.admissionNumber}{st.className ? ` · ${st.className}` : ''}
                </div>
                <div style={{ fontSize:12, color: st.parentPhone ? '#64748b' : '#d97706' }}>
                  {st.fatherName ? `${st.fatherName} · ` : ''}{st.parentPhone || '⚠ No parent phone saved'}
                </div>
              </div>
            </div>

            <Sec title={`Fees for ${dues.academicYear}`} />
            {!dues.hasStructure && (
              <div style={{ display:'flex', gap:8, padding:'10px 12px', background:'#fffbeb', border:'1px solid #fde68a',
                borderRadius:8, fontSize:12, color:'#92400e', marginBottom:12 }}>
                <Info size={15} style={{ flexShrink:0, marginTop:1 }} />
                <span>No fee structure is set for this student's class in {dues.academicYear}. You can still collect any amount — add a structure in the <b>Fee Structure</b> tab to track dues.</span>
              </div>
            )}
            {dues.items?.length > 0 && (
              <table>
                <thead><tr><th>Fee</th><th>Total</th><th>Paid</th><th>Due</th><th></th></tr></thead>
                <tbody>
                  {dues.items.map(i => (
                    <tr key={i.type} style={{ background: form.feeType === i.type ? '#eff6ff' : 'transparent' }}>
                      <td style={{ fontWeight:600 }}>{i.type}</td>
                      <td>{inr(i.total)}</td>
                      <td style={{ color:'#16a34a' }}>{inr(i.paid)}</td>
                      <td style={{ fontWeight:800, color: i.due > 0 ? '#dc2626' : '#16a34a' }}>{i.due > 0 ? inr(i.due) : 'Paid'}</td>
                      <td>
                        {i.due > 0 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, feeType:i.type, amount:String(i.due) }))}
                            style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, border:'1px solid #93c5fd',
                              background:'#fff', color:'#1d4ed8', cursor:'pointer' }}>Collect</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background:'#f8fafc' }}>
                    <td style={{ fontWeight:800 }}>Total</td>
                    <td style={{ fontWeight:700 }}>{inr(dues.total)}</td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{inr(dues.paid)}</td>
                    <td style={{ fontWeight:800, color: dues.due > 0 ? '#dc2626' : '#16a34a' }}>{inr(dues.due)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}

            {dues.recent?.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:6 }}>Recent receipts</div>
                {dues.recent.map(r => (
                  <div key={r._id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'5px 0',
                    borderBottom:'1px solid #f8fafc', color: r.isCancelled ? '#94a3b8' : '#475569',
                    textDecoration: r.isCancelled ? 'line-through' : 'none' }}>
                    <span style={{ fontFamily:'monospace' }}>{r.receiptNumber}</span>
                    <span>{fmtDate(r.paymentDate)} · {r.feeType}</span>
                    <span style={{ fontWeight:700 }}>{inr(r.totalAmount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Payment form ── */}
          <form onSubmit={handleCollect} className="card" style={{ padding:20 }}>
            <Sec title="Payment" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Sel label="Fee Type" required value={form.feeType} onChange={e => setForm(p => ({ ...p, feeType:e.target.value }))}>
                {FEE_TYPES.map(f => <option key={f}>{f}</option>)}
              </Sel>
              <div>
                <label className="label">Amount (₹) *</label>
                <input required type="number" min="0.01" step="0.01" className="input-field" placeholder="0" {...inp('amount')} />
                {dueLine && dueLine.total > 0 && (
                  <div style={{ fontSize:11, marginTop:3, color: amount > dueLine.due ? '#dc2626' : '#64748b' }}>
                    Due for {form.feeType}: {inr(dueLine.due)}
                  </div>
                )}
              </div>
              <div><label className="label">Discount (₹)</label><input type="number" min="0" step="0.01" className="input-field" placeholder="0" {...inp('discount')} /></div>
              <div><label className="label">Late Fine (₹)</label><input type="number" min="0" step="0.01" className="input-field" placeholder="0" {...inp('fine')} /></div>
              <Sel label="Payment Mode" required value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod:e.target.value }))}>
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </Sel>
              <div>
                <label className="label">Payment Date *</label>
                <input required type="date" max={todayYMD()} className="input-field" {...inp('paymentDate')} />
              </div>
              {form.paymentMethod !== 'Cash' && (
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">{form.paymentMethod === 'UPI' ? 'UPI Transaction ID' : 'Transaction / Reference No.'}</label>
                  <input className="input-field" maxLength={60} placeholder="Helps match the bank statement later" {...inp('transactionId')} />
                </div>
              )}
              <div style={{ gridColumn:'1/-1' }}>
                <label className="label">Remarks</label>
                <input className="input-field" maxLength={300} placeholder="Optional" {...inp('remarks')} />
              </div>
            </div>

            <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:12, color:'#64748b' }}>
                {inr(amount)}{discount > 0 ? ` − ${inr(discount)}` : ''}{fine > 0 ? ` + ${inr(fine)}` : ''}
              </div>
              <div style={{ fontSize:20, fontWeight:900, color:'#0f172a' }}>{inr(total)}</div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
              <button type="button" className="btn-secondary" onClick={() => setForm(BLANK_PAYMENT())}>Clear</button>
              <button type="submit" disabled={saving || !(amount > 0)} className="btn-primary" style={{ minWidth:200, opacity: saving || !(amount > 0) ? .6 : 1 }}>
                {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : <><CreditCard size={14}/> Collect {inr(total)}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {!st && !loadingDues && !lastReceipt && (
        <div className="card" style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
          <Search size={30} style={{ margin:'0 auto 8px', opacity:.4 }} />
          <div style={{ fontSize:14, fontWeight:600 }}>Search a student to collect fees</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Receipts
// ══════════════════════════════════════════════════════════════════════════════
function ReceiptsTab({ refreshKey, waConfigured, isAdmin, onChanged }) {
  const [search, setSearch]     = useState('');
  const [debounced, setDebounced] = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [page, setPage]         = useState(1);
  const [rows, setRows]         = useState([]);
  const [pagination, setPagination] = useState({ total:0, page:1, pages:1 });
  const [collected, setCollected] = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 400); return () => clearTimeout(t); }, [search]);

  const params = { search: debounced || undefined, from: from || undefined, to: to || undefined };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees/payments', { params: { ...params, page, limit: 25 } });
      setRows(res.data.data || []);
      setPagination(res.data.pagination || { total:0, page:1, pages:1 });
      setCollected(res.data.collected || 0);
    } catch (err) {
      setRows([]);
      toast.error(errMsg(err, 'Could not load receipts'));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [debounced, from, to, page, refreshKey]);

  const exportCSV = async () => {
    const id = toast.loading('Preparing CSV...');
    try {
      await downloadFile('/fees/payments/export.csv', `fee-receipts_${from || 'start'}_to_${to || 'today'}.csv`, params);
      toast.success('CSV downloaded', { id });
    } catch (err) {
      toast.error(await blobErrMsg(err, 'Could not export CSV'), { id });
    }
  };

  const cancelReceipt = async (r) => {
    const reason = prompt(`Cancel receipt ${r.receiptNumber} (${inr(r.totalAmount)} — ${r.student?.name})?\n\nReason (required):`);
    if (reason === null) return;
    if (reason.trim().length < 3) { toast.error('Please give a reason for cancelling'); return; }
    try {
      await api.post(`/fees/payments/${r._id}/cancel`, { reason: reason.trim() });
      toast.success(`Receipt ${r.receiptNumber} cancelled`);
      onChanged?.();
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not cancel the receipt'));
    }
  };

  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); setPage(1); };

  return (
    <div className="space-y-4">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
        {[
          { label: from || to ? 'Collected (filtered)' : 'Collected (all time)', value: inr(collected), color:'#16a34a' },
          { label:'Receipts', value: pagination.total, color:'#3b82f6' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'14px 16px', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginTop:4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', flex:1, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="input-field" placeholder="Receipt no, student name or admission no..."
              style={{ paddingLeft:28 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize:12, color:'#64748b' }}>From</span>
          <input type="date" className="input-field" style={{ width:150 }} value={from} max={to || undefined}
            onChange={e => { setFrom(e.target.value); setPage(1); }} />
          <span style={{ fontSize:12, color:'#64748b' }}>To</span>
          <input type="date" className="input-field" style={{ width:150 }} value={to} min={from || undefined}
            onChange={e => { setTo(e.target.value); setPage(1); }} />
          {(search || from || to) && <button className="btn-secondary" onClick={clearFilters}><X size={13}/> Clear</button>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-secondary" onClick={() => printReceipts(rows.filter(r => !r.isCancelled))}>
            <Printer size={14}/> Print page
          </button>
          <button className="btn-secondary" onClick={exportCSV}><Download size={14}/> Export CSV</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Receipt No</th><th>Student</th><th>Fee</th><th>Total</th><th>Mode</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                  <Loader size={16} className="animate-spin" style={{ display:'inline' }} /> Loading receipts...
                </td></tr>
              ) : rows.length === 0 ? (
                <Empty colSpan={8} text={search || from || to ? 'No receipts match these filters' : 'No fees collected yet'} />
              ) : rows.map(r => (
                <tr key={r._id} style={{ opacity: r.isCancelled ? .6 : 1 }}>
                  <td style={{ fontFamily:'monospace', fontWeight:700, color:'#1d4ed8', fontSize:12 }}>{r.receiptNumber}</td>
                  <td>
                    <div style={{ fontWeight:600, color:'#0f172a' }}>{r.student?.name || '—'}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>
                      {r.student?.admissionNumber}{r.student?.className ? ` · ${r.student.className}` : ''}
                    </div>
                  </td>
                  <td style={{ fontSize:12 }}>{r.feeType}<div style={{ fontSize:11, color:'#94a3b8' }}>{r.academicYear}</div></td>
                  <td>
                    <span style={{ fontWeight:800, color: r.isCancelled ? '#94a3b8' : '#16a34a', fontSize:14,
                      textDecoration: r.isCancelled ? 'line-through' : 'none' }}>{inr(r.totalAmount)}</span>
                    {(r.discount > 0 || r.fine > 0) && (
                      <div style={{ fontSize:10, color:'#94a3b8' }}>
                        {r.discount > 0 ? `−${inr(r.discount)} ` : ''}{r.fine > 0 ? `+${inr(r.fine)}` : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:12, background:'#f1f5f9', color:'#475569' }}>{r.paymentMethod}</span>
                    {r.transactionId && <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{r.transactionId}</div>}
                  </td>
                  <td style={{ fontSize:12, color:'#64748b' }}>
                    {fmtDate(r.paymentDate)}
                    {r.collectedBy && <div style={{ fontSize:10, color:'#94a3b8' }}>by {r.collectedBy}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                      background: r.isCancelled ? '#fee2e2' : '#dcfce7', color: r.isCancelled ? '#dc2626' : '#16a34a' }}>
                      {r.isCancelled ? 'Cancelled' : 'Paid'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <IconBtn title="Print" onClick={() => printReceipts([r], true)} color="#3b82f6" bg="#f1f5f9"><Printer size={14}/></IconBtn>
                      <IconBtn title="Download PDF" onClick={() => downloadReceiptPDF(r)} color="#d97706" bg="#fef3c7"><FileDown size={14}/></IconBtn>
                      <IconBtn title={r.student?.parentPhone ? `WhatsApp ${r.student.parentPhone}` : 'No parent phone saved'}
                        onClick={() => sendReceiptWA(r, waConfigured)} color="#16a34a" bg="#f0fdf4"
                        disabled={r.isCancelled || (!waConfigured && !r.student?.parentPhone)}><MessageCircle size={14}/></IconBtn>
                      {isAdmin && !r.isCancelled && (
                        <IconBtn title="Cancel receipt" onClick={() => cancelReceipt(r)} color="#dc2626" bg="#fff5f5"><Ban size={14}/></IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderTop:'1px solid #f1f5f9' }}>
            <span style={{ fontSize:12, color:'#64748b' }}>Page {pagination.page} of {pagination.pages} · {pagination.total} receipts</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/> Prev</button>
              <button className="btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Fee Structure
// ══════════════════════════════════════════════════════════════════════════════
const BLANK_STRUCTURE = () => ({
  name:'', academicYear: currentAcademicYear(), class:'',
  feeItems:[{ type:'Tuition', amount:'', dueDate:'' }],
});

function FeeStructureTab({ isAdmin }) {
  const [structures, setStructures] = useState([]);
  const [classes, setClasses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [yearFilter, setYearFilter] = useState(currentAcademicYear());
  const [modal, setModal]           = useState(null); // { editing, form }
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/fees/structures'), api.get('/classes')]);
      setStructures(s.data.data || []);
      setClasses(c.data.data || []);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load fee structures'));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shown = structures.filter(s => !yearFilter || s.academicYear === yearFilter);
  const years = [...new Set([...yearOptions(), ...structures.map(s => s.academicYear)])].sort().reverse();

  const openAdd  = () => setModal({ editing: null, form: BLANK_STRUCTURE() });
  const openEdit = (s) => setModal({
    editing: s,
    form: {
      name: s.name, academicYear: s.academicYear, class: s.class?._id || s.class || '',
      feeItems: (s.feeItems || []).map(i => ({ type: i.type, amount: String(i.amount), dueDate: i.dueDate ? toYMD(new Date(i.dueDate)) : '' })),
    },
  });

  const setF = (patch) => setModal(m => ({ ...m, form: { ...m.form, ...patch } }));
  const setItem = (idx, patch) => setModal(m => ({ ...m, form: { ...m.form, feeItems: m.form.feeItems.map((it, i) => i === idx ? { ...it, ...patch } : it) } }));
  const addItem = () => setModal(m => ({ ...m, form: { ...m.form, feeItems: [...m.form.feeItems, { type:'Other', amount:'', dueDate:'' }] } }));
  const removeItem = (idx) => setModal(m => ({ ...m, form: { ...m.form, feeItems: m.form.feeItems.filter((_, i) => i !== idx) } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const f = modal.form;
    const payload = {
      name: f.name.trim(), academicYear: f.academicYear, class: f.class || null,
      feeItems: f.feeItems.map(i => ({ type: i.type, amount: Number(i.amount), ...(i.dueDate ? { dueDate: i.dueDate } : {}) })),
    };
    setSaving(true);
    try {
      if (modal.editing) await api.put(`/fees/structures/${modal.editing._id}`, payload);
      else await api.post('/fees/structures', payload);
      toast.success(modal.editing ? 'Fee structure updated' : 'Fee structure added');
      setModal(null);
      setYearFilter(payload.academicYear);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save the fee structure'));
    }
    setSaving(false);
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete fee structure "${s.name}" (${s.academicYear})?\n\nReceipts already collected are NOT affected, but dues for this class will no longer be tracked.`)) return;
    try {
      await api.delete(`/fees/structures/${s._id}`);
      toast.success('Fee structure deleted');
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete the fee structure'));
    }
  };

  const formTotal = modal ? modal.form.feeItems.reduce((n, i) => n + (Number(i.amount) || 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', minWidth:170 }}>
          <select className="input-field" style={{ appearance:'none', paddingRight:24 }}
            value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="">All academic years</option>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <ChevronDown size={12} style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
        </div>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={14}/> Add Fee Structure</button>}
      </div>

      {!loading && classes.length === 0 && (
        <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, fontSize:13, color:'#1e40af' }}>
          <Info size={16} style={{ flexShrink:0, marginTop:1 }} />
          No classes exist yet. Create them in <b>&nbsp;Classes &amp; Timetable&nbsp;</b> to set class-wise fees — a school-wide structure works without them.
        </div>
      )}

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead><tr><th>Name</th><th>Class</th><th>Year</th><th>Fee Items</th><th>Total</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                  <Loader size={16} className="animate-spin" style={{ display:'inline' }} /> Loading...
                </td></tr>
              ) : shown.length === 0 ? (
                <Empty colSpan={6} text={`No fee structures${yearFilter ? ` for ${yearFilter}` : ''} yet`} />
              ) : shown.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight:700, color:'#0f172a' }}>{s.name}</td>
                  <td>
                    <span style={{ fontWeight:700, background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:12, fontSize:12 }}>
                      {s.class?.name || 'All classes'}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'#64748b' }}>{s.academicYear}</td>
                  <td>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(s.feeItems || []).map((i, idx) => (
                        <span key={idx} title={i.dueDate ? `Due ${fmtDate(i.dueDate)}` : ''}
                          style={{ fontSize:11, background:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:12 }}>
                          {i.type} {inr(i.amount)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight:800, color:'#16a34a', fontSize:15 }}>{inr(s.totalAmount)}</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={13}/></button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, maxWidth:640, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div style={{ fontWeight:800, fontSize:16, color:'#0f172a' }}>{modal.editing ? 'Edit Fee Structure' : 'Add Fee Structure'}</div>
              <button onClick={() => setModal(null)} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={15} color="#475569"/></button>
            </div>
            <form onSubmit={handleSave} style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">Structure Name *</label>
                  <input required className="input-field" placeholder="e.g. Class 10 Annual Fees" value={modal.form.name} onChange={e => setF({ name:e.target.value })} />
                </div>
                <Sel label="Class" value={modal.form.class} onChange={e => setF({ class:e.target.value })}>
                  <option value="">All classes (school-wide)</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.academicYear})</option>)}
                </Sel>
                <Sel label="Academic Year" required value={modal.form.academicYear} onChange={e => setF({ academicYear:e.target.value })}>
                  {[...new Set([...yearOptions(), modal.form.academicYear])].map(y => <option key={y}>{y}</option>)}
                </Sel>
              </div>

              <div>
                <Sec title="Fee Items" right={
                  <button type="button" onClick={addItem} style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:7,
                    border:'1px dashed #93c5fd', background:'#eff6ff', color:'#3b82f6', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    <Plus size={12}/> Add item
                  </button>
                } />
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {modal.form.feeItems.map((it, idx) => (
                    <div key={idx} style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr auto', gap:8, alignItems:'end' }}>
                      <Sel label={idx === 0 ? 'Type' : undefined} value={it.type} onChange={e => setItem(idx, { type:e.target.value })}>
                        {FEE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </Sel>
                      <div>
                        {idx === 0 && <label className="label">Amount (₹) *</label>}
                        <input required type="number" min="0.01" step="0.01" className="input-field" placeholder="12000"
                          value={it.amount} onChange={e => setItem(idx, { amount:e.target.value })} />
                      </div>
                      <div>
                        {idx === 0 && <label className="label">Due Date</label>}
                        <input type="date" className="input-field" value={it.dueDate} onChange={e => setItem(idx, { dueDate:e.target.value })} />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} disabled={modal.form.feeItems.length === 1}
                        title="Remove" style={{ padding:9, borderRadius:8, border:'1px solid #fecaca', background:'#fff5f5',
                          color: modal.form.feeItems.length === 1 ? '#fca5a5' : '#ef4444', cursor: modal.form.feeItems.length === 1 ? 'not-allowed' : 'pointer' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign:'right', marginTop:10, fontSize:14, fontWeight:800, color:'#0f172a' }}>Total: {inr(formTotal)}</div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : modal.editing ? 'Update' : 'Add Structure'}
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
// MAIN Fees page
// ══════════════════════════════════════════════════════════════════════════════
export default function Fees() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [tab, setTab]               = useState('collect');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats]           = useState(null);
  const [waConfigured, setWaConfigured] = useState(false);

  useEffect(() => {
    // optional feature — if this fails we just use wa.me links
    api.get('/fees/whatsapp-status').then(r => setWaConfigured(!!r.data.data?.configured)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = todayYMD();
    const monthStart = `${t.slice(0, 8)}01`;
    Promise.all([
      api.get('/fees/payments', { params: { from: t, to: t, limit: 1 } }),
      api.get('/fees/payments', { params: { from: monthStart, to: t, limit: 1 } }),
    ]).then(([d, m]) => setStats({
      today: d.data.collected, todayCount: d.data.pagination?.total || 0,
      month: m.data.collected, monthCount: m.data.pagination?.total || 0,
    })).catch(err => { setStats(null); toast.error(errMsg(err, 'Could not load fee totals')); });
  }, [refreshKey]);

  const bump = () => setRefreshKey(k => k + 1);

  const TABS = [
    { id:'collect',   label:'Collect Fee',   icon:CreditCard  },
    { id:'receipts',  label:'Receipts',      icon:CheckCircle },
    { id:'structure', label:'Fee Structure', icon:FileText    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
        <p className="text-gray-500 text-sm">Collect fees, issue receipts and manage fee structures</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
        {[
          { label:"Today's Collection", value: stats ? inr(stats.today) : '—', sub: stats ? `${stats.todayCount} receipt${stats.todayCount === 1 ? '' : 's'}` : '', color:'#16a34a', icon:Wallet },
          { label:'This Month',         value: stats ? inr(stats.month) : '—', sub: stats ? `${stats.monthCount} receipt${stats.monthCount === 1 ? '' : 's'}` : '', color:'#3b82f6', icon:CreditCard },
          { label:'Academic Year',      value: currentAcademicYear(), sub:'April – March', color:'#8b5cf6', icon:Calendar },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'14px 16px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color, borderRadius:'12px 12px 0 0' }} />
            <div style={{ background:`${k.color}18`, borderRadius:9, padding:9, flexShrink:0 }}>
              <k.icon size={17} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{k.value}</div>
              {k.sub && <div style={{ fontSize:11, color:'#94a3b8' }}>{k.sub}</div>}
            </div>
          </div>
        ))}
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

      {tab === 'collect'   && <CollectFeeTab onCollected={bump} waConfigured={waConfigured} />}
      {tab === 'receipts'  && <ReceiptsTab refreshKey={refreshKey} waConfigured={waConfigured} isAdmin={isAdmin} onChanged={bump} />}
      {tab === 'structure' && <FeeStructureTab isAdmin={isAdmin} />}

      {!isAdmin && user && !['accountant'].includes(user.role) && (
        <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'#92400e' }}>
          <AlertCircle size={14}/> Only admins and accountants can collect fees.
        </div>
      )}
    </div>
  );
}