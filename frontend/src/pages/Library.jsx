// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus, Search, Edit, Trash2, X, Loader,
  BookOpen, Users, RotateCcw, ChevronDown,
  BookMarked, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Fiction','Non-Fiction','Science','Mathematics','History','Geography',
  'Literature','Reference','Biography','Technology','Arts','Sports','Religion','Other'];
const LANGUAGES  = ['English','Hindi','Kannada','Telugu','Tamil','Marathi','Other'];

const Sel = ({ label, required, children, ...p }) => (
  <div>
    {label && <label className="label">{label}{required&&' *'}</label>}
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

function StatusBadge({ status }) {
  const map = {
    Available: { bg:'#dcfce7', color:'#16a34a' },
    Issued:    { bg:'#dbeafe', color:'#1d4ed8' },
    Reserved:  { bg:'#fef9c3', color:'#d97706' },
    Lost:      { bg:'#fee2e2', color:'#dc2626' },
    Damaged:   { bg:'#fce7f3', color:'#be185d' },
  };
  const s = map[status] || { bg:'#f1f5f9', color:'#64748b' };
  return <span style={{ ...s, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{status}</span>;
}

const INIT_BOOK   = { title:'', author:'', isbn:'', category:'Science', language:'English', totalCopies:1, publisher:'', year:new Date().getFullYear(), description:'' };
const INIT_ISSUE  = { bookId:'', memberId:'', dueDate:'' };

export default function Library() {
  const [tab,        setTab]        = useState('books');
  const [books,      setBooks]      = useState([]);
  const [issued,     setIssued]     = useState([]);
  const [members, setMembers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [showIssue,  setShowIssue]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [selBook,    setSelBook]    = useState(null);
  const [form,       setForm]       = useState(INIT_BOOK);
  const [issueForm,  setIssueForm]  = useState(INIT_ISSUE);
  const [saving,     setSaving]     = useState(false);

  const inp = f => ({ value:form[f]||'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})) });

  // ── Load everything from the database ─────────
  const mapBook = b => ({
    _id:b._id, title:b.title||'', author:b.author||'', isbn:b.isbn||'', category:b.category||'',
    language:b.language||'', publisher:b.publisher||'', year:b.year||'',
    totalCopies:b.quantity||0, availableCopies:b.availableQuantity||0,
    status:(b.availableQuantity||0)>0 ? 'Available' : 'Issued',
  });

  const loadAll = async () => {
    try {
      const [bRes, tRes, sRes, teRes] = await Promise.all([
        api.get('/library/books',        { params:{ limit:500 } }),
        api.get('/library/transactions', { params:{ limit:500 } }),
        api.get('/students',             { params:{ limit:500 } }),
        api.get('/teachers',             { params:{ limit:200 } }),
      ]);
      const gradeOf = v => (v && typeof v==='object') ? (v.grade ?? v.name ?? '') : (v ?? '');
      const people = [
        ...(sRes.data.data||[]).map(x => ({ _id:x._id, name:`${x.firstName||''} ${x.lastName||''}`.trim(), admNo:x.admissionNumber||'', class:String(gradeOf(x.class)), phone:x.parentPhone||x.phone||'', memberType:'Student', joinDate:String(x.admissionDate||x.createdAt||'').slice(0,10) })),
        ...(teRes.data.data||[]).map(x => ({ _id:x._id, name:x.name||'', admNo:x.teacherId||'', class:'—', phone:x.phone||'', memberType:'Teacher', joinDate:String(x.joiningDate||x.createdAt||'').slice(0,10) })),
      ];
      const byId = new Map(people.map(x => [x._id, x]));
      const rawTx = tRes.data.data || [];
      const openCount = {};
      const tx = rawTx.map(t => {
        const bid = t.borrower?._id || t.borrower;
        const person = byId.get(bid);
        if (t.status !== 'Returned') openCount[bid] = (openCount[bid]||0) + 1;
        const nm = t.borrower ? (t.borrower.name || `${t.borrower.firstName||''} ${t.borrower.lastName||''}`.trim()) : '';
        return {
          _id:t._id, bookId:t.book?._id, bookTitle:t.book?.title || '(deleted book)',
          studentName:nm || person?.name || '—', admNo:person?.admNo || '', class:person?.class || '—',
          issueDate:String(t.issueDate||'').slice(0,10), dueDate:String(t.dueDate||'').slice(0,10),
          returnDate:t.returnDate ? String(t.returnDate).slice(0,10) : null, fine:t.fine||0, status:t.status,
        };
      });
      setBooks((bRes.data.data||[]).map(mapBook));
      setIssued(tx);
      setMembers(people.map(x => ({ ...x, booksIssued: openCount[x._id]||0 })));
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load library data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  // ── Book CRUD (saved to the database) ─────────
  const openAdd  = () => { setEditing(null); setForm(INIT_BOOK); setShowModal(true); };
  const openEdit = b  => { setEditing(b); setForm({...b}); setShowModal(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    const payload = {
      title:form.title, author:form.author, isbn:form.isbn, category:form.category,
      language:form.language, publisher:form.publisher,
      year: form.year ? Number(form.year) : undefined,
      quantity: Number(form.totalCopies),
    };
    try {
      if (editing) { await api.put(`/library/books/${editing._id}`, payload); toast.success('Book updated!'); }
      else         { await api.post('/library/books', payload);               toast.success('Book added!'); }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save book');
    } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this book?')) return;
    try { await api.delete(`/library/books/${id}`); toast.success('Book removed'); await loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not delete book'); }
  };

  // ── Issue / return ────────────────────────────
  const openIssue = b => { setSelBook(b); setIssueForm({ ...INIT_ISSUE, bookId:b._id, dueDate:new Date(Date.now()+14*86400000).toISOString().split('T')[0] }); setShowIssue(true); };

  const handleIssue = async e => {
    e.preventDefault();
    const m = members.find(x => x._id === issueForm.memberId);
    if (!m) { toast.error('Please select a student or teacher'); return; }
    setSaving(true);
    try {
      await api.post('/library/transactions/issue', { bookId:selBook._id, borrower:m._id, borrowerModel:m.memberType, dueDate:issueForm.dueDate });
      toast.success('Book issued to ' + m.name);
      setShowIssue(false);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not issue book');
    } finally { setSaving(false); }
  };

  const handleReturn = async rec => {
    try {
      const res  = await api.put(`/library/transactions/${rec._id}/return`);
      const fine = res.data?.data?.fine || 0;
      toast.success('Book returned' + (fine>0 ? ' — Fine: Rs.' + fine : ' — No fine'));
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not return book');
    }
  };
  const totalBooks     = books.length;
  const totalIssued    = issued.filter(r => r.status==='Issued'||r.status==='Overdue').length;
  const totalOverdue   = issued.filter(r => r.status==='Overdue').length;
  const totalAvailable = books.reduce((s,b) => s + (b.availableCopies||0), 0);

  const filteredBooks = books.filter(b =>
    (!search    || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || (b.isbn||'').includes(search))
    && (!catFilter || b.category === catFilter)
  );

  const TABS = [
    { id:'books',   label:'Books',        icon:BookOpen   },
    { id:'issued',  label:'Issued Books', icon:BookMarked },
    { id:'members', label:'Members',      icon:Users      },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-gray-500 text-sm">Manage books, issue and return tracking</p>
          {loading && <p className="text-sm" style={{ color:'#64748b' }}>Loading library data…</p>}
          {loadError && <p className="text-sm" style={{ color:'#dc2626' }}>{loadError}</p>}
        </div>
        {tab==='books' && <button onClick={openAdd} className="btn-primary"><Plus size={14}/> Add Book</button>}
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
        {[
          { label:'Total Books',   value:totalBooks,     color:'#3b82f6', icon:BookOpen    },
          { label:'Available',     value:totalAvailable, color:'#16a34a', icon:CheckCircle },
          { label:'Issued',        value:totalIssued,    color:'#d97706', icon:BookMarked  },
          { label:'Overdue',       value:totalOverdue,   color:'#dc2626', icon:AlertCircle },
          { label:'Members',       value:members.length, color:'#8b5cf6', icon:Users       },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'12px 14px', display:'flex', gap:10, alignItems:'center', position:'relative', overflow:'hidden' }}>
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

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #f1f5f9' }}>
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

      {/* ── Books Tab ── */}
      {tab==='books' && (
        <div className="space-y-4">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
              <input className="input-field" placeholder="Search by title, author, ISBN..."
                style={{ paddingLeft:28 }} value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <Sel value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </Sel>
          </div>

          <div className="card">
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Language</th><th>Total</th><th>Available</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b,i) => (
                    <tr key={b._id}>
                      <td style={{ color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                      <td>
                        <div style={{ fontWeight:700 }}>{b.title}</div>
                        {b.publisher && <div style={{ fontSize:11, color:'#94a3b8' }}>{b.publisher} {b.year}</div>}
                      </td>
                      <td style={{ fontSize:13 }}>{b.author}</td>
                      <td style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{b.isbn}</td>
                      <td>
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:12, background:'#dbeafe', color:'#1d4ed8' }}>{b.category}</span>
                      </td>
                      <td style={{ fontSize:12 }}>{b.language}</td>
                      <td style={{ textAlign:'center', fontWeight:700 }}>{b.totalCopies}</td>
                      <td style={{ textAlign:'center', fontWeight:700, color:b.availableCopies>0?'#16a34a':'#dc2626' }}>{b.availableCopies}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          {b.availableCopies > 0 && (
                            <button onClick={() => openIssue(b)}
                              style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #bfdbfe', background:'#eff6ff', color:'#3b82f6', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                              Issue
                            </button>
                          )}
                          <button onClick={() => openEdit(b)}
                            style={{ padding:5, borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#475569', display:'flex' }}>
                            <Edit size={12}/>
                          </button>
                          <button onClick={() => handleDelete(b._id)}
                            style={{ padding:5, borderRadius:6, border:'1px solid #fecaca', background:'#fff5f5', cursor:'pointer', color:'#ef4444', display:'flex' }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length===0 && (
                    <tr><td colSpan={10} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No books found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Issued Tab ── */}
      {tab==='issued' && (
        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr><th>Book</th><th>Student</th><th>Class</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Fine</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {issued.map(r => {
                  const isOverdue = !r.returnDate && r.dueDate < new Date().toISOString().split('T')[0];
                  const days = isOverdue ? Math.ceil((new Date()-new Date(r.dueDate))/86400000) : 0;
                  return (
                    <tr key={r._id}>
                      <td style={{ fontWeight:700, fontSize:13 }}>{r.bookTitle}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{r.studentName}</div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{r.admNo}</div>
                      </td>
                      <td style={{ fontSize:12 }}>Class {r.class}</td>
                      <td style={{ fontSize:12 }}>{r.issueDate}</td>
                      <td style={{ fontSize:12, color:isOverdue?'#dc2626':'inherit', fontWeight:isOverdue?700:400 }}>{r.dueDate}</td>
                      <td style={{ fontSize:12, color:'#16a34a' }}>{r.returnDate || '—'}</td>
                      <td style={{ fontWeight:700, color:r.fine>0?'#dc2626':'#16a34a' }}>
                        {r.fine > 0 ? 'Rs.' + r.fine : '—'}
                        {isOverdue && days > 0 && <div style={{ fontSize:10, color:'#dc2626' }}>{days}d × Rs.5</div>}
                      </td>
                      <td>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20,
                          background: r.status==='Returned'?'#dcfce7':r.status==='Overdue'||isOverdue?'#fee2e2':'#dbeafe',
                          color:      r.status==='Returned'?'#16a34a':r.status==='Overdue'||isOverdue?'#dc2626':'#1d4ed8' }}>
                          {isOverdue && r.status!=='Returned' ? 'Overdue' : r.status}
                        </span>
                      </td>
                      <td>
                        {!r.returnDate && (
                          <button onClick={() => handleReturn(r)}
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px',
                              borderRadius:7, border:'1px solid #bbf7d0', background:'#f0fdf4',
                              color:'#16a34a', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                            <RotateCcw size={11}/> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {issued.length===0 && (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No issued books</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Members Tab ── */}
      {tab==='members' && (
        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Adm/Emp No</th><th>Class</th><th>Phone</th><th>Type</th><th>Books Issued</th><th>Join Date</th></tr>
              </thead>
              <tbody>
                {members.map((m,i) => (
                  <tr key={m._id}>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'#dbeafe',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:800, fontSize:12, color:'#1d4ed8' }}>{m.name[0]}</div>
                        <span style={{ fontWeight:700 }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:12, color:'#64748b' }}>{m.admNo}</td>
                    <td style={{ fontSize:12 }}>{m.class}</td>
                    <td style={{ fontSize:12 }}>{m.phone}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20,
                        background:m.memberType==='Teacher'?'#dcfce7':'#dbeafe',
                        color:m.memberType==='Teacher'?'#16a34a':'#1d4ed8' }}>{m.memberType}</span>
                    </td>
                    <td style={{ textAlign:'center', fontWeight:700, color:m.booksIssued>0?'#d97706':'#16a34a' }}>{m.booksIssued}</td>
                    <td style={{ fontSize:12, color:'#64748b' }}>{m.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, maxWidth:580, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'16px 20px', borderBottom:'1px solid #f1f5f9',
              position:'sticky', top:0, background:'#fff', zIndex:5 }}>
              <div style={{ fontWeight:800, fontSize:15 }}>{editing ? 'Edit Book' : 'Add New Book'}</div>
              <button onClick={()=>setShowModal(false)} style={{ padding:7, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={14}/></button>
            </div>
            <form onSubmit={handleSave} style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="label">Book Title *</label>
                <input required className="input-field" placeholder="e.g. Mathematics Class 10" {...inp('title')} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="label">Author *</label>
                  <input required className="input-field" placeholder="Author name" {...inp('author')} />
                </div>
                <div>
                  <label className="label">ISBN</label>
                  <input className="input-field" placeholder="978-..." {...inp('isbn')} />
                </div>
                <Sel label="Category" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </Sel>
                <Sel label="Language" value={form.language} onChange={e=>setForm(p=>({...p,language:e.target.value}))}>
                  {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                </Sel>
                <div>
                  <label className="label">Publisher</label>
                  <input className="input-field" placeholder="Publisher name" {...inp('publisher')} />
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input-field" {...inp('year')} />
                </div>
                <div>
                  <label className="label">Total Copies *</label>
                  <input required type="number" min="1" className="input-field" {...inp('totalCopies')} />
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin"/> Saving...</> : editing ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssue && selBook && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:50,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, maxWidth:460, width:'100%' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'16px 20px', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ fontWeight:800, fontSize:15 }}>Issue Book</div>
              <button onClick={()=>setShowIssue(false)} style={{ padding:7, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer' }}><X size={14}/></button>
            </div>
            <form onSubmit={handleIssue} style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:12 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#16a34a' }}>{selBook.title}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>by {selBook.author} · {selBook.availableCopies} copies available</div>
              </div>
              <div>
                <label className="label">Student / Teacher *</label>
                <div style={{ position:'relative' }}>
                  <select required className="input-field" style={{ appearance:'none', paddingRight:28 }}
                    value={issueForm.memberId} onChange={e=>setIssueForm(p=>({...p,memberId:e.target.value}))}>
                    <option value="">Select a member…</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.name} — {m.memberType}{m.admNo ? ' (' + m.admNo + ')' : ''}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
                </div>
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input required type="date" className="input-field"
                  value={issueForm.dueDate} onChange={e=>setIssueForm(p=>({...p,dueDate:e.target.value}))} />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
                <button type="button" onClick={()=>setShowIssue(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><Loader size={13} className="animate-spin"/> Issuing...</> : 'Issue Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}