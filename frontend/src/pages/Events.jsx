// @ts-nocheck
import { useState } from 'react';
import {
  Plus, Search, X, Loader, ChevronDown,
  Calendar, Clock, MapPin, Users, DollarSign,
  MessageCircle, CheckCircle, Download, Filter,
  ClipboardList, Edit, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['Academic','Sports','Cultural','Annual Day','Holiday','PTM','Field Trip','Exam','Other'];
const VENUES      = ['School Hall','School Ground','Classroom','Auditorium','Library','Off-campus','Online'];
const AUDIENCES   = ['all','students','parents','teachers','staff'];
const STATUSES    = ['Upcoming','Ongoing','Completed','Cancelled','Postponed'];
const SCHOOL      = { name:'Greenfield Public School', phone:'080-12345678' };

const TYPE_CONFIG = {
  'Academic':   { color:'#1d4ed8', bg:'#dbeafe', emoji:'📚' },
  'Sports':     { color:'#16a34a', bg:'#dcfce7', emoji:'⚽' },
  'Cultural':   { color:'#be185d', bg:'#fce7f3', emoji:'🎭' },
  'Annual Day': { color:'#d97706', bg:'#fef9c3', emoji:'🎉' },
  'Holiday':    { color:'#dc2626', bg:'#fee2e2', emoji:'🏖️' },
  'PTM':        { color:'#7c3aed', bg:'#f3e8ff', emoji:'👨‍👩‍👦' },
  'Field Trip': { color:'#0891b2', bg:'#cffafe', emoji:'🚌' },
  'Exam':       { color:'#9333ea', bg:'#f5f3ff', emoji:'📝' },
  'Other':      { color:'#475569', bg:'#f1f5f9', emoji:'📋' },
};

const STATUS_CONFIG = {
  'Upcoming':   { color:'#1d4ed8', bg:'#dbeafe' },
  'Ongoing':    { color:'#16a34a', bg:'#dcfce7' },
  'Completed':  { color:'#475569', bg:'#f1f5f9' },
  'Cancelled':  { color:'#dc2626', bg:'#fee2e2' },
  'Postponed':  { color:'#d97706', bg:'#fef9c3' },
};

const PRIORITY_CFG = {
  'High':   { color:'#dc2626', bg:'#fee2e2' },
  'Medium': { color:'#d97706', bg:'#fef9c3' },
  'Low':    { color:'#16a34a', bg:'#dcfce7' },
};

const TASK_STATUS_CFG = {
  'Pending':     { color:'#64748b', bg:'#f1f5f9' },
  'In Progress': { color:'#d97706', bg:'#fef9c3' },
  'Completed':   { color:'#16a34a', bg:'#dcfce7' },
  'Overdue':     { color:'#dc2626', bg:'#fee2e2' },
};

const DEMO_EVENTS = [
  { _id:'e1', title:'Annual Sports Day',         type:'Sports',    startDate:'2026-10-15', endDate:'2026-10-15', startTime:'08:00', endTime:'17:00', venue:'School Ground',  organiser:'Mr. Rajan',   audience:'all',      status:'Upcoming',  budget:25000, spent:8000,  description:'Annual inter-house sports competition.', classes:[] },
  { _id:'e2', title:'Mid Term Examinations',     type:'Exam',      startDate:'2026-10-01', endDate:'2026-10-10', startTime:'09:00', endTime:'12:00', venue:'Classrooms',    organiser:'Ms. Kavitha', audience:'students', status:'Upcoming',  budget:5000,  spent:1200,  description:'Mid term examinations for all classes.', classes:['9','10','11','12'] },
  { _id:'e3', title:'Parent Teacher Meeting',    type:'PTM',       startDate:'2026-10-05', endDate:'2026-10-05', startTime:'10:00', endTime:'14:00', venue:'Classrooms',    organiser:'Principal',   audience:'parents',  status:'Upcoming',  budget:2000,  spent:500,   description:'PTM for all classes.', classes:[] },
  { _id:'e4', title:'Dussehra Holiday',          type:'Holiday',   startDate:'2026-10-12', endDate:'2026-10-12', startTime:'',     endTime:'',      venue:'',              organiser:'',            audience:'all',      status:'Upcoming',  budget:0,     spent:0,     description:'School holiday on account of Dussehra festival.', classes:[] },
  { _id:'e5', title:'Annual Day Celebration',    type:'Annual Day',startDate:'2026-11-15', endDate:'2026-11-15', startTime:'17:00', endTime:'21:00', venue:'Auditorium',    organiser:'Ms. Priya',   audience:'all',      status:'Upcoming',  budget:80000, spent:12000, description:'Annual Day celebrations with cultural programs.', classes:[] },
  { _id:'e6', title:'Science Exhibition',        type:'Academic',  startDate:'2026-09-28', endDate:'2026-09-29', startTime:'09:00', endTime:'16:00', venue:'School Hall',   organiser:'Mr. Suresh',  audience:'all',      status:'Completed', budget:15000, spent:14200, description:'Inter-class science exhibition.', classes:['8','9','10'] },
];

const DEMO_TEACHERS = [
  { _id:'t1', name:'Mrs. Kavitha Nair',  phone:'9876543220', department:'Mathematics' },
  { _id:'t2', name:'Mr. Rajan Pillai',   phone:'9876543221', department:'Science'     },
  { _id:'t3', name:'Ms. Priya Sharma',   phone:'9876543222', department:'English'     },
  { _id:'t4', name:'Mr. Suresh Kumar',   phone:'9876543223', department:'Social'      },
  { _id:'t5', name:'Mrs. Lakshmi Devi',  phone:'9876543224', department:'Hindi'       },
];

const DEMO_TASKS = [
  { _id:'tk1', eventId:'e1', eventTitle:'Annual Sports Day',    title:'Arrange chairs in ground',        assignedTo:'t1', assignedName:'Mrs. Kavitha Nair', dueDate:'2026-10-14', dueTime:'08:00', priority:'High',   status:'Pending',     note:'500 chairs needed near main stage', completedAt:null, completedNote:'' },
  { _id:'tk2', eventId:'e1', eventTitle:'Annual Sports Day',    title:'Set up registration table',       assignedTo:'t2', assignedName:'Mr. Rajan Pillai',  dueDate:'2026-10-14', dueTime:'07:30', priority:'High',   status:'Completed',   note:'Table near main gate with name tags', completedAt:'2026-10-14T07:45', completedNote:'Done. 3 tables set up near gate.' },
  { _id:'tk3', eventId:'e1', eventTitle:'Annual Sports Day',    title:'Prepare track and field markers', assignedTo:'t4', assignedName:'Mr. Suresh Kumar',  dueDate:'2026-10-14', dueTime:'06:30', priority:'High',   status:'In Progress', note:'Use red cones for 100m track', completedAt:null, completedNote:'' },
  { _id:'tk4', eventId:'e3', eventTitle:'Parent Teacher Meeting',title:'Set up class seating for PTM',  assignedTo:'t3', assignedName:'Ms. Priya Sharma',  dueDate:'2026-10-04', dueTime:'09:00', priority:'Medium', status:'Pending',     note:'1 desk and 2 chairs per class', completedAt:null, completedNote:'' },
  { _id:'tk5', eventId:'e3', eventTitle:'Parent Teacher Meeting',title:'Print student report cards',    assignedTo:'t5', assignedName:'Mrs. Lakshmi Devi', dueDate:'2026-10-04', dueTime:'08:00', priority:'High',   status:'Pending',     note:'Print all class 10 report cards', completedAt:null, completedNote:'' },
  { _id:'tk6', eventId:'e5', eventTitle:'Annual Day Celebration',title:'Decorate auditorium stage',     assignedTo:'t3', assignedName:'Ms. Priya Sharma',  dueDate:'2026-11-14', dueTime:'10:00', priority:'High',   status:'Pending',     note:'Blue and gold theme', completedAt:null, completedNote:'' },
];

const INIT_FORM = {
  title:'', type:'Academic', startDate:'', endDate:'', startTime:'', endTime:'',
  venue:'School Hall', organiser:'', audience:'all', status:'Upcoming',
  budget:'', spent:'', description:'', classes:[],
};

const INIT_TASK = { eventId:'', title:'', assignedTo:'', dueDate:'', dueTime:'08:00', priority:'High', note:'' };

// ── Helpers ───────────────────────────────────────────────
const Sel = ({ label, required, children, ...p }) => (
  <div>
    {label && <label className="label">{label}{required && ' *'}</label>}
    <div style={{ position:'relative' }}>
      <select required={required} className="input-field"
        style={{ appearance:'none', paddingRight:28 }} {...p}>
        {children}
      </select>
      <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%',
        transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const SmSel = ({ label, children, ...p }) => (
  <div>
    {label && <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:4 }}>{label}</label>}
    <div style={{ position:'relative' }}>
      <select style={{ width:'100%', padding:'8px 28px 8px 10px', borderRadius:8,
        border:'1px solid #e2e8f0', fontSize:13, appearance:'none', background:'#fff' }} {...p}>
        {children}
      </select>
      <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%',
        transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
    </div>
  </div>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '';
const fmtTime = (t) => {
  if (!t) return '';
  const [h,m] = t.split(':');
  const hr = parseInt(h);
  return (hr > 12 ? hr-12 : hr || 12) + ':' + m + ' ' + (hr >= 12 ? 'PM' : 'AM');
};
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

// ── Event Card ────────────────────────────────────────────
function EventCard({ ev, onEdit, onDelete, onWhatsApp }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[ev.type]    || TYPE_CONFIG['Other'];
  const sc = STATUS_CONFIG[ev.status] || STATUS_CONFIG['Upcoming'];
  const days = daysUntil(ev.startDate);
  const budgetUsed = ev.budget > 0 ? Math.round((ev.spent / ev.budget) * 100) : 0;
  const budgetColor = budgetUsed > 90 ? '#dc2626' : budgetUsed > 70 ? '#d97706' : '#16a34a';

  return (
    <div className="card" style={{ padding:0, overflow:'hidden',
      border:ev.status==='Cancelled'?'1px solid #fecaca':'1px solid #e5e7eb',
      opacity:ev.status==='Cancelled'?0.7:1 }}>
      <div style={{ height:4, background:tc.color }} />
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:tc.bg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, flexShrink:0 }}>{tc.emoji}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
              <span style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>{ev.title}</span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:tc.bg, color:tc.color }}>{ev.type}</span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:sc.bg, color:sc.color }}>{ev.status}</span>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#64748b' }}>
                <Calendar size={11} />{fmtDate(ev.startDate)}{ev.endDate && ev.endDate !== ev.startDate && ' – ' + fmtDate(ev.endDate)}
              </div>
              {ev.startTime && (
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#64748b' }}>
                  <Clock size={11} />{fmtTime(ev.startTime)}{ev.endTime && ' – ' + fmtTime(ev.endTime)}
                </div>
              )}
              {ev.venue && (
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#64748b' }}>
                  <MapPin size={11} />{ev.venue}
                </div>
              )}
            </div>
            {ev.status === 'Upcoming' && days !== null && (
              <div style={{ marginTop:6 }}>
                {days === 0
                  ? <span style={{ fontSize:11, fontWeight:700, color:'#16a34a', background:'#dcfce7', padding:'2px 8px', borderRadius:12 }}>Today!</span>
                  : days > 0
                  ? <span style={{ fontSize:11, fontWeight:700, color:days<=7?'#dc2626':days<=30?'#d97706':'#3b82f6', background:days<=7?'#fee2e2':days<=30?'#fef9c3':'#dbeafe', padding:'2px 8px', borderRadius:12 }}>
                      {days <= 7 ? '🔴' : days <= 30 ? '🟡' : '🔵'} {days} days away
                    </span>
                  : null}
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            <button onClick={() => onWhatsApp(ev)} style={{ padding:7, borderRadius:8, border:'1px solid #25D366', background:'#f0fdf4', cursor:'pointer', color:'#16a34a', display:'flex' }}><MessageCircle size={13}/></button>
            <button onClick={() => onEdit(ev)}     style={{ padding:7, borderRadius:8, border:'1px solid #bfdbfe', background:'#eff6ff', cursor:'pointer', color:'#3b82f6', display:'flex' }}><Edit size={13}/></button>
            <button onClick={() => onDelete(ev._id)} style={{ padding:7, borderRadius:8, border:'1px solid #fecaca', background:'#fff5f5', cursor:'pointer', color:'#ef4444', display:'flex' }}><Trash2 size={13}/></button>
          </div>
        </div>
        {ev.budget > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:4 }}>
              <span>Budget: Rs.{ev.spent.toLocaleString()} of Rs.{ev.budget.toLocaleString()}</span>
              <span style={{ fontWeight:700, color:budgetColor }}>{budgetUsed}%</span>
            </div>
            <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:budgetUsed+'%', height:'100%', background:budgetColor, borderRadius:3 }} />
            </div>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontSize:11, color:'#94a3b8' }}><Users size={10} style={{ display:'inline', marginRight:3 }}/>{ev.audience}</span>
            {ev.organiser && <span style={{ fontSize:11, color:'#94a3b8' }}>· {ev.organiser}</span>}
          </div>
          <button onClick={() => setExpanded(e=>!e)} style={{ fontSize:11, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
            {expanded ? '▲ Less' : '▼ Details'}
          </button>
        </div>
        {expanded && ev.description && (
          <div style={{ marginTop:10, padding:12, background:'#f8fafc', borderRadius:8, fontSize:12, color:'#475569', lineHeight:1.6 }}>
            {ev.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Calendar View ─────────────────────────────────────────
function CalendarView({ events }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year,  setYear]  = useState(new Date().getFullYear());
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month+1, 0).getDate();
  const monthName    = new Date(year, month).toLocaleString('en-IN', { month:'long', year:'numeric' });
  const eventsOnDay  = (day) => {
    const ds = year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    return events.filter(e => e.startDate <= ds && e.endDate >= ds);
  };
  const days = [];
  for (let i=0; i<firstDay; i++) days.push(null);
  for (let i=1; i<=daysInMonth; i++) days.push(i);
  const today  = new Date();
  const isToday = (d) => d && today.getDate()===d && today.getMonth()===month && today.getFullYear()===year;
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer' }}>◀</button>
        <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{monthName}</div>
        <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer' }}>▶</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'#94a3b8', padding:'4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {days.map((day, i) => {
          const dayEvents = day ? eventsOnDay(day) : [];
          return (
            <div key={i} style={{ minHeight:70, padding:4, borderRadius:6,
              background:isToday(day)?'#eff6ff':day?'#fafafa':'transparent',
              border:isToday(day)?'2px solid #3b82f6':'1px solid #f1f5f9' }}>
              {day && (
                <>
                  <div style={{ fontSize:12, fontWeight:isToday(day)?800:500, color:isToday(day)?'#1d4ed8':'#475569', marginBottom:3 }}>{day}</div>
                  {dayEvents.slice(0,2).map(ev => {
                    const tc = TYPE_CONFIG[ev.type]||TYPE_CONFIG['Other'];
                    return (
                      <div key={ev._id} style={{ fontSize:9, fontWeight:600, padding:'2px 4px', borderRadius:4, background:tc.bg, color:tc.color, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {tc.emoji} {ev.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600 }}>+{dayEvents.length-2} more</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Budget Tab ────────────────────────────────────────────
function BudgetTab({ events }) {
  const withBudget   = events.filter(e => e.budget > 0);
  const totalBudget  = withBudget.reduce((s,e)=>s+e.budget,0);
  const totalSpent   = withBudget.reduce((s,e)=>s+e.spent,0);
  const remaining    = totalBudget - totalSpent;
  return (
    <div className="space-y-4">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
        {[
          { label:'Total Budget',   value:'Rs.'+totalBudget.toLocaleString(), color:'#3b82f6' },
          { label:'Total Spent',    value:'Rs.'+totalSpent.toLocaleString(),  color:'#ef4444' },
          { label:'Remaining',      value:'Rs.'+remaining.toLocaleString(),   color:'#16a34a' },
          { label:'Events Tracked', value:withBudget.length,                  color:'#8b5cf6' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'12px 14px', borderTop:'3px solid '+k.color }}>
            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:k.color, marginTop:3 }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead><tr><th>Event</th><th>Type</th><th>Status</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Used %</th></tr></thead>
            <tbody>
              {withBudget.map(e => {
                const rem  = e.budget - e.spent;
                const pct  = Math.round(e.spent/e.budget*100);
                const color= pct>90?'#dc2626':pct>70?'#d97706':'#16a34a';
                const tc   = TYPE_CONFIG[e.type]||TYPE_CONFIG['Other'];
                const sc   = STATUS_CONFIG[e.status]||STATUS_CONFIG['Upcoming'];
                return (
                  <tr key={e._id}>
                    <td style={{ fontWeight:700 }}>{e.title}</td>
                    <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:12, background:tc.bg, color:tc.color, fontWeight:700 }}>{tc.emoji} {e.type}</span></td>
                    <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:12, background:sc.bg, color:sc.color, fontWeight:700 }}>{e.status}</span></td>
                    <td style={{ fontWeight:700 }}>Rs.{e.budget.toLocaleString()}</td>
                    <td style={{ fontWeight:700, color:'#ef4444' }}>Rs.{e.spent.toLocaleString()}</td>
                    <td style={{ fontWeight:700, color:rem>=0?'#16a34a':'#dc2626' }}>Rs.{rem.toLocaleString()}</td>
                    <td style={{ minWidth:120 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:Math.min(pct,100)+'%', height:'100%', background:color, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color, width:32 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Task Assignment Tab ───────────────────────────────────
function TaskTab({ events, teachers }) {
  const [tasks,        setTasks]        = useState(DEMO_TASKS);
  const [showModal,    setShowModal]    = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);
  const [taskForm,     setTaskForm]     = useState(INIT_TASK);
  const [saving,       setSaving]       = useState(false);
  const [filterEvent,  setFilterEvent]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacher,setFilterTeacher]= useState('');
  const [showComplete, setShowComplete] = useState(null);
  const [completeNote, setCompleteNote] = useState('');

  const openAdd  = () => { setEditingTask(null); setTaskForm(INIT_TASK); setShowModal(true); };
  const openEdit = (t) => {
    setEditingTask(t);
    setTaskForm({ eventId:t.eventId, title:t.title, assignedTo:t.assignedTo, dueDate:t.dueDate, dueTime:t.dueTime, priority:t.priority, note:t.note });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    const teacher = teachers.find(t => t._id === taskForm.assignedTo);
    const ev      = events.find(ev => ev._id === taskForm.eventId);
    setTimeout(() => {
      if (editingTask) {
        setTasks(prev => prev.map(t => t._id === editingTask._id
          ? { ...t, ...taskForm, assignedName:teacher?.name||t.assignedName, eventTitle:ev?.title||t.eventTitle }
          : t));
        toast.success('Task updated!');
      } else {
        setTasks(prev => [{
          ...taskForm,
          _id: 'tk'+Date.now(),
          assignedName:  teacher?.name || '',
          eventTitle:    ev?.title     || '',
          status:        'Pending',
          completedAt:   null,
          completedNote: '',
        }, ...prev]);
        toast.success('Task assigned to ' + (teacher?.name||'teacher') + '!');
        if (teacher?.phone) {
          const raw = teacher.phone.replace(/\D/g, '');
          const ph  = raw.startsWith('91') ? raw : '91' + raw;
          const line1 = 'Hello ' + teacher.name + ', you have a new task assigned.';
          const line2 = 'Event: ' + (ev?.title || 'Upcoming event');
          const line3 = 'Task: ' + taskForm.title;
          const line4 = 'Due: ' + taskForm.dueDate + ' at ' + taskForm.dueTime;
          const line5 = 'Priority: ' + taskForm.priority;
          const line6 = 'Note: ' + (taskForm.note || 'No notes');
          const msg   = line1 + '\n\n' + line2 + '\n' + line3 + '\n' + line4 + '\n' + line5 + '\n\n' + line6;
          setTimeout(() => window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank'), 500);
        }
      }
      setShowModal(false);
      setSaving(false);
    }, 400);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this task?')) return;
    setTasks(prev => prev.filter(t => t._id !== id));
    toast.success('Task deleted');
  };

  const markInProgress = (task) => {
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status:'In Progress' } : t));
    toast.success('Marked as In Progress');
  };

  const markComplete = (task) => { setShowComplete(task); setCompleteNote(''); };

  const confirmComplete = () => {
    setTasks(prev => prev.map(t => t._id === showComplete._id
      ? { ...t, status:'Completed', completedAt:new Date().toISOString(), completedNote }
      : t));
    toast.success('Task marked as completed!');
    setShowComplete(null);
  };

  const notifyTeacher = (task) => {
    const teacher = teachers.find(t => t._id === task.assignedTo);
    if (!teacher?.phone) { toast.error('No phone for this teacher'); return; }
    const raw = teacher.phone.replace(/\D/g, '');
    const ph  = raw.startsWith('91') ? raw : '91' + raw;
    const l1  = 'Reminder ' + teacher.name + ': please complete your assigned task.';
    const l2  = 'Task: ' + task.title;
    const l3  = 'Event: ' + task.eventTitle;
    const l4  = 'Due: ' + task.dueDate + ' at ' + task.dueTime;
    const l5  = 'Priority: ' + task.priority;
    const l6  = 'Current Status: ' + task.status;
    const msg = l1 + '\n\n' + l2 + '\n' + l3 + '\n' + l4 + '\n' + l5 + '\n' + l6;
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    toast.success('Reminder sent to ' + teacher.name);
  };

  const filtered = tasks.filter(t =>
    (!filterEvent    || t.eventId    === filterEvent)    &&
    (!filterStatus   || t.status     === filterStatus)   &&
    (!filterTeacher  || t.assignedTo === filterTeacher)
  );

  const countPending   = tasks.filter(t => t.status === 'Pending').length;
  const countInProg    = tasks.filter(t => t.status === 'In Progress').length;
  const countCompleted = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="space-y-4">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontSize:13, color:'#64748b' }}>Assign tasks to teachers. Teacher updates status when done.</div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14}/> Assign Task</button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[
          { label:'Total',       value:tasks.length, color:'#3b82f6' },
          { label:'Pending',     value:countPending, color:'#64748b' },
          { label:'In Progress', value:countInProg,  color:'#d97706' },
          { label:'Completed',   value:countCompleted, color:'#16a34a' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'10px 14px', borderTop:'3px solid '+k.color, textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        <SmSel label="Filter by Event" value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}>
          <option value="">All Events</option>
          {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
        </SmSel>
        <SmSel label="Filter by Status" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Pending','In Progress','Completed','Overdue'].map(s => <option key={s}>{s}</option>)}
        </SmSel>
        <SmSel label="Filter by Teacher" value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)}>
          <option value="">All Teachers</option>
          {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </SmSel>
      </div>

      {/* Task Cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(task => {
          const isOverdue = task.status !== 'Completed' && task.dueDate < new Date().toISOString().split('T')[0];
          const sc  = isOverdue ? TASK_STATUS_CFG['Overdue'] : TASK_STATUS_CFG[task.status] || TASK_STATUS_CFG['Pending'];
          const pc  = PRIORITY_CFG[task.priority] || PRIORITY_CFG['Medium'];
          const ico = task.status==='Completed' ? '✅' : task.status==='In Progress' ? '🔄' : isOverdue ? '🔴' : '⏳';
          return (
            <div key={task._id} className="card" style={{ padding:16,
              border:isOverdue?'1px solid #fecaca':'1px solid #e5e7eb',
              background:task.status==='Completed'?'#fafafa':'#fff' }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                  background:sc.bg, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:22 }}>{ico}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                    <span style={{ fontWeight:800, fontSize:14,
                      color:task.status==='Completed'?'#94a3b8':'#0f172a',
                      textDecoration:task.status==='Completed'?'line-through':'none' }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:pc.bg, color:pc.color }}>{task.priority}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:sc.bg, color:sc.color }}>{isOverdue?'Overdue':task.status}</span>
                  </div>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:'#64748b', marginBottom:8 }}>
                    <span>📅 {task.eventTitle}</span>
                    <span>👩‍🏫 {task.assignedName}</span>
                    <span>🕐 Due: {task.dueDate} at {task.dueTime}</span>
                  </div>
                  {task.note && (
                    <div style={{ fontSize:12, color:'#475569', background:'#f8fafc',
                      borderRadius:7, padding:'6px 10px', marginBottom:8,
                      borderLeft:'3px solid #3b82f6' }}>
                      📝 {task.note}
                    </div>
                  )}
                  {task.status === 'Completed' && task.completedNote && (
                    <div style={{ fontSize:12, color:'#16a34a', background:'#f0fdf4',
                      borderRadius:7, padding:'6px 10px',
                      borderLeft:'3px solid #16a34a' }}>
                      ✅ {task.completedNote}
                      {task.completedAt && (
                        <span style={{ color:'#94a3b8', marginLeft:8, fontSize:11 }}>
                          at {new Date(task.completedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                  {task.status !== 'Completed' && (
                    <>
                      {task.status === 'Pending' && (
                        <button onClick={() => markInProgress(task)}
                          style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fde68a',
                            background:'#fef9c3', color:'#d97706', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                          🔄 Start
                        </button>
                      )}
                      <button onClick={() => markComplete(task)}
                        style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #bbf7d0',
                          background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                        ✅ Done
                      </button>
                    </>
                  )}
                  <button onClick={() => notifyTeacher(task)}
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #25D366',
                      background:'#f0fdf4', color:'#16a34a', cursor:'pointer',
                      fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                    <MessageCircle size={11}/> Remind
                  </button>
                  <button onClick={() => openEdit(task)}
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #bfdbfe',
                      background:'#eff6ff', color:'#3b82f6', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(task._id)}
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fecaca',
                      background:'#fff5f5', color:'#ef4444', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                    🗑️ Del
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
            <ClipboardList size={36} style={{ margin:'0 auto 10px', opacity:.3 }} />
            <div style={{ fontSize:14, fontWeight:600 }}>No tasks found</div>
            <div style={{ fontSize:12, marginTop:4 }}>Click Assign Task to add tasks for teachers</div>
          </div>
        )}
      </div>

      {/* Assign / Edit Task Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, maxWidth:520, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'16px 20px', borderBottom:'1px solid #f1f5f9',
              position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div style={{ fontWeight:800, fontSize:15 }}>{editingTask ? 'Edit Task' : 'Assign Task to Teacher'}</div>
              <button onClick={() => setShowModal(false)}
                style={{ padding:7, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}>
                <X size={14}/>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <SmSel label="Event *" value={taskForm.eventId} onChange={e=>setTaskForm(p=>({...p,eventId:e.target.value}))}>
                <option value="">Select Event</option>
                {events.filter(ev => ev.status==='Upcoming'||ev.status==='Ongoing').map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.title} — {ev.startDate}</option>
                ))}
              </SmSel>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:4 }}>Task Title *</label>
                <input required
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13 }}
                  placeholder="e.g. Arrange 50 chairs in ground"
                  value={taskForm.title}
                  onChange={e => setTaskForm(p=>({...p,title:e.target.value}))} />
              </div>
              <SmSel label="Assign to Teacher *" value={taskForm.assignedTo} onChange={e=>setTaskForm(p=>({...p,assignedTo:e.target.value}))}>
                <option value="">Select Teacher</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} — {t.department}</option>
                ))}
              </SmSel>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:4 }}>Due Date *</label>
                  <input required type="date"
                    style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13 }}
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm(p=>({...p,dueDate:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:4 }}>Due Time</label>
                  <input type="time"
                    style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13 }}
                    value={taskForm.dueTime}
                    onChange={e => setTaskForm(p=>({...p,dueTime:e.target.value}))} />
                </div>
              </div>
              <SmSel label="Priority" value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </SmSel>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:4 }}>Instructions</label>
                <textarea
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, resize:'vertical' }}
                  rows={3}
                  placeholder="Specific instructions for the teacher..."
                  value={taskForm.note}
                  onChange={e => setTaskForm(p=>({...p,note:e.target.value}))} />
              </div>
              <div style={{ background:'#eff6ff', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1d4ed8' }}>
                WhatsApp message will be sent to teacher automatically after assigning.
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : editingTask ? 'Update Task' : 'Assign + WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Complete Modal */}
      {showComplete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, maxWidth:420, width:'100%', padding:24 }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>Mark Task as Completed</div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>{showComplete.title}</div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:6 }}>What was done?</label>
              <textarea
                style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, resize:'vertical' }}
                rows={3}
                placeholder="e.g. 50 chairs arranged near stage. Registration table set up at gate."
                value={completeNote}
                onChange={e => setCompleteNote(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={() => setShowComplete(null)}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:13 }}>
                Cancel
              </button>
              <button onClick={confirmComplete}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event Form Modal ──────────────────────────────────────
function EventModal({ editing, form, setForm, onSave, onClose, saving }) {
  const inp = f => ({ value:form[f]||'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})) });
  const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  const toggleClass = (c) => setForm(p => ({ ...p, classes:p.classes.includes(c)?p.classes.filter(x=>x!==c):[...(p.classes||[]),c] }));
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:18, maxWidth:620, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'18px 22px', borderBottom:'1px solid #f1f5f9',
          position:'sticky', top:0, background:'#fff', zIndex:5 }}>
          <div style={{ fontWeight:800, fontSize:16 }}>{editing ? 'Edit Event' : 'Add New Event'}</div>
          <button onClick={onClose} style={{ padding:8, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={15}/></button>
        </div>
        <form onSubmit={e=>{e.preventDefault();onSave(form);}} style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Event Title *</label>
            <input required className="input-field" placeholder="e.g. Annual Sports Day 2026" {...inp('title')} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Sel label="Event Type *" required value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </Sel>
            <Sel label="Audience" value={form.audience} onChange={e=>setForm(p=>({...p,audience:e.target.value}))}>
              {AUDIENCES.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
            </Sel>
            <Sel label="Status" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Sel>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="label">Start Date *</label><input required type="date" className="input-field" {...inp('startDate')} /></div>
            <div><label className="label">End Date</label><input type="date" className="input-field" {...inp('endDate')} /></div>
            <div><label className="label">Start Time</label><input type="time" className="input-field" {...inp('startTime')} /></div>
            <div><label className="label">End Time</label><input type="time" className="input-field" {...inp('endTime')} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Sel label="Venue" value={form.venue} onChange={e=>setForm(p=>({...p,venue:e.target.value}))}>
              {VENUES.map(v=><option key={v}>{v}</option>)}
            </Sel>
            <div><label className="label">Organiser</label><input className="input-field" placeholder="Teacher / Department" {...inp('organiser')} /></div>
            <div><label className="label">Budget (Rs.)</label><input type="number" className="input-field" placeholder="25000" {...inp('budget')} /></div>
            <div><label className="label">Amount Spent (Rs.)</label><input type="number" className="input-field" placeholder="0" {...inp('spent')} /></div>
          </div>
          <div>
            <label className="label">Specific Classes</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
              {CLASSES.map(c => (
                <button key={c} type="button" onClick={() => toggleClass(c)}
                  style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
                    border:(form.classes||[]).includes(c)?'none':'1px solid #e2e8f0',
                    background:(form.classes||[]).includes(c)?'#3b82f6':'#f8fafc',
                    color:(form.classes||[]).includes(c)?'#fff':'#475569' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" rows={3} placeholder="Event details..." {...inp('description')} style={{ resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : editing ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Events Page ──────────────────────────────────────
export default function Events() {
  const [events,      setEvents]      = useState(DEMO_EVENTS);
  const [teachers]                    = useState(DEMO_TEACHERS);
  const [tab,         setTab]         = useState('list');
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(INIT_FORM);
  const [saving,      setSaving]      = useState(false);

  const openAdd  = () => { setEditing(null); setForm(INIT_FORM); setShowModal(true); };
  const openEdit = ev => { setEditing(ev); setForm({ ...ev }); setShowModal(true); };

  const handleDelete = (id) => {
    if (!confirm('Delete this event?')) return;
    setEvents(prev => prev.filter(e => e._id !== id));
    toast.success('Event deleted');
  };

  const handleSave = (data) => {
    setSaving(true);
    setTimeout(() => {
      if (editing) {
        setEvents(prev => prev.map(e => e._id===editing._id ? { ...data, _id:editing._id } : e));
        toast.success('Event updated!');
      } else {
        setEvents(prev => [{ ...data, _id:Date.now().toString(), budget:Number(data.budget||0), spent:Number(data.spent||0) }, ...prev]);
        toast.success('Event added!');
      }
      setShowModal(false); setEditing(null); setSaving(false);
    }, 500);
  };

  const handleWhatsApp = (ev) => {
    const tc  = TYPE_CONFIG[ev.type] || TYPE_CONFIG['Other'];
    const l1  = tc.emoji + ' ' + ev.title;
    const l2  = SCHOOL.name;
    const l3  = 'Date: ' + fmtDate(ev.startDate) + (ev.endDate&&ev.endDate!==ev.startDate?' to '+fmtDate(ev.endDate):'');
    const l4  = ev.startTime ? 'Time: ' + fmtTime(ev.startTime) + (ev.endTime?' to '+fmtTime(ev.endTime):'') : '';
    const l5  = ev.venue ? 'Venue: ' + ev.venue : '';
    const l6  = ev.description;
    const l7  = 'Contact: ' + SCHOOL.phone;
    const msg = l1 + '\n' + l2 + '\n\n' + l3 + (l4?'\n'+l4:'') + (l5?'\n'+l5:'') + '\n\n' + l6 + '\n\n' + l7;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    toast.success('WhatsApp invite opened');
  };

  const exportCSV = () => {
    const csv = 'Title,Type,Start Date,End Date,Venue,Organiser,Status,Budget,Spent\n'
      + events.map(e => '"'+e.title+'","'+e.type+'","'+e.startDate+'","'+(e.endDate||e.startDate)+'","'+(e.venue||'')+'","'+(e.organiser||'')+'","'+e.status+'",'+e.budget+','+e.spent).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'events.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Exported');
  };

  const filtered = events.filter(e =>
    (!search       || e.title.toLowerCase().includes(search.toLowerCase()))
    && (!typeFilter   || e.type   === typeFilter)
    && (!statusFilter || e.status === statusFilter)
  );

  const upcoming    = events.filter(e=>e.status==='Upcoming').length;
  const thisMonth   = events.filter(e=>{ const d=new Date(e.startDate),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length;
  const totalBudget = events.reduce((s,e)=>s+Number(e.budget||0),0);
  const nextEvent   = events.filter(e=>e.status==='Upcoming'&&daysUntil(e.startDate)>=0).sort((a,b)=>new Date(a.startDate)-new Date(b.startDate))[0];

  const TABS = [
    { id:'list',     label:'All Events',      icon:Filter       },
    { id:'calendar', label:'Calendar',        icon:Calendar     },
    { id:'budget',   label:'Budget Tracker',  icon:DollarSign   },
    { id:'tasks',    label:'Task Assignment', icon:ClipboardList},
  ];

  return (
    <div className="space-y-5">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 text-sm">Plan, manage and track all school events</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} className="btn-secondary"><Download size={14}/> Export CSV</button>
          <button onClick={openAdd}   className="btn-primary"><Plus size={14}/> Add Event</button>
        </div>
      </div>

      {/* Next event banner */}
      {nextEvent && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22 }}>{TYPE_CONFIG[nextEvent.type]?.emoji||'📅'}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#1d4ed8' }}>Next Event: {nextEvent.title}</div>
            <div style={{ fontSize:12, color:'#3b82f6' }}>{fmtDate(nextEvent.startDate)} · {nextEvent.venue}</div>
          </div>
          <div style={{ fontWeight:800, fontSize:13, color:'#1d4ed8' }}>
            {daysUntil(nextEvent.startDate) === 0 ? 'Today!' : daysUntil(nextEvent.startDate)+' days away'}
          </div>
          <button onClick={() => handleWhatsApp(nextEvent)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8,
              border:'1px solid #25D366', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <MessageCircle size={13}/> Invite
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
        {[
          { label:'Total Events',  value:events.length,  color:'#3b82f6', icon:Calendar   },
          { label:'Upcoming',      value:upcoming,        color:'#8b5cf6', icon:Clock      },
          { label:'This Month',    value:thisMonth,       color:'#16a34a', icon:CheckCircle},
          { label:'Total Budget',  value:'Rs.'+(totalBudget/1000).toFixed(0)+'K', color:'#f59e0b', icon:DollarSign},
          { label:'Completed',     value:events.filter(e=>e.status==='Completed').length, color:'#06b6d4', icon:CheckCircle},
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
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px',
              border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent',
              color:        tab===t.id ? '#1e40af' : '#64748b',
              borderBottom: tab===t.id ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px' }}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {/* All Events tab */}
      {tab === 'list' && (
        <div className="space-y-4">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
              <input className="input-field" placeholder="Search events..." style={{ paddingLeft:28 }} value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <Sel value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </Sel>
            <Sel value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Sel>
            {(search||typeFilter||statusFilter) && (
              <button onClick={()=>{setSearch('');setTypeFilter('');setStatusFilter('');}}
                style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#ef4444', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                <X size={12}/> Clear
              </button>
            )}
            <span style={{ fontSize:12, color:'#94a3b8' }}>{filtered.length} events</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
            {filtered.map(ev => (
              <EventCard key={ev._id} ev={ev} onEdit={openEdit} onDelete={handleDelete} onWhatsApp={handleWhatsApp} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', color:'#94a3b8' }}>
                <Calendar size={36} style={{ margin:'0 auto 10px', opacity:.3 }} />
                <div style={{ fontSize:14, fontWeight:600 }}>No events found</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'calendar' && <CalendarView events={events} />}
      {tab === 'budget'   && <BudgetTab   events={events} />}
      {tab === 'tasks'    && <TaskTab     events={events} teachers={teachers} />}

      {showModal && (
        <EventModal editing={editing} form={form} setForm={setForm}
          onSave={handleSave} onClose={()=>{setShowModal(false);setEditing(null);}} saving={saving} />
      )}
    </div>
  );
}