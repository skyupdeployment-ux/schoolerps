import { useState } from 'react';
import { Plus, BookOpen, Users, Award, Printer, ChevronRight, X, Edit, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import ExamGroups from './ExamGroups';
import ExamResults from './ExamResults';
import AdmitCard from './AdmitCard';

const TABS = [
  { id: 'groups',  label: 'Exam Groups',  icon: BookOpen },
  { id: 'results', label: 'Exam Results', icon: Award },
  { id: 'admit',   label: 'Admit Cards',  icon: Printer },
];

export default function Examinations() {
  const [tab, setTab] = useState('groups');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
        <p className="text-gray-500 text-sm">Manage exam groups, results and admit cards</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:12, padding:4, width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, transition:'all .2s',
              background: tab === t.id ? '#fff' : 'transparent',
              color:       tab === t.id ? '#1e40af' : '#64748b',
              boxShadow:   tab === t.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'groups'  && <ExamGroups />}
      {tab === 'results' && <ExamResults />}
      {tab === 'admit'   && <AdmitCard />}
    </div>
  );
}