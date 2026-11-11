// @ts-nocheck
import { useState } from 'react';
import {
  CreditCard, CheckCircle, Clock, AlertCircle,
  Download, Search, ChevronDown, Loader, X,
  Shield, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── CONFIG — Replace with your Razorpay Key ───────────────
const RAZORPAY_KEY = 'rzp_test_YourKeyHere'; // Replace with your Razorpay Key ID
const SCHOOL = {
  name:    'Greenfield Public School',
  phone:   '080-12345678',
  email:   'fees@greenfieldschool.edu',
  address: 'Bengaluru, Karnataka',
  logo:    '🏫',
};

// ── Demo data ─────────────────────────────────────────────
const DEMO_PENDING = [
  { _id:'p1', studentName:'Arjun Sharma',    admNo:'ADM001', class:'10', feeType:'Tuition Fee',   amount:12000, dueDate:'2026-10-10', parentPhone:'9876543210', parentEmail:'arjun@gmail.com',    status:'Pending' },
  { _id:'p2', studentName:'Priya Patel',     admNo:'ADM002', class:'10', feeType:'Transport Fee', amount:6000,  dueDate:'2026-09-30', parentPhone:'9876543211', parentEmail:'priya@gmail.com',     status:'Overdue' },
  { _id:'p3', studentName:'Rahul Kumar',     admNo:'ADM003', class:'9',  feeType:'Exam Fee',      amount:500,   dueDate:'2026-10-05', parentPhone:'9876543212', parentEmail:'rahul@gmail.com',     status:'Pending' },
  { _id:'p4', studentName:'Sneha Reddy',     admNo:'ADM004', class:'9',  feeType:'Library Fee',   amount:800,   dueDate:'2026-09-25', parentPhone:'9876543213', parentEmail:'sneha@gmail.com',     status:'Overdue' },
  { _id:'p5', studentName:'Sidda Madabhavi', admNo:'123',    class:'10', feeType:'Tuition Fee',   amount:12000, dueDate:'2026-10-10', parentPhone:'9008303681', parentEmail:'sidda@gmail.com',     status:'Pending' },
];

const DEMO_PAID = [
  { _id:'r1', receiptNo:'RCP001', studentName:'Arjun Sharma',  admNo:'ADM001', class:'10', feeType:'Tuition Fee',   amount:12000, paymentMode:'Razorpay', paymentId:'pay_abc123', paymentDate:'2026-09-18', status:'Paid' },
  { _id:'r2', receiptNo:'RCP002', studentName:'Priya Patel',   admNo:'ADM002', class:'10', feeType:'Transport Fee', amount:6000,  paymentMode:'UPI',      paymentId:'pay_def456', paymentDate:'2026-09-17', status:'Paid' },
];

const PAYMENT_MODES = ['All','Razorpay','UPI','Cash','Card','Net Banking'];

// ── Helpers ───────────────────────────────────────────────
const Sel = ({ label, children, ...p }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <div style={{ position:'relative' }}>
      <select className="input-field" style={{ appearance:'none', paddingRight:28 }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const daysLeft = d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;

// ── Load Razorpay Script ──────────────────────────────────
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Payment Modal ─────────────────────────────────────────
function PaymentModal({ fee, onClose, onSuccess }) {
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState('confirm'); // confirm | processing | success
  const [paymentId, setPaymentId] = useState('');
  const [method,    setMethod]    = useState('razorpay');

  const handleRazorpay = async () => {
    setLoading(true);
    const loaded = await loadRazorpay();

    if (!loaded) {
      toast.error('Razorpay failed to load. Check internet connection.');
      setLoading(false);
      return;
    }

    const options = {
      key:         RAZORPAY_KEY,
      amount:      fee.amount * 100, // paise
      currency:    'INR',
      name:        SCHOOL.name,
      description: fee.feeType + ' — ' + fee.studentName,
      image:       '🏫',
      prefill: {
        name:    fee.studentName,
        email:   fee.parentEmail || '',
        contact: fee.parentPhone || '',
      },
      notes: {
        student_name:   fee.studentName,
        admission_no:   fee.admNo,
        class:          fee.class,
        fee_type:       fee.feeType,
      },
      theme: { color:'#1e3a8a' },
      handler: function(response) {
        // Payment successful
        setPaymentId(response.razorpay_payment_id);
        setStep('success');
        onSuccess({
          ...fee,
          paymentId:   response.razorpay_payment_id,
          paymentMode: 'Razorpay',
          paymentDate: new Date().toISOString().split('T')[0],
          receiptNo:   'RCP' + Date.now().toString().slice(-4),
          status:      'Paid',
        });
        toast.success('Payment successful! ₹' + fee.amount.toLocaleString());
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          toast('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function(response) {
      toast.error('Payment failed: ' + response.error.description);
      setLoading(false);
    });
    rzp.open();
    setLoading(false);
  };

  // Demo payment (when Razorpay key not configured)
  const handleDemoPayment = () => {
    setStep('processing');
    setTimeout(() => {
      const pid = 'pay_DEMO_' + Date.now();
      setPaymentId(pid);
      setStep('success');
      onSuccess({
        ...fee,
        paymentId:   pid,
        paymentMode: 'Razorpay',
        paymentDate: new Date().toISOString().split('T')[0],
        receiptNo:   'RCP' + Date.now().toString().slice(-4),
        status:      'Paid',
      });
      toast.success('Payment successful! ₹' + fee.amount.toLocaleString());
    }, 2000);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:50,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, maxWidth:460, width:'100%', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', padding:'20px 24px', color:'#fff', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', right:14, top:14, background:'rgba(255,255,255,.2)',
            border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff' }}>
            <X size={15}/>
          </button>
          <div style={{ fontSize:13, opacity:.85 }}>🏫 {SCHOOL.name}</div>
          <div style={{ fontSize:22, fontWeight:900, margin:'6px 0' }}>₹{fee.amount.toLocaleString()}</div>
          <div style={{ fontSize:12, opacity:.85 }}>{fee.feeType} · {fee.studentName} · Class {fee.class}</div>
        </div>

        <div style={{ padding:24 }}>
          {step === 'confirm' && (
            <>
              {/* Fee details */}
              <div style={{ background:'#f8fafc', borderRadius:12, padding:14, marginBottom:16 }}>
                {[
                  ['Student',    fee.studentName],
                  ['Adm No',     fee.admNo],
                  ['Class',      'Class ' + fee.class],
                  ['Fee Type',   fee.feeType],
                  ['Amount',     '₹' + fee.amount.toLocaleString()],
                  ['Due Date',   fmtDate(fee.dueDate)],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0',
                    borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                    <span style={{ color:'#64748b' }}>{k}</span>
                    <span style={{ fontWeight:700, color:'#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Payment method */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:10, textTransform:'uppercase' }}>Pay via</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { id:'razorpay', label:'Razorpay', icon:'💳', sub:'Card / UPI / Net Banking' },
                    { id:'upi',      label:'UPI',       icon:'📱', sub:'GPay / PhonePe / Paytm'  },
                  ].map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      style={{ padding:'10px 12px', borderRadius:10, cursor:'pointer', textAlign:'left',
                        border: method===m.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: method===m.id ? '#eff6ff' : '#f8fafc' }}>
                      <div style={{ fontSize:18 }}>{m.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', marginTop:4 }}>{m.label}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>{m.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security note */}
              <div style={{ display:'flex', gap:6, alignItems:'center', fontSize:11, color:'#16a34a',
                background:'#f0fdf4', padding:'8px 12px', borderRadius:8, marginBottom:16 }}>
                <Shield size={13}/> 100% Secure · SSL Encrypted · Powered by Razorpay
              </div>

              <button
                onClick={RAZORPAY_KEY === 'rzp_test_YourKeyHere' ? handleDemoPayment : handleRazorpay}
                disabled={loading}
                style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                  color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <><Loader size={16} className="animate-spin"/> Processing...</>
                  : <>💳 Pay ₹{fee.amount.toLocaleString()} Now</>}
              </button>
              {RAZORPAY_KEY === 'rzp_test_YourKeyHere' && (
                <div style={{ fontSize:10, color:'#94a3b8', textAlign:'center', marginTop:6 }}>
                  Demo mode — Add your Razorpay key to enable real payments
                </div>
              )}
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <Loader size={40} className="animate-spin" color="#3b82f6" style={{ margin:'0 auto 16px' }} />
              <div style={{ fontWeight:700, fontSize:15 }}>Processing Payment...</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>Please wait, do not close this window</div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
              <div style={{ fontWeight:900, fontSize:18, color:'#16a34a' }}>Payment Successful!</div>
              <div style={{ fontSize:13, color:'#64748b', margin:'8px 0 16px' }}>
                ₹{fee.amount.toLocaleString()} paid for {fee.feeType}
              </div>
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:12, marginBottom:16 }}>
                <div style={{ fontSize:11, color:'#64748b' }}>Payment ID</div>
                <div style={{ fontFamily:'monospace', fontWeight:700, color:'#16a34a', fontSize:13 }}>{paymentId}</div>
              </div>
              <button onClick={onClose} className="btn-primary" style={{ width:'100%' }}>
                Done — View Receipt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main FeePayment page ──────────────────────────────────
export default function FeePayment() {
  const [tab,         setTab]         = useState('pending');
  const [pending,     setPending]     = useState(DEMO_PENDING);
  const [paid,        setPaid]        = useState(DEMO_PAID);
  const [payingFee,   setPayingFee]   = useState(null);
  const [search,      setSearch]      = useState('');
  const [modeFilter,  setModeFilter]  = useState('All');

  const handleSuccess = (receipt) => {
    setPaid(prev => [receipt, ...prev]);
    setPending(prev => prev.filter(p => p._id !== receipt._id));
    setPayingFee(null);
  };

  const totalPending = pending.reduce((s,p)=>s+p.amount,0);
  const totalPaid    = paid.reduce((s,r)=>s+r.amount,0);
  const overdue      = pending.filter(p=>p.status==='Overdue').length;

  const filteredPaid = paid.filter(r =>
    (!search || r.studentName.toLowerCase().includes(search.toLowerCase()) || r.receiptNo.includes(search))
    && (modeFilter==='All' || r.paymentMode===modeFilter)
  );

  const exportCSV = () => {
    const csv = 'Receipt No,Student,Class,Fee Type,Amount,Mode,Payment ID,Date\n'
      + paid.map(r => `"${r.receiptNo}","${r.studentName}","${r.class}","${r.feeType}",${r.amount},"${r.paymentMode}","${r.paymentId||''}","${r.paymentDate}"`).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a    = document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='fee_payments.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Exported');
  };

  const TABS = [
    { id:'pending',  label:'Pending / Overdue', count:pending.length },
    { id:'paid',     label:'Payment History',   count:paid.length    },
    { id:'settings', label:'Payment Settings'                        },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Online Fee Payment</h1>
        <p className="text-gray-500 text-sm">Collect fees online via Razorpay · UPI · Card · Net Banking</p>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14 }}>
        {[
          { label:'Total Pending',  value:`₹${(totalPending/1000).toFixed(0)}K`, color:'#ef4444', icon:Clock       },
          { label:'Overdue',        value:overdue,                                color:'#dc2626', icon:AlertCircle },
          { label:'Total Collected',value:`₹${(totalPaid/1000).toFixed(0)}K`,    color:'#16a34a', icon:CheckCircle },
          { label:'Transactions',   value:paid.length,                            color:'#3b82f6', icon:CreditCard  },
        ].map(k=>(
          <div key={k.label} className="card" style={{ padding:'14px 16px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color }} />
            <div style={{ background:k.color+'18', borderRadius:9, padding:9 }}>
              <k.icon size={17} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #f1f5f9' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px',
              border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent',
              color:       tab===t.id?'#1e40af':'#64748b',
              borderBottom:tab===t.id?'2px solid #3b82f6':'2px solid transparent',
              marginBottom:'-2px' }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ background:tab===t.id?'#3b82f6':'#f1f5f9',
                color:tab===t.id?'#fff':'#64748b', fontSize:10, fontWeight:700,
                padding:'1px 7px', borderRadius:20 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Pending tab */}
      {tab==='pending' && (
        <div className="space-y-3">
          {pending.map(p=>{
            const days = daysLeft(p.dueDate);
            const overdue = days !== null && days < 0;
            return (
              <div key={p._id} className="card" style={{ padding:16,
                border:overdue?'1px solid #fecaca':'1px solid #e5e7eb',
                background:overdue?'#fff5f5':'#fff' }}>
                <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  {/* Info */}
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:800, fontSize:14 }}>{p.studentName}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
                        background:overdue?'#fee2e2':'#fef9c3',
                        color:overdue?'#dc2626':'#d97706' }}>
                        {overdue ? '🔴 OVERDUE' : '🟡 Pending'}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:12, color:'#64748b' }}>
                      <span>Adm: {p.admNo}</span>
                      <span>Class {p.class}</span>
                      <span>{p.feeType}</span>
                      <span>Due: {fmtDate(p.dueDate)}</span>
                      {days !== null && (
                        <span style={{ fontWeight:700, color:overdue?'#dc2626':'#d97706' }}>
                          {overdue ? Math.abs(days)+' days overdue' : days+' days left'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount + Pay button */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:22, fontWeight:900, color:'#ef4444' }}>₹{p.amount.toLocaleString()}</div>
                    </div>
                    <button onClick={() => setPayingFee(p)}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px',
                        background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', color:'#fff',
                        border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:800,
                        boxShadow:'0 4px 14px rgba(59,130,246,.3)' }}>
                      💳 Pay Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {pending.length===0 && (
            <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
              <CheckCircle size={36} style={{ margin:'0 auto 10px', color:'#16a34a', opacity:.5 }} />
              <div style={{ fontWeight:700 }}>All fees are paid! 🎉</div>
            </div>
          )}
        </div>
      )}

      {/* Paid tab */}
      {tab==='paid' && (
        <div className="space-y-4">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:8, flex:1 }}>
              <div style={{ position:'relative', flex:1, minWidth:180 }}>
                <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                <input className="input-field" placeholder="Search receipt, student..." style={{ paddingLeft:28 }}
                  value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <Sel value={modeFilter} onChange={e=>setModeFilter(e.target.value)}>
                {PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}
              </Sel>
            </div>
            <button onClick={exportCSV} className="btn-secondary"><Download size={14}/> Export CSV</button>
          </div>

          <div className="card">
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr><th>Receipt</th><th>Student</th><th>Class</th><th>Fee Type</th><th>Amount</th><th>Mode</th><th>Payment ID</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredPaid.map(r=>(
                    <tr key={r._id}>
                      <td style={{ fontFamily:'monospace', fontWeight:700, color:'#1d4ed8', fontSize:12 }}>{r.receiptNo}</td>
                      <td style={{ fontWeight:600 }}>{r.studentName}</td>
                      <td>Class {r.class}</td>
                      <td style={{ fontSize:12 }}>{r.feeType}</td>
                      <td><span style={{ fontWeight:800, color:'#16a34a', fontSize:14 }}>₹{r.amount.toLocaleString()}</span></td>
                      <td>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:12,
                          background: r.paymentMode==='Razorpay'?'#dbeafe':'#f1f5f9',
                          color:      r.paymentMode==='Razorpay'?'#1d4ed8':'#475569' }}>
                          {r.paymentMode==='Razorpay'?'💳 ':''}{r.paymentMode}
                        </span>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{r.paymentId||'—'}</td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{fmtDate(r.paymentDate)}</td>
                      <td><span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background:'#dcfce7', color:'#16a34a' }}>✓ Paid</span></td>
                    </tr>
                  ))}
                  {filteredPaid.length===0 && <tr><td colSpan={9} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No payments found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab==='settings' && (
        <div className="space-y-4">
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:16 }}>⚙️ Razorpay Configuration</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="label">Razorpay Key ID</label>
                <input className="input-field" defaultValue={RAZORPAY_KEY} placeholder="rzp_live_xxxxxxxxxx" />
                <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Get from Razorpay Dashboard → Settings → API Keys</div>
              </div>
              <div>
                <label className="label">Razorpay Key Secret</label>
                <input className="input-field" type="password" placeholder="••••••••••••••••" />
                <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Keep this secret — never share with anyone</div>
              </div>
              <div style={{ padding:14, background:'#eff6ff', borderRadius:10, border:'1px solid #bfdbfe' }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1d4ed8', marginBottom:8 }}>📋 Accepted Payment Methods</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['💳 Credit Card','💳 Debit Card','📱 UPI / GPay','🏦 Net Banking','👛 Wallets','💰 EMI'].map(m=>(
                    <span key={m} style={{ fontSize:12, padding:'4px 12px', borderRadius:20, background:'#dbeafe', color:'#1d4ed8', fontWeight:600 }}>{m}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding:14, background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0' }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#15803d', marginBottom:6 }}>✅ How it works</div>
                <div style={{ fontSize:12, color:'#475569', lineHeight:1.7 }}>
                  1. Admin clicks "Pay Now" on a pending fee<br/>
                  2. Razorpay checkout opens — parent pays via UPI/Card/Net Banking<br/>
                  3. Payment confirmed instantly by Razorpay<br/>
                  4. Receipt auto-generated and moved to Payment History<br/>
                  5. WhatsApp receipt sent to parent automatically
                </div>
              </div>
              <button className="btn-primary" onClick={()=>toast.success('Settings saved!')}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingFee && (
        <PaymentModal
          fee={payingFee}
          onClose={() => setPayingFee(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}