import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  CreditCard, FileText, Library, Bus, BarChart2, Bell, Calendar,
  Settings, Shield, LogOut, Menu, X, School, Check,
  AlertCircle, Info, CreditCard as FeeIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/',              label: 'Dashboard',         icon: LayoutDashboard, exact: true },
  { path: '/students',      label: 'Students',           icon: Users           },
  { path: '/teachers',      label: 'Teachers',           icon: GraduationCap   },
  { path: '/classes',       label: 'Classes & Timetable',icon: BookOpen        },
  { path: '/attendance',    label: 'Attendance',         icon: ClipboardList   },
  { path: '/fees',          label: 'Fees',               icon: CreditCard      },
  { path: '/examinations',  label: 'Examinations',       icon: FileText        },
  { path: '/library',       label: 'Library',            icon: Library         },
  { path: '/transport',     label: 'Transport',          icon: Bus             },
  { path: '/reports',       label: 'Reports',            icon: BarChart2       },
  { path: '/notifications', label: 'Notifications',      icon: Bell            },
  { path: '/events',        label: 'Events',              icon: Calendar        },
  { path: '/fee-payment',   label: 'Online Fee Payment',  icon: CreditCard      },
  { path: '/bus-tracking',  label: 'Bus Tracking',        icon: Bus             },
  { path: '/id-cards',      label: 'ID Cards',            icon: CreditCard      },
  { path: '/users',         label: 'Users',               icon: Users           },
  { path: '/audit-logs',    label: 'Audit Logs',         icon: Shield          },
  { path: '/settings',      label: 'Settings',           icon: Settings        },
];

// ── Demo recent notifications (matches Notifications page data) ───────────────
const RECENT_NOTIFS = [
  { _id:'n1', title:'Fee Payment Reminder',        type:'fee',     status:'Sent',  read:false, createdAt:'2026-09-18T09:00:00', message:'Fee for October 2026 is due on 10th October.' },
  { _id:'n2', title:'Mid Term Exam Schedule',       type:'exam',    status:'Sent',  read:false, createdAt:'2026-09-17T10:30:00', message:'Mid Term exams from 1st–10th Oct 2026.' },
  { _id:'n3', title:'School Holiday – Dussehra',   type:'general', status:'Sent',  read:true,  createdAt:'2026-09-15T08:00:00', message:'School closed 12th Oct. Resumes 13th.' },
  { _id:'n4', title:'Annual Day Announcement',      type:'event',   status:'Draft', read:false, createdAt:'2026-09-20T08:00:00', message:'Annual Day on 15th November 2026.' },
  { _id:'n5', title:'Transport Route Change',       type:'transport',status:'Draft',read:false, createdAt:'2026-09-19T15:00:00', message:'Route 02 revised from 25th September.' },
];

const TYPE_ICON_COLOR = {
  fee:       { color:'#16a34a', bg:'#dcfce7' },
  exam:      { color:'#8b5cf6', bg:'#f3e8ff' },
  general:   { color:'#3b82f6', bg:'#dbeafe' },
  library:   { color:'#06b6d4', bg:'#cffafe' },
  transport: { color:'#f59e0b', bg:'#fef3c7' },
  event:     { color:'#ec4899', bg:'#fce7f3' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return diff + 's ago';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400)return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

// ── Bell dropdown ─────────────────────────────────────────────────────────────
function NotifBell({ navigate }) {
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState(RECENT_NOTIFS);
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read:true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read:true })));
    toast.success('All marked as read');
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'relative', padding:8, borderRadius:10,
          background: open ? '#eff6ff' : 'transparent',
          border:'none', cursor:'pointer', display:'flex', alignItems:'center',
          transition:'background .15s',
        }}>
        <Bell size={20} color={open ? '#3b82f6' : '#6b7280'} />

        {/* Red badge */}
        {unreadCount > 0 && (
          <span style={{
            position:'absolute', top:2, right:2,
            minWidth:18, height:18, borderRadius:9,
            background:'#ef4444', color:'#fff',
            fontSize:10, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'0 4px', lineHeight:1,
            border:'2px solid #fff',
            boxShadow:'0 1px 4px rgba(239,68,68,.4)',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0,
          width:360, background:'#fff', borderRadius:14,
          boxShadow:'0 8px 32px rgba(0,0,0,.14), 0 1px 4px rgba(0,0,0,.08)',
          border:'1px solid #e5e7eb', zIndex:999, overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>Notifications</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
                {unreadCount > 0 ? unreadCount + ' unread' : 'All caught up!'}
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  style={{ fontSize:11, padding:'4px 10px', borderRadius:7,
                    border:'1px solid #e2e8f0', background:'#f8fafc',
                    color:'#3b82f6', cursor:'pointer', fontWeight:600 }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => { setOpen(false); navigate('/notifications'); }}
                style={{ fontSize:11, padding:'4px 10px', borderRadius:7,
                  border:'1px solid #bfdbfe', background:'#eff6ff',
                  color:'#1d4ed8', cursor:'pointer', fontWeight:600 }}>
                View all
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:'#94a3b8' }}>
                <Bell size={24} style={{ margin:'0 auto 8px', opacity:.3 }} />
                <div style={{ fontSize:13 }}>No notifications yet</div>
              </div>
            ) : notifs.map(n => {
              const cfg = TYPE_ICON_COLOR[n.type] || TYPE_ICON_COLOR.general;
              return (
                <div key={n._id}
                  onClick={() => { markRead(n._id); setOpen(false); navigate('/notifications'); }}
                  style={{
                    display:'flex', gap:12, padding:'12px 16px',
                    cursor:'pointer', transition:'background .12s',
                    background: n.read ? '#fff' : '#f8faff',
                    borderBottom:'1px solid #f8fafc',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'}
                  onMouseLeave={e=>e.currentTarget.style.background=n.read?'#fff':'#f8faff'}>

                  {/* Type dot */}
                  <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Bell size={15} color={cfg.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontWeight: n.read ? 500 : 700, fontSize:13, color:'#0f172a',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#3b82f6', flexShrink:0 }} />
                      )}
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', lineHeight:1.4,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {n.message}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                      <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10,
                        background: n.status==='Draft' ? '#fef9c3' : '#dcfce7',
                        color:      n.status==='Draft' ? '#d97706' : '#16a34a',
                        fontWeight:600 }}>
                        {n.status}
                      </span>
                      <span style={{ fontSize:10, color:'#94a3b8' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid #f1f5f9',
            background:'#f8fafc', textAlign:'center' }}>
            <button onClick={() => { setOpen(false); navigate('/notifications'); }}
              style={{ fontSize:12, fontWeight:700, color:'#3b82f6', background:'none',
                border:'none', cursor:'pointer' }}>
              Go to Notifications →
            </button>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'} bg-slate-800 text-white flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700">
          <div className="bg-blue-600 rounded-lg p-1.5"><School size={20} className="text-white" /></div>
          <div>
            <div className="font-bold text-sm">School ERP</div>
            <div className="text-xs text-slate-400">Management System</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : 'inactive'}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-700">
            <LogOut size={16} /><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            {/* Bell with badge and dropdown */}
            <NotifBell navigate={navigate} />
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}