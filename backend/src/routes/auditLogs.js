const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.use(protect);

// GET /api/audit-logs — newest first (admins only). The page filters/searches client-side.
router.get('/', authorize('super_admin', 'school_admin'), async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 2000);
  const query = {};
  if (req.query.action) query.action = req.query.action;
  if (req.query.module) query.module = req.query.module;

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query).populate('user', 'name role').sort({ createdAt: -1 }).limit(limit).lean()
  ]);

  const data = logs.map(l => ({
    _id: l._id,
    user: l.user?.name || 'Unknown user',
    role: l.user?.role || '',
    action: l.action,
    module: l.module,
    description: l.description || '',
    ipAddress: l.ipAddress || '',
    createdAt: l.createdAt
  }));

  res.json({ success: true, data, pagination: { total, returned: data.length } });
});

module.exports = router;
