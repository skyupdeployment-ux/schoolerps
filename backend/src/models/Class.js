const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: Number, required: true },
  academicYear: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  roomNumber: { type: String },
  capacity: { type: Number, min: 1, max: 500 }, // seats, for the occupancy bar on Classes page
  academicYear: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);
const Section = mongoose.model('Section', sectionSchema);

module.exports = { Class, Section };