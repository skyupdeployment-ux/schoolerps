const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId:       { type: String, unique: true, sparse: true },
  firstName:       { type: String, required: true, trim: true },
  lastName:        { type: String, required: true, trim: true },
  admissionNumber: { type: String, required: true, unique: true },
  dateOfBirth:     { type: Date },
  gender:          { type: String, enum: ['Male','Female','Other'], default: 'Male' },
  bloodGroup:      { type: String },
  photo:           { type: String },

  // ── Contact ───────────────────────────────────────────────────────────────
  phone:           { type: String },
  email:           { type: String },
  address:         { type: String },
  city:            { type: String },
  state:           { type: String },
  pincode:         { type: String },

  // ── Identity ──────────────────────────────────────────────────────────────
  aadharNumber:    { type: String },
  nationality:     { type: String, default: 'Indian' },
  religion:        { type: String },
  category:        { type: String, default: 'General' },

  // ── Academic — String (NOT ObjectId) to avoid BSONError ──────────────────
  class:           { type: String },   // e.g. "10", "9", "LKG"
  section:         { type: String },   // e.g. "A", "B"
  rollNumber:      { type: String },
  admissionDate:   { type: Date },
  academicYear:    { type: String, default: '2025-26' },

  // ── Previous school ───────────────────────────────────────────────────────
  previousSchool:  { type: String },
  previousClass:   { type: String },
  tcNumber:        { type: String },

  // ── Parent / guardian ─────────────────────────────────────────────────────
  fatherName:      { type: String },
  motherName:      { type: String },
  parentPhone:     { type: String },
  parentEmail:     { type: String },
  emergencyContact:{ type: String },

  // ── Medical ───────────────────────────────────────────────────────────────
  medicalConditions: { type: String },

  // ── Documents ────────────────────────────────────────────────────────────
  documents: [
    {
      type:     { type: String },
      name:     { type: String },
      file:     { type: String },
      fileName: { type: String },
    }
  ],

  // ── Online admission ─────────────────────────────────────────────────────
  isOnlineAdmission: { type: Boolean, default: false },
  status:            { type: String, enum: ['Active','Pending','Inactive'], default: 'Active' },

  // ── Soft delete ───────────────────────────────────────────────────────────
  isActive:   { type: Boolean, default: true },
  deletedAt:  { type: Date },

  schoolId:   { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

}, { timestamps: true });

// Text search index
studentSchema.index({
  firstName: 'text', lastName: 'text',
  admissionNumber: 'text', rollNumber: 'text'
});

module.exports = mongoose.model('Student', studentSchema);