// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Bell, Plus, Send, Trash2, X, Search,
  ChevronDown, Users, BookOpen, CreditCard,
  Bus, AlertCircle, CheckCircle, MessageCircle,
  Info, Loader, Eye, Edit, Clock, BarChart2,
  Download, Copy, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Demo data ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  fee:       { color:'#16a34a', bg:'#dcfce7', icon: CreditCard  },
  exam:      { color:'#8b5cf6', bg:'#f3e8ff', icon: BookOpen    },
  general:   { color:'#3b82f6', bg:'#dbeafe', icon: Bell        },
  library:   { color:'#06b6d4', bg:'#cffafe', icon: BookOpen    },
  transport: { color:'#f59e0b', bg:'#fef3c7', icon: Bus         },
  event:     { color:'#ec4899', bg:'#fce7f3', icon: Info        },
};

const PRIORITY_CONFIG = {
  High:   { color:'#ef4444', bg:'#fee2e2' },
  Normal: { color:'#3b82f6', bg:'#dbeafe' },
  Low:    { color:'#94a3b8', bg:'#f1f5f9' },
};

const AUDIENCE_OPTIONS = ['all','students','parents','teachers','staff'];
const TYPE_OPTIONS     = ['general','fee','exam','library','transport','event'];
const PRIORITY_OPTIONS = ['High','Normal','Low'];

const INIT_FORM = {
  title:'', message:'', type:'general', audience:'all', priority:'Normal', whatsapp:false,
};

const SCHOOL = { name:'Greenfield Public School', phone:'080-12345678' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const Sel = ({ label, required, children, ...p }) => (
  <div>
    {label && <label className="label">{label}{required && ' *'}</label>}
    <div style={{ position:'relative' }}>
      <select required={required} className="input-field" style={{ appearance:'none', paddingRight:28 }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

// ── Notification Card ─────────────────────────────────────────────────────────
function NotifCard({ n, onDelete, onSend, onEdit, onDuplicate, onWhatsApp }) {
  const [showDetail, setShowDetail] = useState(false);
  const cfg  = TYPE_CONFIG[n.type]   || TYPE_CONFIG.general;
  const pcfg = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.Normal;
  const pct  = n.sentTo > 0 ? Math.round((n.readCount / n.sentTo) * 100) : 0;
  const Icon = cfg.icon;
  const barColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#3b82f6' : '#f59e0b';
  const audienceLabel = { all:'All', students:'Students', parents:'Parents', teachers:'Teachers', staff:'Staff' };

  return (
    <div className="card" style={{ padding:0, overflow:'hidden', border:'1px solid #e5e7eb', transition:'box-shadow .2s' }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>

      {/* Priority stripe */}
      <div style={{ height:3, background: n.priority==='High' ? '#ef4444' : n.priority==='Normal' ? '#3b82f6' : '#94a3b8' }} />

      <div style={{ padding:'14px 16px' }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={17} color={cfg.color} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
              <span style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>{n.title}</span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
                background:pcfg.bg, color:pcfg.color }}>{n.priority}</span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
                background: n.status==='Sent' ? '#dcfce7' : '#fef9c3',
                color:      n.status==='Sent' ? '#16a34a' : '#d97706' }}>{n.status}</span>
              {n.whatsapp && (
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
                  background:'#dcfce7', color:'#16a34a', display:'flex', alignItems:'center', gap:3 }}>
                  <MessageCircle size={9}/> WA
                </span>
              )}
            </div>
            <p style={{ fontSize:12, color:'#475569', lineHeight:1.5, margin:0,
              display:'-webkit-box', WebkitLineClamp:showDetail?99:2,
              WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {n.message}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8' }}>
            <Users size={11} /> {audienceLabel[n.audience]||n.audience}
          </div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>{fmtDate(n.createdAt)}</div>
          {n.status === 'Sent' && (
            <div style={{ fontSize:11, color:'#64748b' }}>
              Sent to <strong>{n.sentTo}</strong> · <strong style={{ color:'#3b82f6' }}>{n.readCount} read</strong>
            </div>
          )}
          <button onClick={() => setShowDetail(s=>!s)}
            style={{ marginLeft:'auto', fontSize:11, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
            {showDetail ? '▲ Less' : '▼ More'}
          </button>
        </div>

        {/* Read rate bar */}
        {n.status === 'Sent' && (
          <div style={{ marginTop:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:4 }}>
              <span>Read Rate</span>
              <span style={{ fontWeight:700, color:barColor }}>{pct}%</span>
            </div>
            <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:pct+'%', height:'100%', background:barColor, borderRadius:3, transition:'width .8s' }} />
            </div>
          </div>
        )}

        {/* Expanded detail */}
        {showDetail && (
          <div style={{ marginTop:12, padding:12, background:'#f8fafc', borderRadius:8, fontSize:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div><span style={{ color:'#94a3b8' }}>Type: </span><strong>{n.type}</strong></div>
              <div><span style={{ color:'#94a3b8' }}>Audience: </span><strong>{n.audience}</strong></div>
              {n.status==='Sent' && <>
                <div><span style={{ color:'#94a3b8' }}>Not Read: </span><strong style={{ color:'#ef4444' }}>{n.sentTo - n.readCount}</strong></div>
                <div><span style={{ color:'#94a3b8' }}>Read Rate: </span><strong style={{ color:barColor }}>{pct}%</strong></div>
              </>}
            </div>
            {n.status==='Sent' && pct < 70 && (
              <div style={{ marginTop:8, padding:'6px 10px', background:'#fef9c3', borderRadius:6,
                fontSize:11, color:'#92400e', fontWeight:600 }}>
                ⚠️ Only {pct}% read — consider sending a WhatsApp follow-up reminder
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
          {n.status === 'Draft' && (
            <button onClick={() => onSend(n._id)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7,
                border:'none', background:'#3b82f6', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
              <Send size={12} /> Send Now
            </button>
          )}
          <button onClick={() => onEdit(n)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7,
              border:'1px solid #bfdbfe', background:'#eff6ff', color:'#3b82f6', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            <Edit size={12} /> Edit
          </button>
          <button onClick={() => onDuplicate(n)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7,
              border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            <Copy size={12} /> Duplicate
          </button>
          <button onClick={() => onWhatsApp(n)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7,
              border:'1px solid #25D366', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            <MessageCircle size={12} /> WhatsApp
          </button>
          <button onClick={() => onDelete(n._id)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7,
              border:'1px solid #fecaca', background:'#fff5f5', color:'#ef4444', cursor:'pointer', fontSize:12, fontWeight:600, marginLeft:'auto' }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Compose / Edit Modal ──────────────────────────────────────────────────────
function ComposeModal({ editing, onClose, onSubmit, sending }) {
  const [form, setForm]     = useState(editing || INIT_FORM);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const charLimit = 500;

  const inp = f => ({ value:form[f]||'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})) });

  const templates = [
    { label:'Fee Reminder',   type:'fee',       text:'Dear Parent, the fee for [Month] [Year] is due on [Date]. Please pay to avoid late fine. Contact school for any queries.' },
    { label:'Exam Schedule',  type:'exam',      text:'The [Exam Name] examinations will be held from [Start Date] to [End Date]. Admit cards will be issued shortly.' },
    { label:'Holiday Notice', type:'general',   text:'School will remain closed on [Date] on account of [Reason]. Classes will resume on [Next Date].' },
    { label:'PTM Notice',     type:'general',   text:'Parent Teacher Meeting will be held on [Date] at [Time]. All parents are requested to attend.' },
    { label:'Event Notice',   type:'event',     text:'[Event Name] will be held on [Date]. Students are requested to [Action]. For more details contact the school.' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:18, maxWidth:600, width:'100%',
        maxHeight:'90vh', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'18px 22px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
          <div style={{ fontWeight:800, fontSize:16 }}>{editing?'Edit Notification':'Compose Notification'}</div>
          <button onClick={onClose} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Quick Templates */}
          {!editing && (
            <div>
              <label className="label">Quick Templates</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {templates.map(t => (
                  <button key={t.label} type="button"
                    onClick={() => setForm(p => ({ ...p, type:t.type, message:t.text }))}
                    style={{ fontSize:11, padding:'5px 10px', borderRadius:16,
                      border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569',
                      cursor:'pointer', fontWeight:600 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div><label className="label">Title *</label>
            <input required className="input-field" placeholder="e.g. Fee Payment Reminder" {...inp('title')} />
          </div>

          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <label className="label" style={{ margin:0 }}>Message *</label>
              <span style={{ fontSize:11, color: (form.message||'').length>charLimit?'#ef4444':'#94a3b8' }}>
                {(form.message||'').length}/{charLimit}
              </span>
            </div>
            <textarea required className="input-field" rows={4}
              placeholder="Type your message here..."
              maxLength={charLimit}
              value={form.message||''}
              onChange={e=>setForm(p=>({...p,message:e.target.value}))}
              style={{ resize:'vertical' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Sel label="Type" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              {TYPE_OPTIONS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </Sel>
            <Sel label="Send To *" required value={form.audience} onChange={e=>setForm(p=>({...p,audience:e.target.value}))}>
              {AUDIENCE_OPTIONS.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
            </Sel>
            <Sel label="Priority" value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
              {PRIORITY_OPTIONS.map(p=><option key={p}>{p}</option>)}
            </Sel>
          </div>

          {/* WhatsApp toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
            background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
            <MessageCircle size={18} color="#16a34a" />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>Also send via WhatsApp</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Opens WhatsApp for each recipient's parent number</div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              <input type="checkbox" checked={form.whatsapp||false}
                onChange={e=>setForm(p=>({...p,whatsapp:e.target.checked}))} />
              <span style={{ fontSize:12, fontWeight:600, color:'#16a34a' }}>Enable</span>
            </label>
          </div>

          {/* Schedule option */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
            background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10 }}>
            <Clock size={18} color="#3b82f6" />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>Schedule for later</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Save as draft and schedule a send time</div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              <input type="checkbox" checked={scheduleMode}
                onChange={e=>setScheduleMode(e.target.checked)} />
              <span style={{ fontSize:12, fontWeight:600 }}>Schedule</span>
            </label>
          </div>

          {scheduleMode && (
            <div><label className="label">Schedule Date & Time</label>
              <input type="datetime-local" className="input-field"
                value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} />
            </div>
          )}

          {/* Preview */}
          {form.title && form.message && (
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:8 }}>Preview</div>
              <div style={{ fontWeight:700, fontSize:13, color:'#0f172a', marginBottom:4 }}>{form.title}</div>
              <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>{form.message}</div>
              <div style={{ marginTop:8, display:'flex', gap:6 }}>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#dbeafe', color:'#1d4ed8', fontWeight:600 }}>{form.audience}</span>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#f3e8ff', color:'#7c3aed', fontWeight:600 }}>{form.type}</span>
                {form.whatsapp && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#dcfce7', color:'#16a34a', fontWeight:600 }}>WhatsApp</span>}
                {scheduleMode && scheduleDate && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#fef9c3', color:'#92400e', fontWeight:600 }}>Scheduled</span>}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="button" onClick={() => onSubmit({ ...form, status:'Draft' })} className="btn-secondary">
              Save as Draft
            </button>
            <button type="button" disabled={sending}
              onClick={() => onSubmit({ ...form, status: scheduleMode ? 'Draft' : 'Sent', scheduledAt: scheduleDate })}
              className="btn-primary" style={{ minWidth:130 }}>
              {sending ? <><Loader size={13} className="animate-spin" /> Sending...</>
                : scheduleMode ? <><Clock size={13}/> Schedule</>
                : <><Send size={13}/> Send Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Notifications page ───────────────────────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadAll = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load notifications');
    } finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [filterPriority,setFilterPriority]= useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [sending,       setSending]       = useState(false);
  const [bulkSending,   setBulkSending]   = useState(false);
  const [bulkProgress,  setBulkProgress]  = useState({ current:0, total:0 });

  // ── Bulk WhatsApp send ──
  const sendBulkWhatsApp = async (n) => {
    let phones = [];
    try { phones = (await api.get('/notifications/phones', { params:{ audience:n.audience } })).data.data || []; }
    catch (err) { toast.error(err.response?.data?.message || 'Could not load phone numbers'); return; }
    if (!phones.length) { toast.error('No phone numbers found'); return; }
    if (!window.confirm('Send WhatsApp message to ' + phones.length + ' ' + n.audience + '?\n\nThis will open WhatsApp ' + phones.length + ' times.')) return;

    setBulkSending(true);
    setBulkProgress({ current:0, total:phones.length });

    for (let i = 0; i < phones.length; i++) {
      setBulkProgress({ current:i+1, total:phones.length });
      const raw = phones[i].replace(/\D/g,'');
      const ph  = raw.startsWith('91') ? raw : '91'+raw;
      const msg = '📢 *' + n.title + '*\n' + SCHOOL.name + '\n\n' + n.message + '\n\n📞 ' + SCHOOL.phone;
      window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
      if (i < phones.length-1) await new Promise(r=>setTimeout(r,1200));
    }
    setBulkSending(false);
    setBulkProgress({ current:0, total:0 });
    toast.success('WhatsApp sent to ' + phones.length + ' ' + n.audience, { duration:5000 });
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const csv = 'Title,Type,Audience,Priority,Status,Sent To,Read Count,Read Rate,Date\n'
      + notifications.map(n => {
        const pct = n.sentTo ? Math.round(n.readCount/n.sentTo*100)+'%' : '0%';
        return '"'+n.title+'","'+n.type+'","'+n.audience+'","'+n.priority+'","'+n.status+'",'+n.sentTo+','+n.readCount+',"'+pct+'","'+new Date(n.createdAt).toLocaleDateString('en-IN')+'"';
      }).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download='notifications_report.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/notifications/${id}`); toast.success('Deleted'); await loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not delete'); }
  };

  const handleDuplicate = async (n) => {
    try {
      await api.post('/notifications', { title:n.title+' (Copy)', message:n.message, type:n.type, audience:n.audience, priority:n.priority, whatsapp:n.whatsapp, status:'Draft' });
      toast.success('Duplicated as draft'); await loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not duplicate'); }
  };

  const handleSend = async (id) => {
    try { await api.post(`/notifications/${id}/send`); toast.success('Notification sent!'); await loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not send'); }
  };

  const handleEdit = (n) => { setEditing(n); setShowModal(true); };

  const handleSubmit = async (data) => {
    setSending(true);
    const payload = { title:data.title, message:data.message, type:data.type, audience:data.audience, priority:data.priority, whatsapp:!!data.whatsapp, status:data.status, scheduledAt:data.scheduledAt || '' };
    try {
      if (editing) await api.put(`/notifications/${editing._id}`, payload);
      else         await api.post('/notifications', payload);
      toast.success(data.status==='Sent' ? 'Notification sent!' : data.scheduledAt ? 'Scheduled (send it manually at that time)' : 'Saved as draft');
      setShowModal(false); setEditing(null);
      await loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save notification'); }
    finally { setSending(false); }
  };
  const filtered = notifications.filter(n => {
    const q = search.toLowerCase();
    return (!q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q))
      && (!filterStatus   || n.status   === filterStatus)
      && (!filterType     || n.type     === filterType)
      && (!filterPriority || n.priority === filterPriority);
  });

  // ── KPI stats ──
  const sentCount   = notifications.filter(n=>n.status==='Sent').length;
  const draftCount  = notifications.filter(n=>n.status==='Draft').length;
  const totalReach  = notifications.filter(n=>n.status==='Sent').reduce((s,n)=>s+n.sentTo,0);
  const avgReadRate = sentCount > 0
    ? Math.round(notifications.filter(n=>n.status==='Sent').reduce((s,n)=>s+(n.sentTo?n.readCount/n.sentTo*100:0),0)/sentCount)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">Send and manage school announcements</p>
          {loading && <p className="text-sm" style={{ color:'#64748b' }}>Loading notifications…</p>}
          {loadError && <p className="text-sm" style={{ color:'#dc2626' }}>{loadError}</p>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} className="btn-secondary"><Download size={14}/> Export Report</button>
          <button onClick={()=>{ setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus size={14}/> Compose
          </button>
        </div>
      </div>

      {/* Bulk progress banner */}
      {bulkSending && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10,
          padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <Loader size={16} className="animate-spin" color="#3b82f6" />
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
              Sending WhatsApp messages... {bulkProgress.current}/{bulkProgress.total}
            </div>
            <div style={{ fontSize:11, color:'#3b82f6', marginTop:2 }}>Please allow popups if blocked.</div>
          </div>
          <div style={{ marginLeft:'auto', background:'#3b82f6', color:'#fff', borderRadius:20,
            padding:'3px 12px', fontSize:12, fontWeight:700 }}>
            {Math.round(bulkProgress.current/bulkProgress.total*100)||0}%
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14 }}>
        {[
          { label:'Total Sent',    value:sentCount,          color:'#3b82f6', icon:Send         },
          { label:'Drafts',        value:draftCount,         color:'#f59e0b', icon:Clock        },
          { label:'Total Reach',   value:totalReach.toLocaleString(), color:'#8b5cf6', icon:Users },
          { label:'Avg Read Rate', value:avgReadRate+'%',    color:'#16a34a', icon:CheckCircle  },
          { label:'This Week',     value:notifications.filter(n=>{ const d=new Date(n.createdAt); const w=new Date(); return w-d<7*24*60*60*1000; }).length, color:'#06b6d4', icon:BarChart2 },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'14px 16px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color }} />
            <div style={{ background:k.color+'18', borderRadius:9, padding:9, flexShrink:0 }}>
              <k.icon size={17} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="input-field" placeholder="Search notifications..."
            style={{ paddingLeft:28 }} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Sel value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Sent</option><option>Draft</option>
        </Sel>
        <Sel value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </Sel>
        <Sel value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map(p=><option key={p}>{p}</option>)}
        </Sel>
        {(search||filterStatus||filterType||filterPriority) && (
          <button onClick={()=>{ setSearch(''); setFilterStatus(''); setFilterType(''); setFilterPriority(''); }}
            style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc',
              color:'#ef4444', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
            <X size={12}/> Clear
          </button>
        )}
        <div style={{ fontSize:12, color:'#94a3b8', marginLeft:4 }}>{filtered.length} of {notifications.length}</div>
      </div>

      {/* Notification grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
        {filtered.map(n => (
          <NotifCard key={n._id} n={n}
            onDelete={handleDelete}
            onSend={handleSend}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onWhatsApp={sendBulkWhatsApp}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', color:'#94a3b8' }}>
            <Bell size={36} style={{ margin:'0 auto 10px', opacity:.3 }} />
            <div style={{ fontSize:14, fontWeight:600 }}>No notifications found</div>
          </div>
        )}
      </div>

      {/* Compose / Edit modal */}
      {showModal && (
        <ComposeModal
          editing={editing}
          onClose={()=>{ setShowModal(false); setEditing(null); }}
          onSubmit={handleSubmit}
          sending={sending}
        />
      )}
    </div>
  );
}