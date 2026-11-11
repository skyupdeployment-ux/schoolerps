// @ts-nocheck
import { useState } from 'react';
import {
  Plus, Search, X, Loader, ChevronDown, Edit, Trash2,
  MapPin, Phone, AlertCircle, CheckCircle, Clock,
  Fuel, Shield, Users, Bus, Navigation, Bell,
  MessageCircle, Download, TrendingUp, BarChart2, Link, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const VEHICLE_TYPES = ['Bus','Mini Bus','Van','Auto'];
const FUEL_TYPES    = ['Diesel','Petrol','CNG','Electric'];
const SCHOOL = { name:'Greenfield Public School', phone:'080-12345678' };

const VEHICLE_INIT = {
  vehicleNumber:'', vehicleType:'Bus', capacity:'', driverName:'', driverPhone:'',
  conductorName:'', conductorPhone:'', routeNumber:'', routeName:'', fuelType:'Diesel',
  insuranceExpiry:'', fitnessExpiry:'', permitExpiry:'', pollutionExpiry:'',
  status:'Active', notes:'', purchaseYear:'',
};

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_VEHICLES = [
  { _id:'v1', vehicleNumber:'KA-01-F-1234', vehicleType:'Bus',     capacity:50, driverName:'Ramesh Kumar',  driverPhone:'9876543210', conductorName:'Suresh',  conductorPhone:'9876543211', routeNumber:'01', routeName:'North Route',   fuelType:'Diesel', status:'Active',      insuranceExpiry:'2027-03-31', fitnessExpiry:'2026-12-15', permitExpiry:'2026-11-30', pollutionExpiry:'2026-10-20', purchaseYear:'2019', notes:'', stops:[{name:'Main Gate',time:'7:00 AM'},{name:'Bus Stand',time:'7:20 AM'},{name:'Market',time:'7:40 AM'},{name:'Railway Station',time:'7:55 AM'}] },
  { _id:'v2', vehicleNumber:'KA-01-G-5678', vehicleType:'Bus',     capacity:45, driverName:'Mahesh Reddy',  driverPhone:'9876543220', conductorName:'Ganesh',  conductorPhone:'9876543221', routeNumber:'02', routeName:'South Route',   fuelType:'Diesel', status:'Active',      insuranceExpiry:'2026-10-20', fitnessExpiry:'2027-01-10', permitExpiry:'2027-02-28', pollutionExpiry:'2026-09-15', purchaseYear:'2020', notes:'', stops:[{name:'School Gate',time:'7:00 AM'},{name:'RV Road',time:'7:25 AM'},{name:'Jayanagar',time:'7:45 AM'}] },
  { _id:'v3', vehicleNumber:'KA-02-H-9012', vehicleType:'Mini Bus',capacity:25, driverName:'Sunil Patil',   driverPhone:'9876543230', conductorName:'Ravi',    conductorPhone:'9876543231', routeNumber:'03', routeName:'East Route',    fuelType:'CNG',    status:'Maintenance', insuranceExpiry:'2026-07-15', fitnessExpiry:'2026-09-30', permitExpiry:'2026-08-31', pollutionExpiry:'2026-07-01', purchaseYear:'2021', notes:'Engine service due', stops:[{name:'School',time:'7:00 AM'},{name:'Silk Board',time:'7:30 AM'},{name:'Electronic City',time:'8:00 AM'}] },
  { _id:'v4', vehicleNumber:'KA-03-J-3456', vehicleType:'Van',     capacity:12, driverName:'Prakash Singh', driverPhone:'9876543240', conductorName:'',        conductorPhone:'',           routeNumber:'04', routeName:'West Route',    fuelType:'Petrol', status:'Active',      insuranceExpiry:'2025-12-31', fitnessExpiry:'2026-06-20', permitExpiry:'2026-05-31', pollutionExpiry:'2025-11-30', purchaseYear:'2022', notes:'', stops:[{name:'School',time:'7:00 AM'},{name:'KR Puram',time:'7:20 AM'},{name:'Whitefield',time:'7:50 AM'}] },
];

const DEMO_STUDENTS = [
  { _id:'st1', name:'Arjun Sharma',    admNo:'ADM001', class:'10', vehicleId:'v1', stop:'Bus Stand',       feeStatus:'Paid',    parentPhone:'9876543210' },
  { _id:'st2', name:'Priya Patel',     admNo:'ADM002', class:'10', vehicleId:'v1', stop:'Market',          feeStatus:'Paid',    parentPhone:'9876543211' },
  { _id:'st3', name:'Rahul Kumar',     admNo:'ADM003', class:'9',  vehicleId:'v2', stop:'RV Road',         feeStatus:'Pending', parentPhone:'9876543212' },
  { _id:'st4', name:'Sneha Reddy',     admNo:'ADM004', class:'9',  vehicleId:'v2', stop:'Jayanagar',       feeStatus:'Paid',    parentPhone:'9876543213' },
  { _id:'st5', name:'Sidda Madabhavi', admNo:'123',    class:'10', vehicleId:'v3', stop:'Electronic City', feeStatus:'Overdue', parentPhone:'9008303681' },
];

const DEMO_FUEL = [
  { _id:'f1', vehicleId:'v1', date:'2026-09-20', liters:60, amount:5400, odometer:45200, filledBy:'Ramesh Kumar' },
  { _id:'f2', vehicleId:'v2', date:'2026-09-18', liters:55, amount:4950, odometer:38100, filledBy:'Mahesh Reddy' },
  { _id:'f3', vehicleId:'v1', date:'2026-09-10', liters:58, amount:5220, odometer:44900, filledBy:'Ramesh Kumar' },
  { _id:'f4', vehicleId:'v4', date:'2026-09-15', liters:30, amount:2850, odometer:22500, filledBy:'Prakash Singh' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const Sec = ({ title }) => (
  <div style={{ fontSize:11, fontWeight:700, color:'#3b82f6', textTransform:'uppercase',
    letterSpacing:.8, borderBottom:'2px solid #eff6ff', paddingBottom:6, marginBottom:12,
    display:'flex', alignItems:'center', gap:6 }}>
    <div style={{ width:3, height:14, background:'#3b82f6', borderRadius:2 }} />{title}
  </div>
);

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

// Days until expiry
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
};

const ExpiryBadge = ({ label, date }) => {
  const d = daysUntil(date);
  if (d === null) return null;
  const color = d < 0 ? '#dc2626' : d < 30 ? '#d97706' : d < 90 ? '#2563eb' : '#16a34a';
  const bg    = d < 0 ? '#fee2e2' : d < 30 ? '#fef9c3' : d < 90 ? '#dbeafe' : '#dcfce7';
  const text  = d < 0 ? `${Math.abs(d)}d overdue` : d < 30 ? `${d}d left` : new Date(date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', fontSize:12 }}>
      <span style={{ color:'#64748b' }}>{label}</span>
      <span style={{ fontWeight:700, color, background:bg, padding:'2px 8px', borderRadius:12, fontSize:11 }}>{text}</span>
    </div>
  );
};

// ── Vehicle Card ──────────────────────────────────────────────────────────────
function VehicleCard({ v, onEdit, onDelete, onWhatsApp }) {
  const [expanded, setExpanded] = useState(false);
  const expiries = [
    { label:'Insurance', date: v.insuranceExpiry },
    { label:'Fitness',   date: v.fitnessExpiry   },
    { label:'Permit',    date: v.permitExpiry     },
    { label:'Pollution', date: v.pollutionExpiry  },
  ];
  const urgent = expiries.filter(e => { const d = daysUntil(e.date); return d !== null && d < 30; });
  const statusColor = v.status==='Active' ? '#16a34a' : v.status==='Maintenance' ? '#d97706' : '#dc2626';
  const statusBg    = v.status==='Active' ? '#dcfce7' : v.status==='Maintenance' ? '#fef9c3' : '#fee2e2';

  return (
    <div className="card" style={{ padding:0, overflow:'hidden', border: urgent.length ? '1px solid #fca5a5' : '1px solid #e5e7eb' }}>
      {/* Urgent expiry banner */}
      {urgent.length > 0 && (
        <div style={{ background:'#fef9c3', padding:'6px 14px', display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid #fde68a' }}>
          <AlertCircle size={13} color="#d97706" />
          <span style={{ fontSize:11, fontWeight:700, color:'#92400e' }}>
            ⚠️ {urgent.map(e=>e.label).join(', ')} expiring soon!
          </span>
          <button onClick={() => onWhatsApp(v, 'expiry')}
            style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6,
              border:'1px solid #25D366', background:'#f0fdf4', color:'#16a34a', cursor:'pointer' }}>
            <MessageCircle size={10} style={{ display:'inline', marginRight:3 }} />Notify Driver
          </button>
        </div>
      )}

      <div style={{ padding:16, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'start' }}>
        {/* Icon */}
        <div style={{ width:48, height:48, borderRadius:12, background:'#eff6ff',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Bus size={22} color="#3b82f6" />
        </div>

        {/* Info */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{v.vehicleNumber}</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:statusBg, color:statusColor }}>{v.status}</span>
            <span style={{ fontSize:11, background:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:12 }}>{v.vehicleType}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px', marginTop:8 }}>
            <div style={{ fontSize:12, color:'#64748b' }}><Users size={11} style={{ display:'inline', marginRight:4 }} />Capacity: <strong>{v.capacity}</strong></div>
            <div style={{ fontSize:12, color:'#64748b' }}><Fuel size={11} style={{ display:'inline', marginRight:4 }} />{v.fuelType}</div>
            <div style={{ fontSize:12, color:'#64748b' }}><Navigation size={11} style={{ display:'inline', marginRight:4 }} />Route {v.routeNumber}: {v.routeName}</div>
            <div style={{ fontSize:12, color:'#64748b' }}><Phone size={11} style={{ display:'inline', marginRight:4 }} />{v.driverName} · {v.driverPhone}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
          <div style={{ display:'flex', gap:4 }}>
            <button onClick={() => onWhatsApp(v, 'driver')} title={'WhatsApp ' + v.driverName}
              style={{ padding:6, borderRadius:7, border:'1px solid #25D366', background:'#f0fdf4', cursor:'pointer', color:'#16a34a', display:'flex' }}>
              <MessageCircle size={13} />
            </button>
            <button onClick={() => onEdit(v)}
              style={{ padding:6, borderRadius:7, border:'1px solid #bfdbfe', background:'#eff6ff', cursor:'pointer', color:'#3b82f6', display:'flex' }}>
              <Edit size={13} />
            </button>
            <button onClick={() => onDelete(v._id)}
              style={{ padding:6, borderRadius:7, border:'1px solid #fecaca', background:'#fff5f5', cursor:'pointer', color:'#ef4444', display:'flex' }}>
              <Trash2 size={13} />
            </button>
          </div>
          <button onClick={() => setExpanded(e => !e)}
            style={{ fontSize:11, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
            {expanded ? '▲ Hide details' : '▼ Show details'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop:'1px solid #f1f5f9', padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Document expiry */}
          <div style={{ background:'#f8fafc', borderRadius:10, padding:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>Document Expiry</div>
            {expiries.map(e => <ExpiryBadge key={e.label} label={e.label} date={e.date} />)}
          </div>

          {/* Route stops */}
          <div style={{ background:'#f8fafc', borderRadius:10, padding:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>Route Stops</div>
            {(v.stops||[]).map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#3b82f6', color:'#fff',
                  fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, fontSize:12, color:'#0f172a', fontWeight:600 }}>{s.name}</div>
                <div style={{ fontSize:11, color:'#3b82f6', fontWeight:700 }}>{s.time}</div>
              </div>
            ))}
            {(!v.stops || v.stops.length===0) && <div style={{ fontSize:12, color:'#94a3b8' }}>No stops added</div>}
          </div>

          {/* Conductor */}
          {v.conductorName && (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>Conductor</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{v.conductorName}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{v.conductorPhone}</div>
            </div>
          )}

          {/* Notes */}
          {v.notes && (
            <div style={{ background:'#fef9c3', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', marginBottom:6 }}>Notes</div>
              <div style={{ fontSize:12, color:'#78350f' }}>{v.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Vehicle Form Modal ────────────────────────────────────────────────────────
function VehicleModal({ editing, form, setForm, onSave, onClose, saving }) {
  const inp = f => ({ value:form[f]||'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})) });
  const [stops, setStops] = useState(editing?.stops || []);
  const addStop    = () => setStops(prev => [...prev, { name:'', time:'' }]);
  const removeStop = (i) => setStops(prev => prev.filter((_,idx)=>idx!==i));
  const updateStop = (i, key, val) => setStops(prev => prev.map((s,idx)=>idx===i?{...s,[key]:val}:s));

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ ...form, stops });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:18, maxWidth:640, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:5 }}>
          <div style={{ fontWeight:800, fontSize:16 }}>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</div>
          <button onClick={onClose} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={15} /></button>
        </div>
        <form onSubmit={handleSave} style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>

          <Sec title="Vehicle Information" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="label">Vehicle Number *</label><input required className="input-field" placeholder="KA-01-F-1234" {...inp('vehicleNumber')} /></div>
            <Sel label="Vehicle Type *" value={form.vehicleType} onChange={e=>setForm(p=>({...p,vehicleType:e.target.value}))}>
              {VEHICLE_TYPES.map(t=><option key={t}>{t}</option>)}
            </Sel>
            <div><label className="label">Seating Capacity *</label><input required type="number" className="input-field" placeholder="50" {...inp('capacity')} /></div>
            <Sel label="Fuel Type" value={form.fuelType} onChange={e=>setForm(p=>({...p,fuelType:e.target.value}))}>
              {FUEL_TYPES.map(t=><option key={t}>{t}</option>)}
            </Sel>
            <div><label className="label">Purchase Year</label><input className="input-field" placeholder="2020" {...inp('purchaseYear')} /></div>
            <Sel label="Status" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              {['Active','Inactive','Maintenance'].map(s=><option key={s}>{s}</option>)}
            </Sel>
          </div>

          <Sec title="Driver & Conductor" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="label">Driver Name *</label><input required className="input-field" {...inp('driverName')} /></div>
            <div><label className="label">Driver Phone *</label><input required className="input-field" {...inp('driverPhone')} /></div>
            <div><label className="label">Conductor Name</label><input className="input-field" {...inp('conductorName')} /></div>
            <div><label className="label">Conductor Phone</label><input className="input-field" {...inp('conductorPhone')} /></div>
          </div>

          <Sec title="Route Information" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="label">Route Number</label><input className="input-field" placeholder="01" {...inp('routeNumber')} /></div>
            <div><label className="label">Route Name</label><input className="input-field" placeholder="North Route" {...inp('routeName')} /></div>
          </div>

          {/* Route stops */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#475569' }}>Route Stops</span>
              <button type="button" onClick={addStop}
                style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px dashed #93c5fd',
                  background:'#eff6ff', color:'#3b82f6', cursor:'pointer' }}>
                + Add Stop
              </button>
            </div>
            {stops.map((s, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, marginBottom:6, alignItems:'center' }}>
                <input className="input-field" placeholder={'Stop ' + (i+1) + ' name'} value={s.name}
                  onChange={e=>updateStop(i,'name',e.target.value)} style={{ fontSize:12 }} />
                <input className="input-field" placeholder="7:00 AM" value={s.time}
                  onChange={e=>updateStop(i,'time',e.target.value)} style={{ fontSize:12, width:90 }} />
                <button type="button" onClick={()=>removeStop(i)}
                  style={{ padding:6, background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {stops.length===0 && <div style={{ fontSize:12, color:'#94a3b8', padding:'8px 0' }}>No stops — click Add Stop</div>}
          </div>

          <Sec title="Document Expiry Dates" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="label">Insurance Expiry</label><input type="date" className="input-field" {...inp('insuranceExpiry')} /></div>
            <div><label className="label">Fitness Expiry</label><input type="date" className="input-field" {...inp('fitnessExpiry')} /></div>
            <div><label className="label">Permit Expiry</label><input type="date" className="input-field" {...inp('permitExpiry')} /></div>
            <div><label className="label">Pollution Expiry</label><input type="date" className="input-field" {...inp('pollutionExpiry')} /></div>
          </div>

          <div><label className="label">Notes</label><textarea className="input-field" rows={2} placeholder="Any notes about this vehicle..." {...inp('notes')} /></div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : editing ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vehicles Tab ──────────────────────────────────────────────────────────────
function VehiclesTab() {
  const [vehicles, setVehicles] = useState(DEMO_VEHICLES);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(VEHICLE_INIT);
  const [saving, setSaving]     = useState(false);

  const openAdd  = () => { setEditing(null); setForm(VEHICLE_INIT); setShowModal(true); };
  const openEdit = v => { setEditing(v); setForm(v); setShowModal(true); };

  const handleDelete = (id) => {
    if (!confirm('Delete this vehicle?')) return;
    setVehicles(prev => prev.filter(v => v._id !== id));
    toast.success('Vehicle deleted');
  };

  const handleSave = (data) => {
    setSaving(true);
    setTimeout(() => {
      if (editing) {
        setVehicles(prev => prev.map(v => v._id===editing._id ? { ...data, _id:editing._id } : v));
        toast.success('Vehicle updated');
      } else {
        setVehicles(prev => [...prev, { ...data, _id:Date.now().toString(), stops: data.stops||[] }]);
        toast.success('Vehicle added');
      }
      setShowModal(false); setSaving(false);
    }, 500);
  };

  const handleWhatsApp = (v, type) => {
    const raw = v.driverPhone?.replace(/\D/g,'');
    if (!raw) { toast.error('No driver phone saved'); return; }
    const ph = raw.startsWith('91') ? raw : '91'+raw;

    if (type === 'expiry') {
      const urgent = [
        { label:'Insurance', date: v.insuranceExpiry },
        { label:'Fitness',   date: v.fitnessExpiry   },
        { label:'Permit',    date: v.permitExpiry     },
        { label:'Pollution', date: v.pollutionExpiry  },
      ].filter(e => { const d = daysUntil(e.date); return d !== null && d < 30; });
      const msg = '🚌 *Document Expiry Reminder*\n' + SCHOOL.name + '\n\n'
        + 'Dear ' + v.driverName + ',\n\nThe following documents for vehicle *' + v.vehicleNumber + '* need attention:\n\n'
        + urgent.map(e => '⚠️ *' + e.label + '* — ' + new Date(e.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})).join('\n')
        + '\n\nPlease renew them at the earliest.\n\n📞 ' + SCHOOL.phone;
      window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    } else {
      window.open('https://wa.me/' + ph, '_blank');
    }
    toast.success('WhatsApp opened');
  };

  const filtered = vehicles.filter(v =>
    (!search || v.vehicleNumber.toLowerCase().includes(search.toLowerCase())
      || v.driverName.toLowerCase().includes(search.toLowerCase())
      || v.routeName.toLowerCase().includes(search.toLowerCase()))
    && (!statusFilter || v.status === statusFilter)
  );

  const activeCount = vehicles.filter(v=>v.status==='Active').length;
  const expiryAlerts = vehicles.filter(v =>
    [v.insuranceExpiry, v.fitnessExpiry, v.permitExpiry, v.pollutionExpiry]
      .some(d => { const x = daysUntil(d); return x !== null && x < 30; })
  ).length;

  return (
    <div className="space-y-4">
      {/* Expiry alert banner */}
      {expiryAlerts > 0 && (
        <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:10, padding:'10px 16px',
          display:'flex', alignItems:'center', gap:10 }}>
          <AlertCircle size={16} color="#d97706" />
          <span style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>
            {expiryAlerts} vehicle{expiryAlerts>1?'s':''} have documents expiring within 30 days!
          </span>
        </div>
      )}

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
        {[
          { label:'Total Vehicles',  value:vehicles.length,         color:'#3b82f6' },
          { label:'Active',          value:activeCount,             color:'#16a34a' },
          { label:'Maintenance',     value:vehicles.filter(v=>v.status==='Maintenance').length, color:'#d97706' },
          { label:'Expiry Alerts',   value:expiryAlerts,            color:'#ef4444' },
          { label:'Total Capacity',  value:vehicles.reduce((s,v)=>s+Number(v.capacity||0),0), color:'#8b5cf6' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'12px 14px', borderTop:'3px solid '+k.color }}>
            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:k.color, marginTop:3 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, flex:1, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="input-field" placeholder="Search vehicle, driver, route..." style={{ paddingLeft:28 }}
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <Sel value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Active','Inactive','Maintenance'].map(s=><option key={s}>{s}</option>)}
          </Sel>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Vehicle</button>
      </div>

      {/* Vehicle cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(v => (
          <VehicleCard key={v._id} v={v} onEdit={openEdit} onDelete={handleDelete} onWhatsApp={handleWhatsApp} />
        ))}
        {filtered.length===0 && (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
            <Bus size={32} style={{ margin:'0 auto 10px', opacity:.3 }} />
            <div>No vehicles found</div>
          </div>
        )}
      </div>

      {showModal && (
        <VehicleModal editing={editing} form={form} setForm={setForm}
          onSave={handleSave} onClose={()=>setShowModal(false)} saving={saving} />
      )}
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────────────────────
function StudentsTab({ vehicles }) {
  const [students]    = useState(DEMO_STUDENTS);
  const [search, setSearch]     = useState('');
  const [busFilter, setBusFilter] = useState('');

  const filtered = students.filter(s =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admNo.includes(search))
    && (!busFilter || s.vehicleId === busFilter)
  );

  const pendingFees = students.filter(s=>s.feeStatus!=='Paid');

  const notifyAll = () => {
    pendingFees.forEach((s, i) => {
      const raw = (s.parentPhone||'').replace(/\D/g,'');
      if (!raw) return;
      const ph = raw.startsWith('91') ? raw : '91'+raw;
      const msg = '🚌 *Transport Fee Reminder*\n' + SCHOOL.name + '\n\nDear Parent,\nTransport fee for *' + s.name + '* (Class ' + s.class + ') is *' + s.feeStatus + '*.\nPlease pay at the earliest.\n📞 ' + SCHOOL.phone;
      setTimeout(() => window.open('https://wa.me/'+ph+'?text='+encodeURIComponent(msg),'_blank'), i*900);
    });
    toast.success('Notifying ' + pendingFees.length + ' parent(s) via WhatsApp');
  };

  return (
    <div className="space-y-4">
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, flex:1 }}>
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="input-field" placeholder="Search student..." style={{ paddingLeft:28 }}
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <Sel value={busFilter} onChange={e=>setBusFilter(e.target.value)}>
            <option value="">All Vehicles</option>
            {vehicles.map(v=><option key={v._id} value={v._id}>{v.vehicleNumber} – {v.routeName}</option>)}
          </Sel>
        </div>
        {pendingFees.length > 0 && (
          <button onClick={notifyAll}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
              border:'1px solid #25D366', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <MessageCircle size={13} /> Notify {pendingFees.length} Pending ({pendingFees.length})
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>#</th><th>Student</th><th>Class</th><th>Vehicle</th><th>Route</th><th>Boarding Stop</th><th>Fee Status</th><th>WhatsApp</th></tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const v = vehicles.find(v=>v._id===s.vehicleId);
                const feeColor = s.feeStatus==='Paid' ? '#16a34a' : s.feeStatus==='Pending' ? '#d97706' : '#dc2626';
                const feeBg    = s.feeStatus==='Paid' ? '#dcfce7' : s.feeStatus==='Pending' ? '#fef9c3' : '#fee2e2';
                return (
                  <tr key={s._id}>
                    <td style={{ color:'#94a3b8' }}>{i+1}</td>
                    <td>
                      <div style={{ fontWeight:700 }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{s.admNo}</div>
                    </td>
                    <td>Class {s.class}</td>
                    <td style={{ fontSize:12 }}>{v?.vehicleNumber || '—'}</td>
                    <td style={{ fontSize:12 }}>{v?.routeName || '—'}</td>
                    <td style={{ fontSize:12 }}>{s.stop}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:feeBg, color:feeColor }}>
                        {s.feeStatus}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => {
                        const raw = (s.parentPhone||'').replace(/\D/g,'');
                        if (!raw) { toast.error('No phone'); return; }
                        const ph = raw.startsWith('91') ? raw : '91'+raw;
                        window.open('https://wa.me/'+ph, '_blank');
                        toast.success('Opening WhatsApp');
                      }}
                      style={{ padding:5, borderRadius:7, border:'1px solid #25D366', background:'#f0fdf4',
                        color: s.parentPhone ? '#16a34a' : '#cbd5e1',
                        cursor: s.parentPhone ? 'pointer' : 'not-allowed', display:'flex' }}>
                        <MessageCircle size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Fuel Log Tab ──────────────────────────────────────────────────────────────
function FuelLogTab({ vehicles }) {
  const [logs, setLogs]     = useState(DEMO_FUEL);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ vehicleId:'', date:new Date().toISOString().split('T')[0], liters:'', amount:'', odometer:'', filledBy:'' });
  const [saving, setSaving] = useState(false);
  const inp = f => ({ value:form[f]||'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})) });

  const totalSpent   = logs.reduce((s,l)=>s+l.amount,0);
  const totalLiters  = logs.reduce((s,l)=>s+l.liters,0);

  const handleAdd = (e) => {
    e.preventDefault(); setSaving(true);
    setTimeout(() => {
      setLogs(prev => [{ ...form, _id:Date.now().toString(), liters:Number(form.liters), amount:Number(form.amount), odometer:Number(form.odometer) }, ...prev]);
      toast.success('Fuel log added');
      setShowForm(false); setSaving(false);
      setForm({ vehicleId:'', date:new Date().toISOString().split('T')[0], liters:'', amount:'', odometer:'', filledBy:'' });
    }, 400);
  };

  const exportCSV = () => {
    const csv = 'Date,Vehicle,Liters,Amount,Odometer,Filled By\n'
      + logs.map(l => {
        const v = vehicles.find(v=>v._id===l.vehicleId);
        return '"'+(v?.vehicleNumber||l.vehicleId)+'","'+l.date+'",'+l.liters+','+l.amount+','+l.odometer+',"'+l.filledBy+'"';
      }).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download='fuel_log.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fuel log exported');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
        {[
          { label:'Total Spent',    value:'₹'+totalSpent.toLocaleString(), color:'#ef4444' },
          { label:'Total Liters',   value:totalLiters+'L',                 color:'#3b82f6' },
          { label:'Avg Cost/Liter', value:'₹'+(totalLiters?Math.round(totalSpent/totalLiters):0), color:'#8b5cf6' },
          { label:'Log Entries',    value:logs.length,                     color:'#16a34a' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'12px 14px', borderTop:'3px solid '+k.color }}>
            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:k.color, marginTop:3 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={exportCSV} className="btn-secondary"><Download size={14}/> Export CSV</button>
        <button onClick={()=>setShowForm(s=>!s)} className="btn-primary"><Plus size={14}/> Log Fuel</button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ padding:18 }}>
          <Sec title="Add Fuel Entry" />
          <form onSubmit={handleAdd} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Sel label="Vehicle *" required value={form.vehicleId} onChange={e=>setForm(p=>({...p,vehicleId:e.target.value}))}>
              <option value="">Select vehicle</option>
              {vehicles.map(v=><option key={v._id} value={v._id}>{v.vehicleNumber}</option>)}
            </Sel>
            <div><label className="label">Date *</label><input required type="date" className="input-field" {...inp('date')} /></div>
            <div><label className="label">Liters *</label><input required type="number" className="input-field" placeholder="60" {...inp('liters')} /></div>
            <div><label className="label">Amount (₹) *</label><input required type="number" className="input-field" placeholder="5400" {...inp('amount')} /></div>
            <div><label className="label">Odometer (km)</label><input type="number" className="input-field" placeholder="45200" {...inp('odometer')} /></div>
            <div><label className="label">Filled By</label><input className="input-field" placeholder="Driver name" {...inp('filledBy')} /></div>
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fuel log table */}
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Date</th><th>Vehicle</th><th>Liters</th><th>Amount</th><th>Odometer</th><th>Cost/L</th><th>Filled By</th></tr>
            </thead>
            <tbody>
              {logs.map(l => {
                const v = vehicles.find(v=>v._id===l.vehicleId);
                return (
                  <tr key={l._id}>
                    <td style={{ fontSize:12 }}>{new Date(l.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td>
                      <div style={{ fontWeight:700, fontSize:12 }}>{v?.vehicleNumber||'—'}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{v?.routeName||''}</div>
                    </td>
                    <td style={{ fontWeight:700, color:'#3b82f6' }}>{l.liters}L</td>
                    <td style={{ fontWeight:700, color:'#ef4444' }}>₹{l.amount.toLocaleString()}</td>
                    <td style={{ fontSize:12, color:'#64748b' }}>{l.odometer ? l.odometer.toLocaleString()+' km' : '—'}</td>
                    <td style={{ fontWeight:600 }}>₹{l.liters ? Math.round(l.amount/l.liters) : '—'}/L</td>
                    <td style={{ fontSize:12 }}>{l.filledBy||'—'}</td>
                  </tr>
                );
              })}
              {logs.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No fuel entries yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Pickup Points Tab ─────────────────────────────────────────────────────────
function PickupPointsTab({ vehicles }) {
  const allStops = vehicles.flatMap(v =>
    (v.stops||[]).map(s => ({ ...s, vehicle: v.vehicleNumber, route: v.routeName, vehicleId: v._id }))
  );
  return (
    <div className="space-y-4">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
        <div className="card" style={{ padding:'12px 14px', borderTop:'3px solid #3b82f6' }}>
          <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>Total Stops</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#3b82f6', marginTop:3 }}>{allStops.length}</div>
        </div>
        <div className="card" style={{ padding:'12px 14px', borderTop:'3px solid #16a34a' }}>
          <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>Routes</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#16a34a', marginTop:3 }}>{vehicles.length}</div>
        </div>
      </div>
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead><tr><th>#</th><th>Stop Name</th><th>Pickup Time</th><th>Vehicle</th><th>Route</th></tr></thead>
            <tbody>
              {allStops.map((s, i) => (
                <tr key={i}>
                  <td style={{ color:'#94a3b8' }}>{i+1}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <MapPin size={13} color="#3b82f6" />
                      <span style={{ fontWeight:600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontWeight:700, color:'#3b82f6' }}>{s.time}</span></td>
                  <td style={{ fontSize:12 }}>{s.vehicle}</td>
                  <td style={{ fontSize:12, color:'#64748b' }}>{s.route}</td>
                </tr>
              ))}
              {allStops.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No pickup points — add stops to vehicles</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Transport page ───────────────────────────────────────────────────────
export default function Transport() {
  const [tab, setTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState(DEMO_VEHICLES);

  const TABS = [
    { id:'vehicles',    label:'Vehicle List',   icon: Bus        },
    { id:'students',    label:'Student Routes', icon: Users      },
    { id:'fuel',        label:'Fuel Log',       icon: Fuel       },
    { id:'pickup',      label:'Pickup Points',  icon: MapPin     },
  ];

  const totalCapacity  = vehicles.reduce((s,v)=>s+Number(v.capacity||0),0);
  const activeVehicles = vehicles.filter(v=>v.status==='Active').length;
  const allStops       = vehicles.flatMap(v=>v.stops||[]);
  const expiryAlerts   = vehicles.filter(v =>
    [v.insuranceExpiry,v.fitnessExpiry,v.permitExpiry,v.pollutionExpiry]
      .some(d=>{ const x=daysUntil(d); return x!==null && x<30; })
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
          <p className="text-gray-500 text-sm">
            {vehicles.length} vehicles · {activeVehicles} active · {allStops.length} pickup points
            {expiryAlerts > 0 && <span style={{ color:'#d97706', fontWeight:700 }}> · ⚠️ {expiryAlerts} expiry alert{expiryAlerts>1?'s':''}</span>}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
        {[
          { label:'Total Vehicles',  value:vehicles.length,  color:'#3b82f6', icon:Bus        },
          { label:'Active Vehicles', value:activeVehicles,   color:'#16a34a', icon:CheckCircle},
          { label:'Total Capacity',  value:totalCapacity,    color:'#8b5cf6', icon:Users      },
          { label:'Pickup Points',   value:allStops.length,  color:'#06b6d4', icon:MapPin     },
          { label:'Expiry Alerts',   value:expiryAlerts,     color:'#ef4444', icon:AlertCircle},
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'14px 16px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color }} />
            <div style={{ background:k.color+'18', borderRadius:9, padding:9, flexShrink:0 }}>
              <k.icon size={17} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid #f1f5f9' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px',
              border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent',
              color:       tab===t.id ? '#1e40af' : '#64748b',
              borderBottom: tab===t.id ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom:'-2px' }}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {tab==='vehicles' && <VehiclesTab />}
      {tab==='students' && <StudentsTab vehicles={vehicles} />}
      {tab==='fuel'     && <FuelLogTab  vehicles={vehicles} />}
      {tab==='pickup'   && <PickupPointsTab vehicles={vehicles} />}
    </div>
  );
}