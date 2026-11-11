// ATTENDANCE in ONE file: daily sheet per class section + monthly report.
// Mounted in index.js BEFORE your normal attendance route.
//   GET  /api/attendance/sheet?section=<id>&date=YYYY-MM-DD   students of a section with that day's status
//   POST /api/attendance/mark                                 save a whole sheet  {section, date, records:[{student,status,remarks}]}
//   GET  /api/attendance/report?section=<id>&month=YYYY-MM    per-student totals + percentage for a month
// Dates are stored at the server's local midnight, exactly like the Dashboard's "Today's Attendance" expects.
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { Section } = require('../models/Class'); // also registers the Class model
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
// Finds a section's students whether they are linked by ID or by text ("10" / "A")
const { sectionStudentFilter } = require('../utils/studentLink');

const STATUSES = ['Present', 'Absent', 'Late', 'Half Day'];
const staff = authorize('super_admin', 'school_admin', 'teacher');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// "2026-09-20" -> Date at local midnight (null if invalid)
const parseDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getSection = (id) => mongoose.isValidObjectId(id)
  ? Section.findOne({ _id: id, isActive: { $ne: false } }).populate('class', 'name grade')
  : null;

// roll number order (numbers first), then name
const sortStudents = (list) => list.sort((a, b) => {
  const ra = /^\d+$/.test(a.rollNumber || '') ? Number(a.rollNumber) : Infinity;
  const rb = /^\d+$/.test(b.rollNumber || '') ? Number(b.rollNumber) : Infinity;
  return ra - rb || `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
});

// ---------- DAILY SHEET ----------
router.get('/sheet', protect, staff, wrap(async (req, res) => {
  const date = parseDate(req.query.date);
  if (!date) return fail(res, 'Invalid date (use YYYY-MM-DD)');
  const section = await getSection(req.query.section);
  if (!section) return fail(res, 'Section not found', 404);

  const [students, records] = await Promise.all([
    Student.find(sectionStudentFilter(section)).select('firstName lastName admissionNumber rollNumber photo parentPhone').lean(),
    Attendance.find({ section: section._id, date: { $gte: date, $lt: addDays(date, 1) } }).select('student status remarks').lean()
  ]);
  const byStudent = {};
  records.forEach(r => { byStudent[String(r.student)] = r; });

  const data = sortStudents(students).map(s => ({
    ...s,
    status: byStudent[String(s._id)]?.status || null,
    remarks: byStudent[String(s._id)]?.remarks || ''
  }));
  res.json({ success: true, data: { section: { _id: section._id, name: section.name, class: section.class }, date: ymd(date), students: data } });
}));

// ---------- SAVE A SHEET ----------
router.post('/mark', protect, staff, wrap(async (req, res) => {
  const date = parseDate(req.body.date);
  if (!date) return fail(res, 'Invalid date (use YYYY-MM-DD)');
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  if (date.getTime() > todayStart.getTime()) return fail(res, 'You cannot mark attendance for a future date');

  const section = await getSection(req.body.section);
  if (!section) return fail(res, 'Section not found', 404);

  const records = Array.isArray(req.body.records) ? req.body.records : [];
  if (records.length === 0) return fail(res, 'No students to save');
  if (records.length > 500) return fail(res, 'Too many records in one request');

  const inSection = await Student.find(sectionStudentFilter(section)).select('_id').lean();
  const allowed = new Set(inSection.map(s => String(s._id)));

  const ops = [];
  const tally = { Present: 0, Absent: 0, Late: 0, 'Half Day': 0, cleared: 0 };
  for (const r of records) {
    const id = String(r.student || '');
    if (!allowed.has(id)) return fail(res, 'A student in the list does not belong to this section');
    const filter = { student: id, date: { $gte: date, $lt: addDays(date, 1) } };

    if (r.status === null || r.status === undefined || r.status === '') {
      ops.push({ deleteOne: { filter } }); // un-mark
      tally.cleared++;
      continue;
    }
    if (!STATUSES.includes(r.status)) return fail(res, `Invalid status: ${r.status}`);
    const remarks = String(r.remarks ?? '').trim().slice(0, 200);
    ops.push({
      updateOne: {
        filter,
        update: { $set: { student: id, class: section.class._id, section: section._id, date, status: r.status, remarks, markedBy: req.user._id } },
        upsert: true
      }
    });
    tally[r.status]++;
  }

  await Attendance.bulkWrite(ops, { ordered: false });
  AuditLog.create({
    user: req.user._id, action: 'UPDATE', module: 'Attendance', recordId: section._id,
    description: `${section.class.name} ${section.name} on ${ymd(date)}: P${tally.Present} A${tally.Absent} L${tally.Late} HD${tally['Half Day']}`
  }).catch(() => {});

  res.json({ success: true, data: tally });
}));

// ---------- MONTHLY REPORT ----------
router.get('/report', protect, staff, wrap(async (req, res) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(req.query.month || ''));
  if (!m || +m[2] < 1 || +m[2] > 12) return fail(res, 'Invalid month (use YYYY-MM)');
  const start = new Date(+m[1], +m[2] - 1, 1);
  const end = new Date(+m[1], +m[2], 1);

  const section = await getSection(req.query.section);
  if (!section) return fail(res, 'Section not found', 404);

  const match = { section: section._id, date: { $gte: start, $lt: end } };
  const [students, grouped, perDay] = await Promise.all([
    Student.find(sectionStudentFilter(section)).select('firstName lastName admissionNumber rollNumber photo parentPhone').lean(),
    Attendance.aggregate([{ $match: match }, { $group: { _id: { student: '$student', status: '$status' }, n: { $sum: 1 } } }]),
    Attendance.aggregate([{ $match: match }, { $group: { _id: { date: '$date', status: '$status' }, n: { $sum: 1 } } }])
  ]);

  // day-by-day totals for the trend chart
  const byDay = {};
  perDay.forEach(g => {
    const key = ymd(new Date(g._id.date));
    const d = (byDay[key] = byDay[key] || { date: key, present: 0, absent: 0, late: 0, halfDay: 0, total: 0 });
    const field = { Present: 'present', Absent: 'absent', Late: 'late', 'Half Day': 'halfDay' }[g._id.status];
    if (field) { d[field] += g.n; d.total += g.n; }
  });
  const daily = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

  const counts = {};
  grouped.forEach(g => {
    const id = String(g._id.student);
    (counts[id] = counts[id] || {})[g._id.status] = g.n;
  });

  const data = sortStudents(students).map(s => {
    const c = counts[String(s._id)] || {};
    const present = c.Present || 0, absent = c.Absent || 0, late = c.Late || 0, half = c['Half Day'] || 0;
    const total = present + absent + late + half;
    // Late counts as present, Half Day counts as half a day
    const percentage = total ? Math.round(((present + late + half * 0.5) / total) * 1000) / 10 : null;
    return { ...s, present, absent, late, halfDay: half, total, percentage };
  });

  const rated = data.filter(d => d.percentage !== null);
  const average = rated.length ? Math.round((rated.reduce((n, d) => n + d.percentage, 0) / rated.length) * 10) / 10 : null;

  res.json({ success: true, data: { section: { _id: section._id, name: section.name, class: section.class }, month: req.query.month, daysMarked: daily.length, average, daily, students: data } });
}));

module.exports = router;