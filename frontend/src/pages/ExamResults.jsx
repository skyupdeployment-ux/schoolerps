import { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, TrendingUp, Award, Users, X, Medal, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const DEMO_GROUPS = [
  { _id:'1', name:'Mid Term 2025 – Class 10A', class:'10', section:'A', subjects:['Mathematics','Science','English','Hindi'], totalMarks:100, passingMarks:35 },
  { _id:'2', name:'Unit Test – Class 9B',      class:'9',  section:'B', subjects:['Mathematics','Physics'],                   totalMarks:50,  passingMarks:18 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGrade(pct) {
  if (pct >= 90) return { g:'A+', c:'#16a34a' };
  if (pct >= 80) return { g:'A',  c:'#059669' };
  if (pct >= 70) return { g:'B+', c:'#0284c7' };
  if (pct >= 60) return { g:'B',  c:'#2563eb' };
  if (pct >= 50) return { g:'C',  c:'#d97706' };
  if (pct >= 35) return { g:'D',  c:'#dc2626' };
  return { g:'F', c:'#be123c' };
}

function ResultBar({ pct }) {
  const { c } = getGrade(pct);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden', minWidth:60 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:3, transition:'width .5s' }} />
      </div>
    </div>
  );
}

// ── Medal / rank badge ────────────────────────────────────────────────────────
function RankBadge({ rank, tied }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
      {medal
        ? <span style={{ fontSize:20 }}>{medal}</span>
        : <span style={{
            width:28, height:28, borderRadius:'50%', background:'#f1f5f9',
            color:'#64748b', fontWeight:800, fontSize:12,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>{rank}</span>
      }
      {tied && (
        <span style={{ fontSize:9, fontWeight:700, color:'#3b82f6',
          background:'#eff6ff', borderRadius:4, padding:'1px 4px', letterSpacing:.3 }}>
          TIED
        </span>
      )}
    </div>
  );
}

// ── Tied group separator row ──────────────────────────────────────────────────
function TieGroupHeader({ rank, count, pct, colSpan }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `Rank ${rank}`;
  return (
    <tr>
      <td colSpan={colSpan} style={{
        background: rank === 1 ? '#fffbeb' : rank === 2 ? '#f8f9ff' : rank === 3 ? '#fff7f0' : '#f8fafc',
        padding:'6px 16px', borderTop:'2px solid',
        borderTopColor: rank === 1 ? '#fcd34d' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#fdba74' : '#e2e8f0',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>{typeof medal === 'string' && medal.includes('🥇') || medal.includes('🥈') || medal.includes('🥉') ? medal : ''}</span>
          <span style={{ fontSize:12, fontWeight:700, color:'#475569' }}>
            {typeof medal === 'string' && !medal.startsWith('Rank') ? `Rank ${rank}` : medal}
            {count > 1 && (
              <span style={{ marginLeft:8, fontSize:11, fontWeight:600,
                background:'#3b82f6', color:'#fff', borderRadius:12, padding:'1px 8px' }}>
                {count} students tied · {pct}%
              </span>
            )}
          </span>
        </div>
      </td>
    </tr>
  );
}

// ── Rank leaderboard card ─────────────────────────────────────────────────────
function RankBoard({ rankedStudents, group }) {
  if (!rankedStudents.length) return (
    <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
      <Medal size={36} style={{ margin:'0 auto 10px', opacity:.3 }} />
      <div style={{ fontSize:14, fontWeight:600 }}>Enter marks first to see the rank list</div>
    </div>
  );

  const maxTotal = (group.totalMarks || 100) * (group.subjects?.length || 1);

  // Group students by rank for tie detection
  const rankGroups = {};
  rankedStudents.forEach(s => {
    if (!rankGroups[s.rank]) rankGroups[s.rank] = [];
    rankGroups[s.rank].push(s);
  });

  // Build podium groups — rank 1, 2, 3 (each may have multiple students)
  const rank1 = rankGroups[1] || [];
  const rank2 = rankGroups[2] || [];
  const rank3 = rankGroups[3] || [];

  const PodiumSlot = ({ students: slotStudents, medal, bg, border, avatarBg, avatarColor, height }) => {
    if (!slotStudents.length) return null;
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, maxWidth: slotStudents.length > 1 ? 180 : 90 }}>
        {medal === '🥇' && <div style={{ fontSize:20 }}>👑</div>}
        {/* Avatar row — stacked if tied */}
        <div style={{ display:'flex', gap: slotStudents.length > 1 ? -8 : 0, flexWrap:'wrap', justifyContent:'center' }}>
          {slotStudents.map((s, i) => (
            <div key={s._id} style={{
              width: medal==='🥇' ? 56 : 46, height: medal==='🥇' ? 56 : 46,
              borderRadius:'50%', background: avatarBg,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize: medal==='🥇' ? 20 : 16,
              color: avatarColor, border:`3px solid ${border}`,
              marginLeft: i > 0 ? -10 : 0, zIndex: slotStudents.length - i,
            }}>{s.name[0]}</div>
          ))}
        </div>
        {/* Names */}
        <div style={{ textAlign:'center' }}>
          {slotStudents.map(s => (
            <div key={s._id} style={{ fontSize: medal==='🥇' ? 13 : 11, fontWeight:700, color:'#0f172a',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>
              {s.name}
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'#16a34a' }}>{slotStudents[0]?.pct}%</div>
        {slotStudents.length > 1 && (
          <div style={{ fontSize:10, fontWeight:700, color:'#3b82f6',
            background:'#eff6ff', borderRadius:10, padding:'2px 8px' }}>
            {slotStudents.length} tied
          </div>
        )}
        {/* Podium block */}
        <div style={{ background:bg, borderRadius:'6px 6px 0 0', width: Math.max(70, slotStudents.length * 30), height,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:22 }}>{medal}</span>
        </div>
      </div>
    );
  };

  const totalCols = 4 + group.subjects.length; // rank + student + subjects + total + % + grade + result = 7 + subjects

  return (
    <div className="card">
      {/* ── Podium ── */}
      <div style={{ padding:'20px 24px 0', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:16 }}>
          Top Performers — {group.name}
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:20, marginBottom:20 }}>
          <PodiumSlot students={rank2} medal="🥈" bg="#e2e8f0" border="#cbd5e1" avatarBg="#f1f5f9" avatarColor="#64748b" height={60} />
          <PodiumSlot students={rank1} medal="🥇" bg="#fef3c7" border="#fcd34d" avatarBg="#fef3c7" avatarColor="#d97706" height={84} />
          <PodiumSlot students={rank3} medal="🥉" bg="#fef6ee" border="#fdba74" avatarBg="#fef6ee" avatarColor="#d97706" height={44} />
        </div>
      </div>

      {/* ── Tie summary banner (shows when any rank has multiple students) ── */}
      {Object.values(rankGroups).some(g => g.length > 1) && (
        <div style={{ margin:'12px 16px 0', background:'#eff6ff', border:'1px solid #bfdbfe',
          borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>🤝</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#1d4ed8' }}>Tied Ranks Detected</div>
            <div style={{ fontSize:11, color:'#3b82f6', marginTop:2 }}>
              {Object.entries(rankGroups)
                .filter(([, g]) => g.length > 1)
                .map(([rank, g]) => `Rank ${rank}: ${g.length} students (${g[0].pct}%)`)
                .join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* ── Full rank table ── */}
      <div style={{ overflowX:'auto', marginTop:12 }}>
        <table>
          <thead>
            <tr>
              <th style={{ minWidth:60 }}>Rank</th>
              <th>Student</th>
              {group.subjects.map(s => <th key={s} style={{ whiteSpace:'nowrap', textAlign:'center' }}>{s}</th>)}
              <th style={{ textAlign:'center' }}>Total /{maxTotal}</th>
              <th style={{ minWidth:130 }}>Percentage</th>
              <th>Grade</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rankGroups).map(([rank, groupStudents]) => {
              const rankNum  = Number(rank);
              const isTied   = groupStudents.length > 1;
              const rowBg    = rankNum === 1 ? '#fffbeb' : rankNum === 2 ? '#f8f9ff' : rankNum === 3 ? '#fff7f0' : 'transparent';
              const borderTop = rankNum === 1 ? '#fcd34d' : rankNum === 2 ? '#cbd5e1' : rankNum === 3 ? '#fdba74' : '#f1f5f9';

              return groupStudents.map((s, si) => {
                const { g, c } = getGrade(s.pct);
                return (
                  <tr key={s._id} style={{
                    background: rowBg,
                    borderTop: si === 0 ? `2px solid ${borderTop}` : 'none',
                  }}>
                    {/* Rank cell — only on first row of tie group */}
                    {si === 0 && (
                      <td rowSpan={groupStudents.length} style={{ verticalAlign:'middle', textAlign:'center', borderRight:'1px solid #f1f5f9' }}>
                        <RankBadge rank={rankNum} tied={isTied} />
                        {isTied && (
                          <div style={{ fontSize:9, color:'#94a3b8', marginTop:3 }}>
                            {groupStudents.length} students
                          </div>
                        )}
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:6 }}>
                        {s.name}
                        {isTied && (
                          <span style={{ fontSize:9, background:'#eff6ff', color:'#3b82f6',
                            border:'1px solid #bfdbfe', borderRadius:4, padding:'1px 5px', fontWeight:700 }}>
                            TIED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>Roll: {s.rollNo}</div>
                    </td>
                    {group.subjects.map(sub => (
                      <td key={sub} style={{ textAlign:'center', fontWeight:600, color:'#475569' }}>
                        {s.marks[sub] !== undefined ? s.marks[sub] : '—'}
                      </td>
                    ))}
                    <td style={{ fontWeight:800, color:'#0f172a', textAlign:'center' }}>
                      {s.total}
                    </td>
                    <td style={{ minWidth:130 }}>
                      <div style={{ fontWeight:700, color:c, marginBottom:3 }}>{s.pct}%</div>
                      <ResultBar pct={s.pct} />
                    </td>
                    <td><span style={{ fontSize:14, fontWeight:900, color:c }}>{g}</span></td>
                    <td>
                      <span style={{
                        fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                        background: s.passed ? '#dcfce7' : '#fee2e2',
                        color:      s.passed ? '#16a34a' : '#dc2626',
                      }}>
                        {s.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Result List Component ────────────────────────────────────────────────────
function ResultList({ rankedStudents, group }) {
  const maxTotal = (group.totalMarks || 100) * (group.subjects?.length || 1);

  // ── Export CSV ──
  const exportCSV = () => {
    const header = ['Rank','Student Name','Roll No','Adm No',
      ...group.subjects, 'Total', 'Percentage', 'Grade', 'Result'].join(',');
    const rows = rankedStudents.map(s => {
      const { g } = getGrade(s.pct);
      return [
        s.rank, `"${s.name}"`, s.rollNo, s.admNo,
        ...group.subjects.map(sub => s.marks[sub] ?? 0),
        s.total, `${s.pct}%`, g, s.passed ? 'Pass' : 'Fail'
      ].join(',');
    });
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`Result_${group.name.replace(/\s+/g,'_')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Print result sheet ──
  const printResult = () => {
    const rows = rankedStudents.map(s => {
      const { g, c } = getGrade(s.pct);
      const subjectCells = group.subjects.map(sub =>
        `<td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;">${s.marks[sub] ?? '—'}</td>`
      ).join('');
      return `
        <tr style="background:${s.rank===1?'#fffbeb':s.rank===2?'#f8f9ff':s.rank===3?'#fff7f0':'#fff'}">
          <td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;">
            ${s.rank===1?'🥇':s.rank===2?'🥈':s.rank===3?'🥉':s.rank}
          </td>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:600;">${s.name}</td>
          <td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;">${s.rollNo}</td>
          ${subjectCells}
          <td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;font-weight:800;">${s.total}/${maxTotal}</td>
          <td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;color:${c}">${s.pct}%</td>
          <td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;font-weight:900;color:${c}">${g}</td>
          <td style="text-align:center;padding:7px 10px;border:1px solid #e2e8f0;">
            <span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;
              background:${s.passed?'#dcfce7':'#fee2e2'};color:${s.passed?'#16a34a':'#dc2626'}">
              ${s.passed?'PASS':'FAIL'}
            </span>
          </td>
        </tr>`;
    }).join('');

    const subjectHeaders = group.subjects.map(s =>
      `<th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;background:#1e3a8a;color:#fff;">${s}<br><span style="font-size:10px;font-weight:400">/${group.totalMarks}</span></th>`
    ).join('');

    const passCount = rankedStudents.filter(s=>s.passed).length;
    const topScore  = rankedStudents[0]?.pct || 0;
    const avgScore  = rankedStudents.length
      ? Math.round(rankedStudents.reduce((s,r)=>s+r.pct,0)/rankedStudents.length)
      : 0;

    const html = `
      <html><head><title>Result – ${group.name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;padding:24px;color:#0f172a;font-size:13px}
        .header{text-align:center;border-bottom:3px solid #1e3a8a;padding-bottom:14px;margin-bottom:16px}
        .school{font-size:20px;font-weight:700;color:#1e3a8a}
        .subtitle{font-size:13px;color:#475569;margin-top:3px}
        .exam-title{font-size:16px;font-weight:700;text-align:center;
          background:#1e3a8a;color:#fff;padding:8px;border-radius:6px;margin:14px 0 10px}
        .stats{display:flex;gap:24px;justify-content:center;margin-bottom:14px;flex-wrap:wrap}
        .stat{text-align:center;padding:8px 20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
        .stat-val{font-size:18px;font-weight:800;color:#1e3a8a}
        .stat-lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th{padding:8px 10px;border:1px solid #e2e8f0;background:#1e3a8a;color:#fff;font-size:12px;text-align:center}
        @media print{body{padding:10px}button{display:none}}
      </style></head>
      <body>
        <div class="header">
          <div class="school">🏫 Greenfield Public School</div>
          <div class="subtitle">123 School Road, Bengaluru | Ph: 080-12345678</div>
        </div>
        <div class="exam-title">RESULT SHEET — ${group.name.toUpperCase()}</div>
        <div class="stats">
          <div class="stat"><div class="stat-val">${rankedStudents.length}</div><div class="stat-lbl">Total Students</div></div>
          <div class="stat"><div class="stat-val" style="color:#16a34a">${passCount}</div><div class="stat-lbl">Passed</div></div>
          <div class="stat"><div class="stat-val" style="color:#ef4444">${rankedStudents.length-passCount}</div><div class="stat-lbl">Failed</div></div>
          <div class="stat"><div class="stat-val">${topScore}%</div><div class="stat-lbl">Top Score</div></div>
          <div class="stat"><div class="stat-val">${avgScore}%</div><div class="stat-lbl">Class Average</div></div>
          <div class="stat"><div class="stat-val">${Math.round(passCount/rankedStudents.length*100)}%</div><div class="stat-lbl">Pass %</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th style="text-align:left">Student Name</th>
              <th>Roll No</th>
              ${subjectHeaders}
              <th>Total /${maxTotal}</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;text-align:center">
          <div><div style="border-top:1px solid #000;padding-top:5px;font-size:11px;color:#475569">Class Teacher</div></div>
          <div><div style="border-top:1px solid #000;padding-top:5px;font-size:11px;color:#475569">Exam In-charge</div></div>
          <div><div style="border-top:1px solid #000;padding-top:5px;font-size:11px;color:#475569">Principal</div></div>
        </div>
        <p style="text-align:center;font-size:10px;color:#94a3b8;margin-top:20px">
          Computer-generated result sheet · ${group.name} · Greenfield Public School
        </p>
      </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const passCount = rankedStudents.filter(s=>s.passed).length;
  const avgScore  = rankedStudents.length
    ? Math.round(rankedStudents.reduce((s,r)=>s+r.pct,0)/rankedStudents.length)
    : 0;

  if (!rankedStudents.length) return (
    <div className="card" style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
      <Award size={36} style={{ margin:'0 auto 10px', opacity:.3 }} />
      <div style={{ fontSize:14, fontWeight:600 }}>Enter marks first to generate the result list</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div style={{ display:'flex', gap:10, justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>Result Sheet — {group.name}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
            Class {group.class}{group.section?`-${group.section}`:''} · {rankedStudents.length} students
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} className="btn-secondary" style={{ fontSize:12 }}>
            <Download size={14}/> Export CSV
          </button>
          <button onClick={printResult}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9,
              border:'none', background:'#1e3a8a', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            <Printer size={14}/> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12 }}>
        {[
          { label:'Total Students', value:rankedStudents.length, color:'#3b82f6' },
          { label:'Passed',         value:passCount,             color:'#16a34a' },
          { label:'Failed',         value:rankedStudents.length-passCount, color:'#ef4444' },
          { label:'Class Average',  value:`${avgScore}%`,        color:'#8b5cf6' },
          { label:'Top Score',      value:`${rankedStudents[0]?.pct||0}%`, color:'#f59e0b' },
          { label:'Pass %',         value:`${rankedStudents.length?Math.round(passCount/rankedStudents.length*100):0}%`, color:'#06b6d4' },
        ].map(k => (
          <div key={k.label} className="card"
            style={{ padding:'12px 14px', borderTop:`3px solid ${k.color}`, textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:k.color, marginTop:2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Result table */}
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign:'center' }}>Rank</th>
                <th>Student</th>
                <th style={{ textAlign:'center' }}>Roll No</th>
                {group.subjects.map(s => (
                  <th key={s} style={{ textAlign:'center', whiteSpace:'nowrap' }}>
                    {s}<br/>
                    <span style={{ fontWeight:400, fontSize:10 }}>/{group.totalMarks}</span>
                  </th>
                ))}
                <th style={{ textAlign:'center' }}>Total<br/><span style={{ fontWeight:400, fontSize:10 }}>/{maxTotal}</span></th>
                <th style={{ minWidth:120 }}>Percentage</th>
                <th style={{ textAlign:'center' }}>Grade</th>
                <th style={{ textAlign:'center' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {rankedStudents.map(s => {
                const { g, c } = getGrade(s.pct);
                const rowBg = s.rank===1?'#fffbeb':s.rank===2?'#f8f9ff':s.rank===3?'#fff7f0':'transparent';
                return (
                  <tr key={s._id} style={{ background:rowBg }}>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontSize:18 }}>
                        {s.rank===1?'🥇':s.rank===2?'🥈':s.rank===3?'🥉':
                          <span style={{ width:26, height:26, borderRadius:'50%', background:'#f1f5f9',
                            color:'#64748b', fontWeight:800, fontSize:12, display:'inline-flex',
                            alignItems:'center', justifyContent:'center' }}>{s.rank}</span>
                        }
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight:700, color:'#0f172a' }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>Adm: {s.admNo}</div>
                    </td>
                    <td style={{ textAlign:'center', fontWeight:600, color:'#475569' }}>{s.rollNo}</td>
                    {group.subjects.map(sub => {
                      const m = s.marks[sub];
                      const fail = m !== undefined && m < group.passingMarks;
                      return (
                        <td key={sub} style={{ textAlign:'center', fontWeight:700,
                          color: fail ? '#dc2626' : '#0f172a',
                          background: fail ? '#fff5f5' : 'transparent' }}>
                          {m !== undefined ? m : '—'}
                        </td>
                      );
                    })}
                    <td style={{ textAlign:'center', fontWeight:800, fontSize:15, color:'#0f172a' }}>
                      {s.total}
                    </td>
                    <td style={{ minWidth:130 }}>
                      <div style={{ fontWeight:700, color:c, marginBottom:3 }}>{s.pct}%</div>
                      <div style={{ height:5, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
                        <div style={{ width:`${s.pct}%`, height:'100%', background:c, borderRadius:3 }} />
                      </div>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontWeight:900, fontSize:16, color:c }}>{g}</span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20,
                        background: s.passed ? '#dcfce7' : '#fee2e2',
                        color:      s.passed ? '#16a34a' : '#dc2626' }}>
                        {s.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grade legend */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid #f1f5f9', background:'#f8fafc',
          display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>Grade Scale:</span>
          {[
            { g:'A+', label:'≥90%', c:'#16a34a' }, { g:'A',  label:'≥80%', c:'#059669' },
            { g:'B+', label:'≥70%', c:'#0284c7' }, { g:'B',  label:'≥60%', c:'#2563eb' },
            { g:'C',  label:'≥50%', c:'#d97706' }, { g:'D',  label:'≥35%', c:'#dc2626' },
            { g:'F',  label:'<35%', c:'#be123c' },
          ].map(x => (
            <span key={x.g} style={{ fontSize:11, padding:'2px 8px', borderRadius:10,
              background:`${x.c}15`, color:x.c, fontWeight:700 }}>
              {x.g} {x.label}
            </span>
          ))}
          <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>
            Passing marks: {group.passingMarks}/{group.totalMarks} per subject
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ExamResults() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [results, setResults]   = useState({});
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState('marks'); // 'marks' | 'ranks'
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Load real students from API
  useEffect(() => {
    setLoadingStudents(true);
    api.get('/students', { params: { limit: 500 } })
      .then(res => {
        const raw = res.data.data || [];
        setStudents(raw.map((s, i) => ({
          _id:    s._id,
          name:   `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          rollNo: s.rollNumber || String(i + 1).padStart(2, '0'),
          admNo:  s.admissionNumber || '—',
        })));
      })
      .catch(() => {
        setStudents([
          { _id:'s1', name:'Arjun Sharma',    rollNo:'01', admNo:'ADM001' },
          { _id:'s2', name:'Priya Patel',     rollNo:'02', admNo:'ADM002' },
          { _id:'s3', name:'Rahul Kumar',     rollNo:'03', admNo:'ADM003' },
          { _id:'s4', name:'Sneha Reddy',     rollNo:'04', admNo:'ADM004' },
          { _id:'s5', name:'Sidda Madabhavi', rollNo:'05', admNo:'123'    },
        ]);
      })
      .finally(() => setLoadingStudents(false));
  }, []);

  const group = DEMO_GROUPS.find(g => g._id === selectedGroup);

  const filteredStudents = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Computed values ───────────────────────────────────────────────────────
  const getTotal = (sid) =>
    (group?.subjects || []).reduce((sum, sub) => sum + (results[sid]?.[sub] || 0), 0);

  const getPercent = (sid) => {
    const maxPossible = (group?.totalMarks || 100) * (group?.subjects?.length || 1);
    return maxPossible > 0 ? Math.round((getTotal(sid) / maxPossible) * 100) : 0;
  };

  const isPassed = (sid) =>
    group?.subjects?.every(sub => (results[sid]?.[sub] || 0) >= group.passingMarks) ?? false;

  // ── Ranked list — sorted by total desc, ties share same rank ─────────────
  const getRankedStudents = () => {
    const sorted = [...students]
      .map(s => ({
        ...s,
        total:  getTotal(s._id),
        pct:    getPercent(s._id),
        passed: isPassed(s._id),
        marks:  results[s._id] || {},
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    // Assign ranks — tied students get the same rank
    let rank = 1;
    return sorted.map((s, i) => {
      if (i > 0 && s.total < sorted[i - 1].total) rank = i + 1;
      return { ...s, rank };
    });
  };

  const rankedStudents = getRankedStudents();
  const passCount = students.filter(s => isPassed(s._id)).length;
  const avgPct    = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + getPercent(s._id), 0) / students.length)
    : 0;

  const setMark = (sid, sub, val) => {
    const num = Math.max(0, Math.min(Number(val), group?.totalMarks || 100));
    setResults(r => ({ ...r, [sid]: { ...(r[sid] || {}), [sub]: num } }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaved(true); setSaving(false);
    toast.success('Results saved!');
  };

  return (
    <div className="space-y-5">

      {/* ── Group selector + action buttons ── */}
      <div className="card p-4" style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label className="label">Select Exam Group</label>
          <div style={{ position:'relative' }}>
            <select className="input-field" style={{ appearance:'none', paddingRight:28 }}
              value={selectedGroup}
              onChange={e => { setSelectedGroup(e.target.value); setResults({}); setSaved(false); setActiveTab('marks'); }}>
              <option value="">-- Choose an exam group --</option>
              {DEMO_GROUPS.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} />
          </div>
        </div>
        {group && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : saved ? '✓ Saved' : 'Save Results'}
            </button>
            <button onClick={() => setShowStats(s => !s)} className="btn-secondary">
              <TrendingUp size={14} /> Stats
            </button>
          </div>
        )}
      </div>

      {/* ── Stats cards ── */}
      {group && showStats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
          {[
            { label:'Total Students', value: students.length,              color:'#3b82f6', icon: Users  },
            { label:'Passed',         value: passCount,                    color:'#16a34a', icon: Award  },
            { label:'Failed',         value: students.length - passCount,  color:'#ef4444', icon: X      },
            { label:'Class Average',  value: avgPct+'%',                   color:'#8b5cf6', icon: TrendingUp },
            { label:'Top Score',      value: rankedStudents[0]?.pct+'%' || '—', color:'#f59e0b', icon: Medal },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:'14px 16px', display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ background:`${s.color}18`, borderRadius:10, padding:9, flexShrink:0 }}>
                <s.icon size={16} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.4 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#0f172a' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab switcher: Marks entry vs Rank list ── */}
      {group && (
        <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:10, padding:4, width:'fit-content' }}>
          {[
            { id:'marks',  label:'📝 Enter Marks'  },
            { id:'ranks',  label:'🏆 Rank List'    },
            { id:'result', label:'📄 Result List'  },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding:'7px 18px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600, transition:'all .2s',
                background: activeTab === t.id ? '#fff' : 'transparent',
                color:       activeTab === t.id ? '#1e40af' : '#64748b',
                boxShadow:   activeTab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Marks entry table ── */}
      {group && activeTab === 'marks' && (
        <div className="card">
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, color:'#0f172a' }}>Enter Marks — {group.name}</div>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
              <input className="input-field" placeholder="Search student..." style={{ paddingLeft:28, width:180, fontSize:12 }}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {loadingStudents ? (
            <div style={{ padding:32, textAlign:'center', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Loader size={16} className="animate-spin" /> Loading students...
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    {group.subjects.map(s => <th key={s} style={{ whiteSpace:'nowrap' }}>{s} /{group.totalMarks}</th>)}
                    <th>Total</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => {
                    const total    = getTotal(s._id);
                    const pct      = getPercent(s._id);
                    const pass     = isPassed(s._id);
                    const { g, c } = getGrade(pct);
                    const maxTotal = group.totalMarks * group.subjects.length;
                    return (
                      <tr key={s._id}>
                        <td style={{ color:'#94a3b8' }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight:600, color:'#0f172a' }}>{s.name}</div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>Roll: {s.rollNo}</div>
                        </td>
                        {group.subjects.map(sub => (
                          <td key={sub}>
                            <input type="number" min={0} max={group.totalMarks}
                              value={results[s._id]?.[sub] ?? ''}
                              onChange={e => setMark(s._id, sub, e.target.value)}
                              style={{
                                width:64, border:'1px solid', borderRadius:7, padding:'5px 8px',
                                fontSize:13, textAlign:'center', outline:'none',
                                borderColor: results[s._id]?.[sub] !== undefined && results[s._id][sub] < group.passingMarks
                                  ? '#fca5a5' : '#e2e8f0',
                                background: results[s._id]?.[sub] !== undefined && results[s._id][sub] < group.passingMarks
                                  ? '#fff5f5' : '#fff',
                              }}
                              placeholder="—"
                            />
                          </td>
                        ))}
                        <td style={{ fontWeight:700, color:'#0f172a' }}>
                          {total}<span style={{ fontSize:11, color:'#94a3b8' }}>/{maxTotal}</span>
                        </td>
                        <td style={{ minWidth:100 }}>
                          <div style={{ fontWeight:700, color:c, marginBottom:3 }}>{pct}%</div>
                          <ResultBar pct={pct} />
                        </td>
                        <td><span style={{ fontSize:13, fontWeight:900, color:c }}>{g}</span></td>
                        <td>
                          <span style={{
                            fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                            background: pass ? '#dcfce7' : '#fee2e2',
                            color:      pass ? '#16a34a' : '#dc2626',
                          }}>
                            {pass ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Rank list ── */}
      {group && activeTab === 'ranks' && (
        <RankBoard rankedStudents={rankedStudents} group={group} />
      )}

      {/* ── Result List ── */}
      {group && activeTab === 'result' && (
        <ResultList rankedStudents={rankedStudents} group={group} />
      )}

      {/* ── Empty state ── */}
      {!group && (
        <div className="card" style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>
          <Award size={40} style={{ margin:'0 auto 12px', opacity:.4 }} />
          <div style={{ fontSize:15, fontWeight:600 }}>Select an exam group to enter marks and see rankings</div>
        </div>
      )}
    </div>
  );
}