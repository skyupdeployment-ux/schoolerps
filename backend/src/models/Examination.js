const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Unit Test','Mid-Term','Final','Internal','Other'], required: true },
  academicYear: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  startDate: { type: Date },
  endDate: { type: Date },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const marksSchema = new mongoose.Schema({
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  maxMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  grade: { type: String },
  remarks: { type: String },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

marksSchema.index({ examination: 1, student: 1, subject: 1 }, { unique: true });

marksSchema.pre('save', function(next) {
  const pct = (this.obtainedMarks / this.maxMarks) * 100;
  if (pct >= 90) this.grade = 'A+';
  else if (pct >= 80) this.grade = 'A';
  else if (pct >= 70) this.grade = 'B+';
  else if (pct >= 60) this.grade = 'B';
  else if (pct >= 50) this.grade = 'C';
  else if (pct >= 40) this.grade = 'D';
  else this.grade = 'F';
  next();
});

const Examination = mongoose.model('Examination', examinationSchema);
const Marks = mongoose.model('Marks', marksSchema);

module.exports = { Examination, Marks };
