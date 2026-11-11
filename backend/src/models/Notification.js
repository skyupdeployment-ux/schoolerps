const mongoose = require('mongoose');

// School announcements / notifications (draft -> sent). The page stores one document per announcement.
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  type: { type: String, default: 'general', trim: true },
  audience: { type: String, enum: ['all', 'students', 'parents', 'teachers', 'staff'], default: 'all' },
  priority: { type: String, enum: ['High', 'Normal', 'Low'], default: 'Normal' },
  status: { type: String, enum: ['Draft', 'Sent'], default: 'Draft' },
  whatsapp: { type: Boolean, default: false },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  sentTo: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isRead: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: Date }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
