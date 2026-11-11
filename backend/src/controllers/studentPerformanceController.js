const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

// The normal student form must never overwrite the performance review with old values.
// Use as: router.use(stripPerformance) in routes/students.js
exports.stripPerformance = (req, res, next) => {
  if (req.body && typeof req.body === 'object') delete req.body.performance;
  next();
};

// PUT /api/students/:id/performance   body: { rating: 1-5, description: "..." }
exports.savePerformance = async (req, res) => {
  const rating = Number(req.body.rating);
  const description = String(req.body.description ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
  if (description.length > 1000)
    return res.status(400).json({ success: false, message: 'Description must be 1000 characters or less' });

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { $set: { performance: { rating, description, reviewedBy: req.user._id, reviewedAt: new Date() } } },
    { new: true }
  ).select('firstName lastName performance');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Students', recordId: student._id, description: `Performance rated ${rating}/5 (${student.firstName} ${student.lastName})` });
  res.json({ success: true, data: student.performance });
};