const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', unique: true },
  schoolName: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  academicYear: { type: String },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  gradingSystem: [{
    grade: String, minPercent: Number, maxPercent: Number, points: Number
  }],
  feeSettings: {
    lateFinePerDay: Number,
    receiptPrefix: String
  },
  reportCardSettings: {
    showAttendance: { type: Boolean, default: true },
    showGrade: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
