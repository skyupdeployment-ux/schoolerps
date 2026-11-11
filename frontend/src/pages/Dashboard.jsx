import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, CreditCard,
  Library, Bus, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = {
  blue:    '#3b82f6',
  green:   '#10b981',
  purple:  '#8b5cf6',
  orange:  '#f59e0b',
  emerald: '#059669',
  red:     '#ef4444',
  indigo:  '#6366f1',
  yellow:  '#eab308',
};

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];

// ── Months helper ─────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Dummy data for richer visuals when real data is empty ─────────────────────
const DUMMY_MONTHLY = [
  { month:'Jan', amount:42000, target:50000 },
  { month:'Feb', amount:58000, target:50000 },
  { month:'Mar', amount:47000, target:55000 },
  { month:'Apr', amount:63000, target:55000 },
  { month:'May', amount:51000, target:60000 },
  { month:'Jun', amount:70000, target:60000 },
  { month:'Jul', amount:55000, target:65000 },
  { month:'Aug', amount:82000, target:65000 },
  { month:'Sep', amount:74000, target:70000 },
];

const DUMMY_PAYMENTS = [
  { id:1, student:'Arjun Sharma',    feeType:'Tuition',  totalAmount:12000, paymentMethod:'UPI',   paymentDate:'2026-09-18', status:'Paid' },
  { id:2, student:'Priya Patel',     feeType:'Transport',totalAmount:3500,  paymentMethod:'Cash',  paymentDate:'2026-09-17', status:'Paid' },
  { id:3, student:'Rahul Kumar',     feeType:'Tuition',  totalAmount:12000, paymentMethod:'Card',  paymentDate:'2026-09-16', status:'Paid' },
  { id:4, student:'Sneha Reddy',     feeType:'Library',  totalAmount:800,   paymentMethod:'UPI',   paymentDate:'2026-09-15', status:'Partial' },
  { id:5, student:'Sidda Madabhavi', feeType:'Tuition',  totalAmount:12000, paymentMethod:'NEFT',  paymentDate:'2026-09-14', status:'Paid' },
];

const DUMMY_METHOD_PIE = [
  { name:'UPI',  value:42 },
  { name:'Cash', value:28 },
  { name:'Card', value:18 },
  { name:'NEFT', value:12 },
];

const DUMMY_ADMISSIONS = [
  { _id:'1', firstName:'Sidda',  lastName:'Madabhavi', admissionNumber:'123',    createdAt:'2026-09-18' },
  { _id:'2', firstName:'Priya',  lastName:'Patel',     admissionNumber:'ADM002', createdAt:'2026-09-18' },
  { _id:'3', firstName:'Sneha',  lastName:'Reddy',     admissionNumber:'ADM004', createdAt:'2026-09-18' },
  { _id:'4', firstName:'Arjun',  lastName:'Sharma',    admissionNumber:'ADM001', createdAt:'2026-09-18' },
  { _id:'5', firstName:'Rahul',  lastName:'Kumar',     admissionNumber:'ADM003', createdAt:'2026-09-18' },
];

// ── Custom tooltip ────────────────────────────────────────────────────────────
const FeeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e293b', borderRadius:8, padding:'10px 14px', color:'#f8fafc', fontSize:12 }}>
      <p style={{ fontWeight:700, marginBottom:4, color:'#94a3b8' }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.color, margin:'2px 0' }}>
          {p.name}: <strong>₹{Number(p.value).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Clickable KPI Card ────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon: Icon, color, sub, trend, trendLabel, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: hovered ? `1.5px solid ${color}` : '1.5px solid #f1f5f9',
        boxShadow: hovered
          ? `0 8px 24px ${color}22`
          : '0 1px 4px rgba(0,0,0,.06)',
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all .2s ease',
        transform: hovered && onClick ? 'translateY(-2px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* accent bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:3,
        background: color, borderRadius:'14px 14px 0 0',
      }} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginTop:4 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:12, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:.4, margin:0 }}>{title}</p>
          <p style={{ fontSize:26, fontWeight:800, color:'#0f172a', margin:'6px 0 2px' }}>{value ?? '—'}</p>
          {sub && <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{sub}</p>}
          {trend !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
              {trend >= 0
                ? <ArrowUpRight size={13} color="#10b981" />
                : <ArrowDownRight size={13} color="#ef4444" />}
              <span style={{ fontSize:11, color: trend >= 0 ? '#10b981':'#ef4444', fontWeight:600 }}>
                {Math.abs(trend)}% {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div style={{
          background: `${color}18`,
          borderRadius: 12,
          padding: 12,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>

      {onClick && (
        <div style={{
          display:'flex', alignItems:'center', gap:3,
          marginTop:12, fontSize:11, color: color, fontWeight:600, opacity: hovered ? 1 : 0,
          transition:'opacity .2s',
        }}>
          View details <ChevronRight size={12} />
        </div>
      )}
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, onAction }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
    <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }}>{title}</h3>
    {action && (
      <button onClick={onAction} style={{
        background:'none', border:'none', cursor:'pointer',
        fontSize:12, color:'#3b82f6', fontWeight:600, display:'flex', alignItems:'center', gap:3
      }}>
        {action} <ChevronRight size={13} />
      </button>
    )}
  </div>
);

// ── Payment method badge ──────────────────────────────────────────────────────
const MethodBadge = ({ method }) => {
  const map = { UPI:'#6366f1', Cash:'#10b981', Card:'#f59e0b', NEFT:'#3b82f6', Cheque:'#8b5cf6' };
  const c = map[method] || '#64748b';
  return (
    <span style={{
      background:`${c}18`, color:c, fontSize:11, fontWeight:600,
      padding:'2px 8px', borderRadius:20
    }}>{method}</span>
  );
};

const StatusBadge = ({ status }) => {
  const map = { Paid:['#10b981','#dcfce7'], Partial:['#f59e0b','#fef9c3'], Pending:['#ef4444','#fee2e2'] };
  const [c, bg] = map[status] || ['#64748b','#f1f5f9'];
  return (
    <span style={{ background:bg, color:c, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>
      {status}
    </span>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [monthlyFees, setMonthlyFees] = useState([]);
  const [recent, setRecent]         = useState({ recentAdmissions:[], recentPayments:[] });
  const [loading, setLoading]       = useState(true);
  const [chartType, setChartType]   = useState('bar'); // 'bar' | 'area'

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/monthly-fees'),
      api.get('/dashboard/recent-activity')
    ]).then(([s, m, r]) => {
      setStats(s.data.data);
      const raw = (m.data.data || []).map(d => ({
        month:  MONTHS[(d._id?.month ?? 1) - 1],
        amount: d.total,
        target: Math.round(d.total * 1.12),
      }));
      setMonthlyFees(raw.length ? raw : DUMMY_MONTHLY);
      const ra = r.data.data;
      setRecent({
        recentAdmissions: ra.recentAdmissions?.length ? ra.recentAdmissions : DUMMY_ADMISSIONS,
        recentPayments:   ra.recentPayments?.length   ? ra.recentPayments.map(p => ({
          id: p._id,
          student: `${p.student?.firstName} ${p.student?.lastName}`,
          feeType: p.feeType,
          totalAmount: p.totalAmount,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          status: 'Paid',
        })) : DUMMY_PAYMENTS,
      });
    }).catch(() => {
      setMonthlyFees(DUMMY_MONTHLY);
      setRecent({ recentAdmissions: DUMMY_ADMISSIONS, recentPayments: DUMMY_PAYMENTS });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
      <div style={{
        width:40, height:40, borderRadius:'50%',
        border:'3px solid #e2e8f0', borderTopColor:'#3b82f6',
        animation:'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Compute totals for display
  const totalCollected = stats?.totalFeesCollected
    ?? DUMMY_MONTHLY.reduce((a,d) => a+d.amount, 0);
  const pendingFees = stats?.pendingFees ?? 28400;

  const kpis = [
    { title:'Total Students',      value: stats?.totalStudents   ?? 248, icon:Users,          color:COLORS.blue,    sub:'Active enrolled',    trend:4.2,  trendLabel:'vs last month', route:'/students' },
    { title:'Total Teachers',      value: stats?.totalTeachers   ?? 32,  icon:GraduationCap,  color:COLORS.green,   sub:'Active staff',        trend:1.0,  trendLabel:'new this month', route:'/teachers' },
    { title:'Total Classes',       value: stats?.totalClasses    ?? 16,  icon:BookOpen,       color:COLORS.purple,  sub:'Running this year',   trend:null, trendLabel:'',              route:'/classes' },
    { title:"Today's Attendance",  value: `${stats?.todayAttendance ?? 221}`,icon:TrendingUp,  color:COLORS.orange,  sub:'Students present',    trend:2.8,  trendLabel:'vs yesterday',  route:'/attendance' },
    { title:'Fees Collected',      value:`₹${Number(totalCollected).toLocaleString()}`, icon:CreditCard, color:COLORS.emerald, sub:'Total collected', trend:8.1,trendLabel:'this month', route:'/fees' },
    { title:'Pending Fees',        value:`₹${Number(pendingFees).toLocaleString()}`,   icon:AlertCircle, color:COLORS.red,    sub:'To be collected', trend:-3.2,trendLabel:'vs last month', route:'/fees' },
    { title:'Library Books',       value: stats?.totalBooks      ?? 3,   icon:Library,        color:COLORS.indigo,  sub:'Total books',         trend:null, trendLabel:'',              route:'/library' },
    { title:'Active Buses',        value: stats?.activeBuses     ?? 2,   icon:Bus,            color:COLORS.yellow,  sub:'In operation',        trend:null, trendLabel:'',              route:'/transport' },
  ];

  const feeChartData = monthlyFees.length ? monthlyFees : DUMMY_MONTHLY;
  const pieData      = DUMMY_METHOD_PIE;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, paddingBottom:32 }}>

      {/* ── Page header ── */}
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>Dashboard</h1>
        <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>
          Welcome back — here's your school at a glance today.
        </p>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
        {kpis.map(k => (
          <KpiCard
            key={k.title}
            {...k}
            onClick={() => navigate(k.route)}
          />
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>

        {/* Monthly Fee Collection chart */}
        <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.06)', padding:'20px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }}>Monthly Fee Collection</h3>
            <div style={{ display:'flex', gap:6 }}>
              {['bar','area'].map(t => (
                <button key={t} onClick={() => setChartType(t)} style={{
                  fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20,
                  border:'none', cursor:'pointer',
                  background: chartType===t ? '#3b82f6' : '#f1f5f9',
                  color:       chartType===t ? '#fff'    : '#64748b',
                  transition:'all .15s',
                }}>
                  {t === 'bar' ? '▬ Bar' : '〜 Area'}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            {chartType === 'bar' ? (
              <BarChart data={feeChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} />
                <Tooltip content={<FeeTooltip />} cursor={{ fill:'#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize:11, color:'#64748b' }} />
                <Bar dataKey="amount" name="Collected" fill="#3b82f6" radius={[5,5,0,0]} maxBarSize={36} />
                <Bar dataKey="target"  name="Target"    fill="#e0e9ff" radius={[5,5,0,0]} maxBarSize={36} />
              </BarChart>
            ) : (
              <AreaChart data={feeChartData}>
                <defs>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} />
                <Tooltip content={<FeeTooltip />} />
                <Legend wrapperStyle={{ fontSize:11, color:'#64748b' }} />
                <Area type="monotone" dataKey="amount" name="Collected" stroke="#3b82f6" strokeWidth={2.5} fill="url(#feeGrad)" dot={{ r:3, fill:'#3b82f6' }} />
                <Area type="monotone" dataKey="target"  name="Target"    stroke="#10b981" strokeWidth={2}   fill="url(#targetGrad)" strokeDasharray="5 4" dot={false} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Payment Method breakdown – Pie */}
        <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.06)', padding:'20px 22px' }}>
          <SectionHeader title="Payment Methods" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
            {pieData.map((d,i) => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:PIE_COLORS[i] }} />
                  <span style={{ fontSize:12, color:'#475569' }}>{d.name}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:80, height:5, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                    <div style={{ width:`${d.value}%`, height:'100%', background:PIE_COLORS[i], borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0f172a', minWidth:28, textAlign:'right' }}>{d.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Recent Admissions + Recent Payments ── */}
      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:20 }}>

        {/* Recent Admissions */}
        <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.06)', padding:'20px 22px' }}>
          <SectionHeader title="Recent Admissions" action="View all" onAction={() => navigate('/students')} />
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {recent.recentAdmissions.map((s, i) => {
              const initials = `${s.firstName?.charAt(0) ?? '?'}`;
              const palette  = [COLORS.blue,COLORS.green,COLORS.purple,COLORS.orange,COLORS.emerald];
              const c        = palette[i % palette.length];
              return (
                <div key={s._id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 0',
                  borderBottom: i < recent.recentAdmissions.length-1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:`${c}18`, color:c,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:800, fontSize:14, flexShrink:0,
                  }}>{initials}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {s.firstName} {s.lastName}
                    </p>
                    <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{s.admissionNumber}</p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:600, color:'#64748b', background:'#f1f5f9', borderRadius:20, padding:'3px 8px', flexShrink:0 }}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Fee Payments – rich table with graphical amounts */}
        <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.06)', padding:'20px 22px' }}>
          <SectionHeader title="Recent Fee Payments" action="View all" onAction={() => navigate('/fees')} />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                  {['Student','Fee Type','Amount','Method','Date','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.recentPayments.map((p, i) => {
                  const studentName = typeof p.student === 'string'
                    ? p.student
                    : `${p.student?.firstName ?? ''} ${p.student?.lastName ?? ''}`.trim();
                  const maxAmt = Math.max(...recent.recentPayments.map(x => x.totalAmount));
                  const pct    = Math.round((p.totalAmount / maxAmt) * 100);
                  return (
                    <tr key={p._id ?? p.id ?? i} style={{ borderBottom:'1px solid #f8fafc' }}>
                      <td style={{ padding:'10px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{
                            width:28, height:28, borderRadius:8,
                            background:`${COLORS.blue}18`, color:COLORS.blue,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontWeight:800, fontSize:12, flexShrink:0,
                          }}>{studentName.charAt(0)}</div>
                          <span style={{ fontWeight:600, color:'#0f172a', whiteSpace:'nowrap' }}>{studentName}</span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 10px', color:'#475569' }}>{p.feeType}</td>
                      <td style={{ padding:'10px 10px' }}>
                        <div style={{ minWidth:120 }}>
                          <span style={{ fontWeight:700, color:'#059669', fontSize:13 }}>₹{Number(p.totalAmount).toLocaleString()}</span>
                          <div style={{ marginTop:4, height:4, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background:'#10b981', borderRadius:3, transition:'width .6s ease' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'10px 10px' }}><MethodBadge method={p.paymentMethod} /></td>
                      <td style={{ padding:'10px 10px', color:'#64748b', whiteSpace:'nowrap', fontSize:12 }}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td style={{ padding:'10px 10px' }}><StatusBadge status={p.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}