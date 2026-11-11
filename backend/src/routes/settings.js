const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Settings = require('../models/Settings');

router.use(protect);

const DEFAULTS = {
  schoolName: '', address: '', phone: '', email: '', website: '', academicYear: '',
  currency: 'INR', timezone: 'Asia/Kolkata', gradingSystem: [],
  feeSettings: { lateFinePerDay: 0, receiptPrefix: '' },
  reportCardSettings: { showAttendance: true, showGrade: true }
};

// GET /api/settings — the school's single settings record (defaults if none saved yet)
router.get('/', async (req, res) => {
  const s = await Settings.findOne().lean();
  res.json({ success: true, data: s || DEFAULTS });
});

// PUT /api/settings — admins only, whitelisted fields
router.put('/', authorize('super_admin', 'school_admin'), async (req, res) => {
  const b = req.body || {};
  const str = (v, max = 300) => String(v ?? '').trim().slice(0, max);
  const num = v => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };

  const schoolName = str(b.schoolName, 150);
  if (!schoolName) return res.status(400).json({ success: false, message: 'School name is required' });
  if (b.email && !/^\S+@\S+\.\S+$/.test(String(b.email))) return res.status(400).json({ success: false, message: 'Enter a valid email' });

  const grading = Array.isArray(b.gradingSystem) ? b.gradingSystem : [];
  const gradingSystem = [];
  for (const g of grading) {
    const minPercent = num(g.minPercent), maxPercent = num(g.maxPercent);
    if (!str(g.grade, 5)) return res.status(400).json({ success: false, message: 'Every grade row needs a grade name' });
    if (minPercent > maxPercent || maxPercent > 100) return res.status(400).json({ success: false, message: `Invalid percent range for grade ${g.grade}` });
    gradingSystem.push({ grade: str(g.grade, 5), minPercent, maxPercent, points: num(g.points) });
  }

  const update = {
    schoolName, address: str(b.address, 500), phone: str(b.phone, 30), email: str(b.email, 120),
    website: str(b.website, 150), academicYear: str(b.academicYear, 20),
    currency: str(b.currency || 'INR', 5), timezone: str(b.timezone || 'Asia/Kolkata', 50),
    gradingSystem,
    feeSettings: { lateFinePerDay: num(b.feeSettings?.lateFinePerDay), receiptPrefix: str(b.feeSettings?.receiptPrefix, 10) },
    reportCardSettings: { showAttendance: b.reportCardSettings?.showAttendance !== false, showGrade: b.reportCardSettings?.showGrade !== false }
  };

  const existing = await Settings.findOne();
  const saved = existing ? await Settings.findByIdAndUpdate(existing._id, update, { new: true, runValidators: true })
                         : await Settings.create(update);
  res.json({ success: true, data: saved });
});

module.exports = router;
