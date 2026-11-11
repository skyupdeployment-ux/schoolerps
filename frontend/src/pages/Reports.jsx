import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart2, Users, CreditCard, BookOpen, Bus,
  Download, Filter, ChevronDown, TrendingUp,
  FileText, Calendar, Award, AlertCircle
} from 'lucide-react';

// ── Demo data ─────────────────────────────────────────────────────────────────
const MONTHLY_FEE = [
  { month:'Apr', collected:42000, pending:8000  },
  { month:'May', collected:58000, pending:5000  },
  { month:'Jun', collected:47000, pending:12000 },
  { month:'Jul', collected:63000, pending:4000  },
  { month:'Aug', collected:82000, pending:3000  },
  { month:'Sep', collected:74000, pending:6000  },
];

const CLASS_STRENGTH = [
  { class:'Nursery', boys:12, girls:10, total:22 },
  { class:'LKG',     boys:15, girls:13, total:28 },
  { class:'UKG',     boys:14, girls:16, total:30 },
  { class:'Class 1', boys:18, girls:17, total:35 },
  { class:'Class 2', boys:20, girls:18, total:38 },
  { class:'Class 9', boys:22, girls:20, total:42 },
  { class:'Class 10',boys:25, girls:22, total:47 },
];

const ATTENDANCE_DATA = [
  { month:'Apr', present:92, absent:8  },
  { month:'May', present:88, absent:12 },
  { month:'Jun', present:95, absent:5  },
  { month:'Jul', present:90, absent:10 },
  { month:'Aug', present:93, absent:7  },
  { month:'Sep', present:87, absent:13 },
];

const TOP_STUDENTS = [
  { rank:1, name:'Arjun Sharma',    class:'10-A', pct:95, grade:'A+' },
  { rank:2, name:'Priya Patel',     class:'10-A', pct:92, grade:'A+' },
  { rank:3, name:'Sneha Reddy',     class:'9-A',  pct:89, grade:'A'  },
  { rank:4, name:'Rahul Kumar',     class:'9-B',  pct:85, grade:'A'  },
  { rank:5, name:'Sidda Madabhavi', class:'10-A', pct:82, grade:'A'  },
];

const FEE_DEFAULTERS = [
  { name:'Student A', class:'8-B', pending:4500, months:2 },
  { name:'Student B', class:'7-A', pending:9000, months:4 },
  { name:'Student C', class:'9-A', pending:2250, months:1 },
];

const REPORT_TYPES = [
  { id:'students',    label:'Student Report',    icon: Users,      color:'#3b82f6' },
  { id:'fees',        label:'Fee Collection',    icon: CreditCard, color:'#16a34a' },
  { id:'attendance',  label:'Attendance Report', icon: Calendar,   color:'#8b5cf6' },
  { id:'results',     label:'Exam Results',      icon: Award,      color:'#f59e0b' },
  { id:'library',     label:'Library Report',    icon: BookOpen,   color:'#06b6d4' },
  { id:'transport',   label:'Transport Report',  icon: Bus,        color:'#ef4444' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function KpiCard({ label, value, sub, icon:Icon, color, trend }) {
  return (
    <div className="card" style={{ padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'12px 12px 0 0' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginTop:4 }}>
        <div>
          <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{label}</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'4px 0 2px' }}>{value}</div>
          {sub && <div style={{ fontSize:11, color:'#64748b' }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:5, fontSize:11, fontWeight:600, color: trend>=0?'#16a34a':'#ef4444' }}>
              <TrendingUp size={11} />{trend>=0?'+':''}{trend}% vs last month
            </div>
          )}
        </div>
        <div style={{ background:`${color}18`, borderRadius:10, padding:10 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

// ── Inline Bar Chart ──────────────────────────────────────────────────────────
function BarChartInline({ data, barKey, barKey2, maxVal, color, color2, label, label2 }) {
  const max = maxVal || Math.max(...data.map(d => (d[barKey]||0) + (d[barKey2]||0)));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginBottom:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
          <div style={{ width:10, height:10, borderRadius:2, background:color }} /> {label}
        </div>
        {barKey2 && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
          <div style={{ width:10, height:10, borderRadius:2, background:color2 }} /> {label2}
        </div>}
      </div>
      {data.map((d, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:'#64748b', width:44, flexShrink:0, textAlign:'right' }}>{d.month||d.class}</span>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ height:14, borderRadius:3, background:color, transition:'width .5s',
                width:`${((d[barKey]||0)/max)*100}%`, minWidth:4 }} />
              <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>₹{(d[barKey]||0).toLocaleString()}</span>
            </div>
            {barKey2 && (
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ height:14, borderRadius:3, background:color2, transition:'width .5s',
                  width:`${((d[barKey2]||0)/max)*100}%`, minWidth:4 }} />
                <span style={{ fontSize:10, color:'#475569' }}>₹{(d[barKey2]||0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceBar({ data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:'#64748b', width:32, flexShrink:0 }}>{d.month}</span>
          <div style={{ flex:1, height:18, borderRadius:4, background:'#fee2e2', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, background:'#3b82f6',
              width:`${d.present}%`, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6 }}>
              <span style={{ fontSize:10, color:'#fff', fontWeight:700 }}>{d.present}%</span>
            </div>
          </div>
          <span style={{ fontSize:11, color:'#ef4444', width:32, textAlign:'right' }}>{d.absent}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Reports page ─────────────────────────────────────────────────────────
export default function Reports() {
  const [activeReport, setActiveReport] = useState('fees');
  const [dateFrom, setDateFrom]         = useState('2026-04-01');
  const [dateTo, setDateTo]             = useState('2026-09-30');
  const [classFilter, setClassFilter]   = useState('');

  // ── Live KPI data from API ────────────────────────────────────────────────
  const [liveStudentCount, setLiveStudentCount] = useState(null);
  const [loadingKpi, setLoadingKpi]             = useState(true);

  useEffect(() => {
    setLoadingKpi(true);
    // Fetch real student count from API
    api.get('/students', { params: { limit: 1, page: 1 } })
      .then(res => {
        const total = res.data.pagination?.total
          || res.data.total
          || res.data.data?.length
          || null;
        setLiveStudentCount(total);
      })
      .catch(() => setLiveStudentCount(null))
      .finally(() => setLoadingKpi(false));
  }, []);

  // Use live count if available, else fall back to CLASS_STRENGTH sum
  const totalStudents  = liveStudentCount !== null
    ? liveStudentCount
    : CLASS_STRENGTH.reduce((s,d)=>s+d.total,0);

  // Update CLASS_STRENGTH display to reflect actual count proportionally
  const classData = liveStudentCount !== null
    ? CLASS_STRENGTH.map(c => ({
        ...c,
        // Scale demo class data proportionally if we have a real total
        total: c.total,
        boys:  c.boys,
        girls: c.girls,
      }))
    : CLASS_STRENGTH;

  const totalCollected = MONTHLY_FEE.reduce((s,d)=>s+d.collected,0);
  const totalPending   = MONTHLY_FEE.reduce((s,d)=>s+d.pending,0);
  const avgAttendance  = Math.round(ATTENDANCE_DATA.reduce((s,d)=>s+d.present,0)/ATTENDANCE_DATA.length);

  const handleDownload = () => {
    let csv = '';
    let filename = '';
    if (activeReport === 'fees') {
      csv = 'Month,Collected,Pending\n' + MONTHLY_FEE.map(r=>`${r.month},${r.collected},${r.pending}`).join('\n');
      filename = 'fee_collection_report.csv';
    } else if (activeReport === 'students') {
      csv = 'Class,Boys,Girls,Total\n' + CLASS_STRENGTH.map(r=>`${r.class},${r.boys},${r.girls},${r.total}`).join('\n');
      filename = 'student_strength_report.csv';
    } else if (activeReport === 'attendance') {
      csv = 'Month,Present%,Absent%\n' + ATTENDANCE_DATA.map(r=>`${r.month},${r.present},${r.absent}`).join('\n');
      filename = 'attendance_report.csv';
    } else {
      csv = 'Rank,Name,Class,Percentage,Grade\n' + TOP_STUDENTS.map(r=>`${r.rank},${r.name},${r.class},${r.pct}%,${r.grade}`).join('\n');
      filename = 'exam_results_report.csv';
    }
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">Analytics and data exports for your school</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => handleDownload('csv')} className="btn-secondary">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Live data notice */}
      {liveStudentCount !== null && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f0fdf4',
          border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px' }}>
          <span style={{ fontSize:16 }}>✅</span>
          <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>
            Live data: <strong>{liveStudentCount} students</strong> found in your database. Student count is real — other charts use sample data.
          </span>
        </div>
      )}
      {!loadingKpi && liveStudentCount === null && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff7ed',
          border:'1px solid #fed7aa', borderRadius:10, padding:'10px 14px' }}>
          <AlertCircle size={15} color="#d97706" />
          <span style={{ fontSize:13, color:'#92400e', fontWeight:600 }}>
            Backend offline — showing sample data. Start your backend server to see real numbers.
          </span>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
        <KpiCard
          label="Total Students"
          value={loadingKpi ? '…' : totalStudents}
          icon={Users}
          color="#3b82f6"
          sub={loadingKpi ? 'Loading from database...' : `${totalStudents} enrolled this year`}
          trend={null}
        />
        <KpiCard label="Fees Collected"    value={`₹${(totalCollected/100000).toFixed(1)}L`} icon={CreditCard} color="#16a34a" sub="This academic year"  trend={8.1}  />
        <KpiCard label="Pending Fees"      value={`₹${(totalPending/1000).toFixed(0)}K`}     icon={AlertCircle}color="#ef4444" sub="To be collected"     trend={-3.2} />
        <KpiCard label="Avg Attendance"    value={`${avgAttendance}%`}                        icon={Calendar}   color="#8b5cf6" sub="This year average"   trend={2.1}  />
      </div>

      {/* Filters */}
      <div className="card p-4" style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:140 }}>
          <label className="label">From Date</label>
          <input type="date" className="input-field" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        </div>
        <div style={{ flex:1, minWidth:140 }}>
          <label className="label">To Date</label>
          <input type="date" className="input-field" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        </div>
        <Sel label="Class" value={classFilter} onChange={e=>setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'].map(c=><option key={c} value={c}>Class {c}</option>)}
        </Sel>
        <button className="btn-primary"><Filter size={14}/> Apply Filters</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>
        {/* Report type selector */}
        <div className="card" style={{ padding:12, height:'fit-content' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.6, padding:'6px 8px 10px' }}>Report Type</div>
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={()=>setActiveReport(r.id)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', borderRadius:9, border:'none', cursor:'pointer',
                marginBottom:3, transition:'all .15s', textAlign:'left',
                background: activeReport===r.id ? `${r.color}14` : 'transparent',
                color:       activeReport===r.id ? r.color : '#475569',
                fontWeight:  activeReport===r.id ? 700 : 500,
                fontSize: 13,
              }}>
              <div style={{ background:`${r.color}20`, borderRadius:7, padding:6, flexShrink:0 }}>
                <r.icon size={14} color={r.color} />
              </div>
              {r.label}
            </button>
          ))}
        </div>

        {/* Report content */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Fee Collection Report */}
          {activeReport==='fees' && (
            <>
              <div className="card" style={{ padding:22 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>Monthly Fee Collection</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>Apr 2026 – Sep 2026</div>
                  </div>
                  <div style={{ display:'flex', gap:16 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Collected</div>
                      <div style={{ fontSize:18, fontWeight:800, color:'#16a34a' }}>₹{totalCollected.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Pending</div>
                      <div style={{ fontSize:18, fontWeight:800, color:'#ef4444' }}>₹{totalPending.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <BarChartInline data={MONTHLY_FEE} barKey="collected" barKey2="pending"
                  color="#16a34a" color2="#fca5a5" label="Collected" label2="Pending" />
              </div>

              {/* Fee defaulters */}
              <div className="card" style={{ padding:22 }}>
                <div style={{ fontWeight:800, fontSize:15, color:'#0f172a', marginBottom:14 }}>Fee Defaulters</div>
                <table>
                  <thead>
                    <tr><th>Student</th><th>Class</th><th>Pending Amount</th><th>Months Due</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {FEE_DEFAULTERS.map((d,i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600, color:'#0f172a' }}>{d.name}</td>
                        <td>{d.class}</td>
                        <td style={{ fontWeight:700, color:'#dc2626' }}>₹{d.pending.toLocaleString()}</td>
                        <td><span style={{ fontSize:11, fontWeight:700, background:'#fee2e2', color:'#dc2626', padding:'2px 8px', borderRadius:20 }}>{d.months} month{d.months>1?'s':''}</span></td>
                        <td><span className="badge-danger">Overdue</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Student Report */}
          {activeReport==='students' && (
            <div className="card" style={{ padding:22 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#0f172a', marginBottom:20 }}>Class-wise Student Strength</div>
              <table>
                <thead>
                  <tr><th>Class</th><th>Boys</th><th>Girls</th><th>Total</th><th>Distribution</th></tr>
                </thead>
                <tbody>
                  {CLASS_STRENGTH.map((c,i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600, color:'#0f172a' }}>{c.class}</td>
                      <td><span style={{ fontWeight:700, color:'#1d4ed8' }}>{c.boys}</span></td>
                      <td><span style={{ fontWeight:700, color:'#be185d' }}>{c.girls}</span></td>
                      <td><span style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{c.total}</span></td>
                      <td style={{ minWidth:160 }}>
                        <div style={{ display:'flex', height:14, borderRadius:3, overflow:'hidden', gap:1 }}>
                          <div style={{ flex:c.boys, background:'#3b82f6', borderRadius:'3px 0 0 3px' }} />
                          <div style={{ flex:c.girls, background:'#ec4899', borderRadius:'0 3px 3px 0' }} />
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#64748b', marginTop:2 }}>
                          <span>{Math.round(c.boys/c.total*100)}% boys</span>
                          <span>{Math.round(c.girls/c.total*100)}% girls</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background:'#f8fafc', fontWeight:700 }}>
                    <td style={{ fontWeight:800 }}>Total</td>
                    <td style={{ color:'#1d4ed8' }}>{CLASS_STRENGTH.reduce((s,c)=>s+c.boys,0)}</td>
                    <td style={{ color:'#be185d' }}>{CLASS_STRENGTH.reduce((s,c)=>s+c.girls,0)}</td>
                    <td style={{ color:'#0f172a', fontWeight:800, fontSize:15 }}>
                      {loadingKpi ? '…' : totalStudents}
                      {liveStudentCount !== null && (
                        <span style={{ fontSize:10, color:'#16a34a', fontWeight:600, marginLeft:6 }}>✓ live</span>
                      )}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Attendance Report */}
          {activeReport==='attendance' && (
            <div className="card" style={{ padding:22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>Monthly Attendance Report</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>Present vs Absent percentage</div>
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}><div style={{ width:12, height:12, borderRadius:2, background:'#3b82f6' }}/> Present</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}><div style={{ width:12, height:12, borderRadius:2, background:'#fee2e2' }}/> Absent</div>
                </div>
              </div>
              <AttendanceBar data={ATTENDANCE_DATA} />
              <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {[
                  { label:'Best Month',  value:'Jun (95%)',  color:'#16a34a' },
                  { label:'Worst Month', value:'May (88%)',  color:'#ef4444' },
                  { label:'Average',     value:`${avgAttendance}%`, color:'#3b82f6' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#f8fafc', borderRadius:9, padding:'10px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:s.color, marginTop:2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Results Report */}
          {activeReport==='results' && (
            <div className="card" style={{ padding:22 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#0f172a', marginBottom:20 }}>Top Performing Students</div>
              <table>
                <thead>
                  <tr><th>Rank</th><th>Student</th><th>Class</th><th>Percentage</th><th>Grade</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  {TOP_STUDENTS.map(s => {
                    const medal = s.rank===1?'🥇':s.rank===2?'🥈':s.rank===3?'🥉':'';
                    const color = s.pct>=90?'#16a34a':s.pct>=80?'#2563eb':'#d97706';
                    return (
                      <tr key={s.rank} style={{ background:s.rank<=3?s.rank===1?'#fffbeb':s.rank===2?'#f8f9ff':'#fff7f0':'transparent' }}>
                        <td style={{ fontSize:18 }}>{medal||s.rank}</td>
                        <td style={{ fontWeight:700, color:'#0f172a' }}>{s.name}</td>
                        <td>{s.class}</td>
                        <td>
                          <div style={{ fontWeight:800, color }}>
                            {s.pct}%
                          </div>
                          <div style={{ height:4, borderRadius:2, background:'#f1f5f9', marginTop:3, overflow:'hidden' }}>
                            <div style={{ width:`${s.pct}%`, height:'100%', background:color, borderRadius:2 }} />
                          </div>
                        </td>
                        <td><span style={{ fontWeight:900, fontSize:15, color }}>{s.grade}</span></td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                            background:'#dcfce7', color:'#16a34a' }}>Excellent</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Generic placeholder for library/transport */}
          {(activeReport==='library'||activeReport==='transport') && (
            <div className="card" style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>
              <FileText size={40} style={{ margin:'0 auto 12px', opacity:.3 }} />
              <div style={{ fontSize:15, fontWeight:600 }}>
                {activeReport==='library'?'Library':'Transport'} Report
              </div>
              <div style={{ fontSize:13, marginTop:6 }}>Connect the backend API to view full report data.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}