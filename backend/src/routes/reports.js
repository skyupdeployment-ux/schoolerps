const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { feeSummary, currentAcademicYear } = require('../utils/feeSummary');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'reports route active' }));

// Fee collection report: same numbers as the Dashboard (they share utils/feeSummary.js)
//   GET /api/reports/fees?academicYear=2026-27
router.get('/fees', authorize('super_admin', 'school_admin', 'accountant'), wrap(async (req, res) => {
  const year = /^\d{4}-\d{2}$/.test(String(req.query.academicYear || '')) ? String(req.query.academicYear) : currentAcademicYear();
  res.json({ success: true, data: await feeSummary(year) });
}));

module.exports = router;
