// Students are linked to their class/section in TWO different ways in this database:
//   1. by ID   - student.class = "<Class _id>", student.section = "<Section _id>"   (seed data)
//   2. by text - student.class = "10",          student.section = "A"              (Students page form)
// Attendance and Fees use these helpers so both kinds of students work.
const mongoose = require('mongoose');
const { Class, Section } = require('../models/Class');

const isOid = (v) => (typeof v === 'string' ? /^[a-f0-9]{24}$/i.test(v) : v instanceof mongoose.Types.ObjectId);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (s) => new RegExp(`^\\s*${escapeRegex(String(s).trim())}\\s*$`, 'i');
const uniq = (arr) => [...new Set(arr.map(String))];

// Every way a class may have been typed: "10", "Class 10", "Grade 10", "Std 10" or its exact name
const classTextMatchers = (cls) => {
  const out = [];
  if (cls && cls.name) out.push(exact(cls.name));
  if (cls && Number.isInteger(cls.grade) && cls.grade > 0) {
    out.push(exact(String(cls.grade)), exact(`Class ${cls.grade}`), exact(`Grade ${cls.grade}`), exact(`Std ${cls.grade}`));
  }
  return out;
};

// Mongo filter: active students of a section (section must have class populated with name + grade)
const sectionStudentFilter = (section) => {
  const or = [{ section: String(section._id) }];
  const classMatchers = classTextMatchers(section.class);
  if (classMatchers.length && section.name) {
    or.push({ class: { $in: classMatchers }, section: exact(section.name) });
  }
  return { isActive: { $ne: false }, $or: or };
};

// Mongo filter: students of a whole class (by ID or by typed class text) - no isActive here
const classStudentFilter = (cls) => {
  const or = [{ class: String(cls._id) }];
  const matchers = classTextMatchers(cls);
  if (matchers.length) or.push({ class: { $in: matchers } });
  return { $or: or };
};

// The Class _id a student belongs to (null if it cannot be worked out) - used to find fee structures
const resolveClassId = async (student, preferredYear) => {
  const c = student && student.class;
  if (!c) return null;
  if (isOid(c)) return String(c);

  const text = String(c).trim();
  const num = /^(?:class|grade|std)?\s*(\d{1,2})$/i.exec(text);
  const or = [{ name: exact(text) }];
  if (num) or.push({ grade: Number(num[1]) });

  const candidates = await Class.find({ isActive: { $ne: false }, $or: or })
    .select('_id academicYear').sort({ academicYear: -1 }).lean();
  if (!candidates.length) return null;
  const sameYear = candidates.find(k => k.academicYear === (preferredYear || student.academicYear));
  return String((sameYear || candidates[0])._id);
};

// Returns label(student) -> "Grade 10 - A" / "Class 10 - A" for any mix of ID- and text-linked students
const makeLabeler = async (students) => {
  const list = (students || []).filter(Boolean);
  const classIds = uniq(list.map(s => s.class).filter(isOid));
  const sectionIds = uniq(list.map(s => s.section).filter(isOid));
  const [classes, sections] = await Promise.all([
    classIds.length ? Class.find({ _id: { $in: classIds } }).select('name').lean() : [],
    sectionIds.length ? Section.find({ _id: { $in: sectionIds } }).select('name').lean() : []
  ]);
  const cName = {}, sName = {};
  classes.forEach(k => { cName[String(k._id)] = k.name; });
  sections.forEach(k => { sName[String(k._id)] = k.name; });

  return (s) => {
    if (!s) return '';
    const c = s.class
      ? (isOid(s.class) ? (cName[String(s.class)] || '') : (/^\d+$/.test(String(s.class).trim()) ? `Class ${String(s.class).trim()}` : String(s.class).trim()))
      : '';
    const sec = s.section ? (isOid(s.section) ? (sName[String(s.section)] || '') : String(s.section).trim()) : '';
    return c && sec ? `${c} - ${sec}` : c || sec;
  };
};

module.exports = { isOid, exact, escapeRegex, sectionStudentFilter, classStudentFilter, resolveClassId, makeLabeler };