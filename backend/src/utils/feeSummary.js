// ONE source of truth for fee numbers. The Dashboard and the Reports page both call this,
// so "Fees collected" and "Pending" can never disagree.
const { FeeStructure, FeePayment } = require('../models/Fee');
const Student = require('../models/Student');
const { Class } = require('../models/Class');
const { isOid } = require('./studentLink');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const currentAcademicYear = () => {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
};

// "2026-27" -> Apr 2026 ... Mar 2027
const yearRange = (academicYear) => {
  const start = parseInt(String(academicYear).slice(0, 4), 10);
  return { from: new Date(start, 3, 1), to: new Date(start + 1, 3, 1) };
};

const norm = (v) => String(v ?? '').trim().toLowerCase();

// Every way a class may have been typed on the student: "10", "Class 10", "Grade 10", "Std 10" or its name
const classKeys = (cls) => {
  const keys = [norm(cls.name)];
  if (Number.isInteger(cls.grade) && cls.grade > 0) {
    keys.push(String(cls.grade), `class ${cls.grade}`, `grade ${cls.grade}`, `std ${cls.grade}`);
  }
  return keys;
};

async function feeSummary(academicYear = currentAcademicYear()) {
  const { from, to } = yearRange(academicYear);
  const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const [payments, structures, classes, students] = await Promise.all([
    FeePayment.find({ isCancelled: { $ne: true }, paymentDate: { $gte: from, $lt: to } })
      .select('student feeType amount totalAmount paymentDate').lean(),
    FeeStructure.find({ academicYear }).lean(),
    Class.find({ isActive: { $ne: false } }).select('name grade academicYear').lean(),
    Student.find({ isActive: { $ne: false } })
      .select('firstName lastName admissionNumber class section academicYear').lean()
  ]);

  // ── collected: monthly + total (money actually received, discounts/fines included) ──
  const startYear = parseInt(String(academicYear).slice(0, 4), 10);
  const monthly = MONTHS.map((m, i) => ({
    month: m,
    monthNo: ((i + 3) % 12) + 1,            // 1-12 (calendar month)
    year: i < 9 ? startYear : startYear + 1, // Apr-Dec = start year, Jan-Mar = next year
    collected: 0
  }));
  let collected = 0;
  const paidBy = {}; // studentId -> feeType -> paid amount
  payments.forEach(p => {
    const d = new Date(p.paymentDate);
    const idx = (d.getMonth() + 9) % 12; // Apr = 0 ... Mar = 11
    monthly[idx].collected = round2(monthly[idx].collected + (p.totalAmount || 0));
    collected = round2(collected + (p.totalAmount || 0));
    const sid = String(p.student);
    paidBy[sid] = paidBy[sid] || {};
    paidBy[sid][p.feeType] = round2((paidBy[sid][p.feeType] || 0) + (p.amount || 0));
  });

  // ── pending: fee structure of the student's class minus what they paid ──
  const classById = {};
  classes.forEach(c => { classById[String(c._id)] = c; });
  const classIdFor = (s) => {
    if (!s.class) return null;
    if (isOid(String(s.class)) && classById[String(s.class)]) return String(s.class);
    const t = norm(s.class);
    const matches = classes.filter(c => classKeys(c).includes(t));
    if (!matches.length) return null;
    const sameYear = matches.find(c => c.academicYear === academicYear);
    return String((sameYear || matches[0])._id);
  };

  const structTotals = {};   // classId|'all' -> feeType -> amount
  structures.forEach(st => {
    const key = st.class ? String(st.class) : 'all';
    structTotals[key] = structTotals[key] || {};
    (st.feeItems || []).forEach(i => { structTotals[key][i.type] = round2((structTotals[key][i.type] || 0) + i.amount); });
  });

  const defaulters = [];
  let pending = 0;
  let billed = 0;
  students.forEach(s => {
    const cid = classIdFor(s);
    const total = {};
    [structTotals.all, cid && structTotals[cid]].filter(Boolean).forEach(t =>
      Object.keys(t).forEach(k => { total[k] = round2((total[k] || 0) + t[k]); }));
    const paid = paidBy[String(s._id)] || {};
    let due = 0, fee = 0;
    Object.keys(total).forEach(k => { fee += total[k]; due += Math.max(0, round2(total[k] - (paid[k] || 0))); });
    if (!fee) return; // no fee structure for this student's class
    billed = round2(billed + fee);
    due = round2(due);
    if (due > 0) {
      pending = round2(pending + due);
      const cls = cid ? classById[cid] : null;
      defaulters.push({
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        admissionNumber: s.admissionNumber || '',
        class: cls ? cls.name : String(s.class || ''),
        section: s.section && !isOid(String(s.section)) ? String(s.section) : '',
        due
      });
    }
  });
  defaulters.sort((a, b) => b.due - a.due);

  return {
    academicYear,
    collected,
    pending,
    billed,
    monthly,
    defaulters: defaulters.slice(0, 50),
    defaulterCount: defaulters.length,
    studentsWithoutStructure: students.length - students.filter(s => {
      const cid = classIdFor(s);
      return structTotals.all || (cid && structTotals[cid]);
    }).length
  };
}

module.exports = { feeSummary, currentAcademicYear };
