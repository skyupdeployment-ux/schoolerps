// TIMETABLE in ONE file: weekly grid per class section.
// Mounted in index.js BEFORE your normal timetable route.
//   GET    /api/timetable?section=<sectionId>   all periods of one section
//   PUT    /api/timetable/slot                  add or change one period  {section, day, period, subject, teacher, room}
//   DELETE /api/timetable/slot/:id              clear one period
// A teacher cannot be booked in two sections in the same day + period.
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Section } = require('../models/Class'); // also registers the Class model
require('../models/Teacher');                    // registers the Teacher model for populate
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const admin = authorize('super_admin', 'school_admin');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const audit = (req, action, recordId, description) =>
  AuditLog.create({ user: req.user._id, action, module: 'Timetable', recordId, description }).catch(() => {});

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