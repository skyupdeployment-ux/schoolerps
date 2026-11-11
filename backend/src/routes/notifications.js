const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

router.use(protect);
const admin = authorize('super_admin', 'school_admin');
const STAFF_ROLES = ['accountant', 'librarian', 'transport_manager'];
const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'staff'];

const shape = n => ({
  _id: n._id, title: n.title, message: n.message, type: n.type, audience: n.audience,
  priority: n.priority, status: n.status, whatsapp: !!n.whatsapp,
  sentTo: n.sentTo || 0, readCount: n.readCount || 0,
  scheduledAt: n.scheduledAt || '', createdAt: n.sentAt || n.createdAt
});

// phone numbers for an audience (deduplicated, digits only)
async function phonesFor(audience) {
  const out = new Set();
  const add = v => { const d = String(v || '').replace(/\D/g, ''); if (d.length >= 10) out.add(d); };
  if (['all', 'students', 'parents'].includes(audience)) {
    (await Student.find({ isActive: { $ne: false } }).select('parentPhone phone').lean())
      .forEach(s => { add(s.parentPhone); if (audience === 'students') add(s.phone); });
  }
  if (['all', 'teachers'].includes(audience)) {
    (await Teacher.find({ isActive: { $ne: false } }).select('phone').lean()).forEach(t => add(t.phone));
  }
  if (['all', 'staff'].includes(audience)) {
    (await User.find({ role: { $in: STAFF_ROLES }, isActive: true }).select('phone').lean()).forEach(u => add(u.phone));
  }
  return [...out];
}

async function countFor(audience) {
  const [students, teachers, staff] = await Promise.all([
    Student.countDocuments({ isActive: { $ne: false } }),
    Teacher.countDocuments({ isActive: { $ne: false } }),
    User.countDocuments({ role: { $in: STAFF_ROLES }, isActive: true })
  ]);
  return { all: students + teachers + staff, students, parents: students, teachers, staff }[audience] || 0;
}

const clean = body => {
  const d = {};
  for (const k of ['title', 'message', 'type', 'priority']) if (body[k] !== undefined) d[k] = String(body[k]).trim();
  if (body.audience !== undefined) d.audience = body.audience;
  if (body.whatsapp !== undefined) d.whatsapp = !!body.whatsapp;
  if (body.scheduledAt !== undefined) d.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
  return d;
};
const invalid = d => {
  if (d.audience && !AUDIENCES.includes(d.audience)) return 'Invalid audience';
  if (d.priority && !['High', 'Normal', 'Low'].includes(d.priority)) return 'Invalid priority';
  if (d.scheduledAt && isNaN(d.scheduledAt)) return 'Invalid schedule date';
  return null;
};

// GET /api/notifications/phones?audience=parents  (before /:id routes)
router.get('/phones', admin, async (req, res) => {
  const audience = AUDIENCES.includes(req.query.audience) ? req.query.audience : 'all';
  res.json({ success: true, data: await phonesFor(audience) });
});

router.get('/', async (req, res) => {
  const list = await Notification.find().sort({ createdAt: -1 }).limit(500).lean();
  res.json({ success: true, data: list.map(shape) });
});

router.post('/', admin, async (req, res) => {
  const d = clean(req.body);
  if (!d.title || !d.message) return res.status(400).json({ success: false, message: 'Title and message are required' });
  const bad = invalid(d); if (bad) return res.status(400).json({ success: false, message: bad });
  d.createdBy = req.user._id;
  if (req.body.status === 'Sent') {
    d.status = 'Sent'; d.sentAt = new Date(); d.sentTo = await countFor(d.audience || 'all');
  }
  const n = await Notification.create(d);
  res.status(201).json({ success: true, data: shape(n) });
});

router.put('/:id', admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const n = await Notification.findById(req.params.id);
  if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
  const d = clean(req.body);
  const bad = invalid(d); if (bad) return res.status(400).json({ success: false, message: bad });
  if (n.status === 'Sent') { delete d.audience; } // audience of a sent announcement can't change
  Object.assign(n, d);
  if (req.body.status === 'Sent' && n.status !== 'Sent') {
    n.status = 'Sent'; n.sentAt = new Date(); n.sentTo = await countFor(n.audience);
  }
  await n.save();
  res.json({ success: true, data: shape(n) });
});

router.post('/:id/send', admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const sentTo = await countFor((await Notification.findById(req.params.id).select('audience'))?.audience || 'all');
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, status: { $ne: 'Sent' } },
    { status: 'Sent', sentAt: new Date(), sentTo },
    { new: true }
  );
  if (!n) return res.status(400).json({ success: false, message: 'Notification not found or already sent' });
  res.json({ success: true, data: shape(n) });
});

router.delete('/:id', admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const n = await Notification.findByIdAndDelete(req.params.id);
  if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
