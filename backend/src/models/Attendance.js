const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present','Absent','Late','Half Day'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class: 1, section: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
