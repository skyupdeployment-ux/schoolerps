// TIMETABLE in ONE file: weekly grid per class section + configurable period timings.
// Mounted in index.js BEFORE your normal timetable route.
//   GET    /api/timetable?section=<sectionId>   all periods of one section
//   PUT    /api/timetable/slot                  add or change one period  {section, day, period, subject, teacher, room}
//   DELETE /api/timetable/slot/:id              clear one period
//   GET    /api/timetable/periods               the school's period timings (breaks, extra classes)
//   PUT    /api/timetable/periods               save the school's period timings (admin)
// A teacher cannot be booked in two sections in the same day + period.
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Section } = require('../models/Class'); // also registers the Class model
require('../models/Teacher');                    // registers the Teacher model for populate
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Used until the school saves its own timings
const DEFAULT_ROWS = [
  { type: 'class', label: '', start: '09:00', end: '09:45' },
  { type: 'class', label: '', start: '09:45', end: '10:30' },
  { type: 'class', label: '', start: '10:30', end: '11:15' },
  { type: 'class', label: '', start: '11:15', end: '12:00' },
  { type: 'break', label: 'Lunch Break', start: '12:00', end: '12:45' },
  { type: 'class', label: '', start: '12:45', end: '13:30' },
  { type: 'class', label: '', start: '13:30', end: '14:15' },
  { type: 'class', label: '', start: '14:15', end: '15:00' },
  { type: 'class', label: '', start: '15:00', end: '15:45' }
];

const slotSchema = new mongoose.Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear: { type: String },
  day: { type: String, enum: DAYS, required: true },
  period: { type: Number, min: 1, max: 12, required: true },
  subject: { type: String, required: true, trim: true, maxlength: 60 },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  room: { type: String, trim: true, maxlength: 20 },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });
slotSchema.index({ section: 1, day: 1, period: 1 }, { unique: true });
slotSchema.index({ teacher: 1, day: 1, period: 1 });

const Slot = mongoose.models.TimetableSlot || mongoose.model('TimetableSlot', slotSchema);

// One document holding the school's period timings
const rowSchema = new mongoose.Schema({
  type:  { type: String, enum: ['class', 'extra', 'break'], required: true },
  label: { type: String, trim: true, maxlength: 40 },
  start: { type: String, required: true },
  end:   { type: String, required: true }
}, { _id: false });
const configSchema = new mongoose.Schema({
  key:  { type: String, default: 'periods', unique: true },
  rows: [rowSchema]
}, { timestamps: true });
const Config = mongoose.models.TimetableConfig || mongoose.model('TimetableConfig', configSchema);

const admin = authorize('super_admin', 'school_admin');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const audit = (req, action, recordId, description) =>
  AuditLog.create({ user: req.user._id, action, module: 'Timetable', recordId, description }).catch(() => {});

// ---------- PERIOD TIMINGS: read ----------
router.get('/periods', protect, wrap(async (req, res) => {
  const doc = await Config.findOne({ key: 'periods' }).lean();
  const has = !!(doc && doc.rows && doc.rows.length);
  res.json({ success: true, data: { rows: has ? doc.rows : DEFAULT_ROWS, isDefault: !has } });
}));

// ---------- PERIOD TIMINGS: save ----------
router.put('/periods', protect, admin, wrap(async (req, res) => {
  const input = Array.isArray(req.body.rows) ? req.body.rows : null;
  if (!input || !input.length) return fail(res, 'Add at least one period');
  if (input.length > 30) return fail(res, 'Too many rows');

  const rows = [];
  for (const r of input) {
    const type = String(r.type);
    const start = String(r.start || '');
    const end = String(r.end || '');
    const label = String(r.label ?? '').trim();
    if (!['class', 'extra', 'break'].includes(type)) return fail(res, 'Invalid row type');
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) return fail(res, 'Times must look like 09:30');
    if (end <= start) return fail(res, 'Each period must end after it starts');
    if (label.length > 40) return fail(res, 'Label must be 40 characters or less');
    rows.push({ type, label: type === 'break' ? (label || 'Break') : '', start, end });
  }

  const numbered = rows.filter(r => r.type !== 'break').length;
  if (numbered < 1) return fail(res, 'Add at least one class period');
  if (numbered > 12) return fail(res, 'A timetable can have at most 12 periods (extra classes included)');

  const doc = await Config.findOneAndUpdate(
    { key: 'periods' },
    { $set: { rows } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  await audit(req, 'UPDATE', doc._id, 'Changed timetable period timings');
  res.json({ success: true, data: { rows: doc.rows, isDefault: false } });
}));

// ---------- LIST one section ----------
router.get('/', protect, wrap(async (req, res, next) => {
  if (!req.query.section) return next(); // not ours: let the existing timetable route answer
  if (!mongoose.isValidObjectId(req.query.section)) return fail(res, 'Invalid section');
  const data = await Slot.find({ section: req.query.section })
    .populate('teacher', 'name')
    .sort({ period: 1 })
    .lean();
  res.json({ success: true, data });
}));

// ---------- ADD / CHANGE one period ----------
router.put('/slot', protect, admin, wrap(async (req, res) => {
  const { section: sectionId, day } = req.body;
  const period = Number(req.body.period);
  const subject = String(req.body.subject ?? '').trim();
  const room = String(req.body.room ?? '').trim();
  const teacherId = req.body.teacher ? String(req.body.teacher) : null;

  if (!mongoose.isValidObjectId(sectionId)) return fail(res, 'Invalid section');
  if (!DAYS.includes(day)) return fail(res, 'Invalid day');
  if (!Number.isInteger(period) || period < 1 || period > 12) return fail(res, 'Invalid period');
  if (!subject) return fail(res, 'Subject is required');
  if (subject.length > 60) return fail(res, 'Subject must be 60 characters or less');
  if (room.length > 20) return fail(res, 'Room must be 20 characters or less');
  if (teacherId && !mongoose.isValidObjectId(teacherId)) return fail(res, 'Invalid teacher');

  const section = await Section.findOne({ _id: sectionId, isActive: { $ne: false } });
  if (!section) return fail(res, 'Section not found', 404);

  // Teacher clash: same teacher, same day + period, different section
  if (teacherId) {
    const clash = await Slot.findOne({ teacher: teacherId, day, period, section: { $ne: section._id } })
      .populate('class', 'name').populate('section', 'name').populate('teacher', 'name');
    if (clash) {
      return fail(res, `${clash.teacher?.name || 'This teacher'} is already teaching ${clash.class?.name || 'another class'} ${clash.section?.name || ''} on ${day}, period ${period}.`);
    }
  }

  const saved = await Slot.findOneAndUpdate(
    { section: section._id, day, period },
    { $set: { class: section.class, academicYear: section.academicYear, subject, room, teacher: teacherId } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).populate('teacher', 'name').lean();

  await audit(req, 'UPDATE', saved._id, `${day} period ${period}: ${subject}`);
  res.json({ success: true, data: saved });
}));

// ---------- CLEAR one period ----------
router.delete('/slot/:id', protect, admin, wrap(async (req, res) => {
  const slot = await Slot.findByIdAndDelete(req.params.id);
  if (!slot) return fail(res, 'Period not found', 404);
  await audit(req, 'DELETE', slot._id, `Cleared ${slot.day} period ${slot.period}: ${slot.subject}`);
  res.json({ success: true, message: 'Period cleared' });
}));

module.exports = router;
