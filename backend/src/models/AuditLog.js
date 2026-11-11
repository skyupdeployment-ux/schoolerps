const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:      { type: String, enum: ['CREATE','UPDATE','DELETE','VIEW','LOGIN','LOGOUT'], required: true },
  module:      { type: String, required: true },
  recordId:    { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  ipAddress:   { type: String },
  userAgent:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);