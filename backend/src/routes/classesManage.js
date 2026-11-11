// CLASSES + SECTIONS in ONE file: list, add, edit, delete.
// Mounted in index.js BEFORE your normal classes route.
//   GET    /api/classes                      list classes (with sections + student counts)
//   POST   /api/classes                      add class            {name, grade, academicYear}
//   PUT    /api/classes/:id                  edit class
//   DELETE /api/classes/:id                  delete class (blocked while students are in it)
//   POST   /api/classes/:id/sections         add section          {name, classTeacher, roomNumber}
//   PUT    /api/classes/sections/:sectionId  edit section
//   DELETE /api/classes/sections/:sectionId  delete section (blocked while students are in it)
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Class, Section } = require('../models/Class');
const Student = require('../models/Student');
require('../models/Teacher'); // registers the Teacher model so classTeacher can be populated
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
// Students store class/section as IDs or as typed text ("10" / "A") - count both
const { classStudentFilter, sectionStudentFilter } = require('../utils/studentLink');

const admin = authorize('super_admin', 'school_admin');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const audit = (req, action, recordId, description) =>
  AuditLog.create({ user: req.user._id, action, module: 'Classes', recordId, description }).catch(() => {});

const cleanClass = (body) => {
  const name = String(body.name ?? '').trim();
  const gradeText = String(body.grade ?? '').trim();
  const grade = Number(gradeText);
  const academicYear = String(body.academicYear ?? '').trim();
  if (!name) return { error: 'Class name is required' };
  if (gradeText === '' || !Number.isInteger(grade) || grade < 0 || grade > 12) return { error: 'Grade must be a whole number from 0 to 12' };
  if (!academicYear) return { error: 'Academic year is required' };
  return { value: { name, grade, academicYear } };
};

const cleanSection = (body) => {
  const name = String(body.name ?? '').trim();
  const roomNumber = String(body.roomNumber ?? '').trim();
  const teacher = body.classTeacher ? String(body.classTeacher) : null;
  const capText = String(body.capacity ?? '').trim();
  const capacity = capText === '' ? null : Number(capText);
  if (!name) return { error: 'Section name is required' };
  if (name.length > 20) return { error: 'Section name must be 20 characters or less' };
  if (teacher && !mongoose.isValidObjectId(teacher)) return { error: 'Invalid class teacher' };
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 500)) return { error: 'Capacity must be a whole number from 1 to 500' };
  return { value: { name, roomNumber, classTeacher: teacher, capacity } };
};

// ---------- LIST ----------
router.get('/', protect, wrap(async (req, res) => {
  const classes = await Class.find({ isActive: { $ne: false } }).sort({ grade: 1, name: 1 }).lean();
  const ids = classes.map(c => c._id);

  const sections = await Section.find({ class: { $in: ids }, isActive: { $ne: false } }).populate('classTeacher', 'name department').sort({ name: 1 }).lean();

  // was an aggregate comparing ObjectIds to the String field Student.class, so every count showed 0
  const byId = {};
  classes.forEach(c => { byId[String(c._id)] = c; });
  const [classCounts, sectionCounts] = await Promise.all([
    Promise.all(classes.map(c => Student.countDocuments({ ...classStudentFilter(c), isActive: { $ne: false } }))),
    Promise.all(sections.map(s => Student.countDocuments(sectionStudentFilter({ ...s, class: byId[String(s.class)] }))))
  ]);
  const perClass = {};
  const perSection = {};
  classes.forEach((c, i) => { perClass[String(c._id)] = classCounts[i]; });
  sections.forEach((s, i) => { perSection[String(s._id)] = sectionCounts[i]; });

  const sectionsByClass = {};
  sections.forEach(s => {
    s.studentCount = perSection[String(s._id)] || 0;
    const cid = String(s.class);
    (sectionsByClass[cid] = sectionsByClass[cid] || []).push(s);
  });

  const data = classes.map(c => ({
    ...c,
    sections: sectionsByClass[String(c._id)] || [],
    studentCount: perClass[String(c._id)] || 0
  }));
  res.json({ success: true, data });
}));

// ---------- CLASSES ----------
router.post('/', protect, admin, wrap(async (req, res) => {
  const { value, error } = cleanClass(req.body);
  if (error) return fail(res, error);
  if (await Class.findOne({ ...value, isActive: { $ne: false } }, '_id name grade academicYear')) return fail(res, `${value.name} (${value.academicYear}) already exists`);

  const cls = await Class.create(value);
  await audit(req, 'CREATE', cls._id, `Class created: ${cls.name} (${cls.academicYear})`);
  res.status(201).json({ success: true, data: { ...cls.toObject(), sections: [], studentCount: 0 } });
}));

router.put('/:id', protect, admin, wrap(async (req, res) => {
  const { value, error } = cleanClass(req.body);
  if (error) return fail(res, error);
  const duplicate = await Class.findOne({ ...value, isActive: { $ne: false }, _id: { $ne: req.params.id } }, '_id');
  if (duplicate) return fail(res, `${value.name} (${value.academicYear}) already exists`);

  const cls = await Class.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
  if (!cls) return fail(res, 'Class not found', 404);
  await audit(req, 'UPDATE', cls._id, `Class updated: ${cls.name} (${cls.academicYear})`);
  res.json({ success: true, data: cls });
}));

router.delete('/:id', protect, admin, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Class not found', 404);
  const existing = await Class.findById(req.params.id).select('name grade').lean();
  if (!existing) return fail(res, 'Class not found', 404);
  const students = await Student.countDocuments({ ...classStudentFilter(existing), isActive: { $ne: false } });
  if (students > 0) return fail(res, `Cannot delete: ${students} student${students > 1 ? 's are' : ' is'} in this class. Move them to another class first.`);

  const cls = await Class.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!cls) return fail(res, 'Class not found', 404);
  await Section.updateMany({ class: req.params.id }, { isActive: false });
  await audit(req, 'DELETE', cls._id, `Class deleted: ${cls.name} (${cls.academicYear})`);
  res.json({ success: true, message: 'Class deleted' });
}));

// ---------- SECTIONS ----------
router.post('/:id/sections', protect, admin, wrap(async (req, res) => {
  const cls = await Class.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!cls) return fail(res, 'Class not found', 404);

  const { value, error } = cleanSection(req.body);
  if (error) return fail(res, error);
  if (await Section.findOne({ class: cls._id, name: value.name, isActive: { $ne: false } }, '_id')) return fail(res, `Section ${value.name} already exists in ${cls.name}`);

  const section = await Section.create({ ...value, class: cls._id, academicYear: cls.academicYear });
  await audit(req, 'CREATE', section._id, `Section ${section.name} added to ${cls.name}`);
  const data = await Section.findById(section._id).populate('classTeacher', 'name department').lean();
  res.status(201).json({ success: true, data: { ...data, studentCount: 0 } });
}));

router.put('/sections/:sectionId', protect, admin, wrap(async (req, res) => {
  const existing = await Section.findOne({ _id: req.params.sectionId, isActive: { $ne: false } });
  if (!existing) return fail(res, 'Section not found', 404);

  const { value, error } = cleanSection(req.body);
  if (error) return fail(res, error);
  const duplicate = await Section.findOne({ class: existing.class, name: value.name, isActive: { $ne: false }, _id: { $ne: existing._id } }, '_id');
  if (duplicate) return fail(res, `Section ${value.name} already exists in this class`);

  await Section.findByIdAndUpdate(existing._id, value, { runValidators: true });
  await audit(req, 'UPDATE', existing._id, `Section updated: ${value.name}`);
  const data = await Section.findById(existing._id).populate('classTeacher', 'name department').lean();
  res.json({ success: true, data });
}));

router.delete('/sections/:sectionId', protect, admin, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.sectionId)) return fail(res, 'Section not found', 404);
  const existing = await Section.findById(req.params.sectionId).populate('class', 'name grade').lean();
  if (!existing) return fail(res, 'Section not found', 404);
  const students = await Student.countDocuments(sectionStudentFilter(existing));
  if (students > 0) return fail(res, `Cannot delete: ${students} student${students > 1 ? 's are' : ' is'} in this section. Move them first.`);

  const section = await Section.findByIdAndUpdate(req.params.sectionId, { isActive: false });
  if (!section) return fail(res, 'Section not found', 404);
  await audit(req, 'DELETE', section._id, `Section deleted: ${section.name}`);
  res.json({ success: true, message: 'Section deleted' });
}));

module.exports = router;