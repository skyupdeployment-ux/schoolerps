const Teacher = require('../models/Teacher');
const AuditLog = require('../models/AuditLog');
const { teacherPhotoPath, removeTeacherPhotoFile } = require('../middleware/teacherUpload');

const audit = (req, teacher, description) =>
  AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Teachers', recordId: teacher._id, description: `${description} (${teacher.name})` });

// The normal teacher form must never overwrite the photo or the performance review.
// Use as: router.use(stripProtectedFields) in routes/teachers.js
exports.stripProtectedFields = (req, res, next) => {
  if (req.body && typeof req.body === 'object') { delete req.body.photo; delete req.body.performance; }
  next();
};

// POST /api/teachers/:id/photo   (multipart field: "photo")
exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo uploaded' });

  const photo = teacherPhotoPath(req.file.filename);
  const previous = await Teacher.findByIdAndUpdate(req.params.id, { photo }, { new: false }); // doc BEFORE update
  if (!previous) {
    removeTeacherPhotoFile(photo);
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  removeTeacherPhotoFile(previous.photo);
  await audit(req, previous, 'Photo updated');
  res.json({ success: true, data: { _id: previous._id, photo } });
};

// DELETE /api/teachers/:id/photo
exports.removePhoto = async (req, res) => {
  const previous = await Teacher.findByIdAndUpdate(req.params.id, { $unset: { photo: 1 } }, { new: false });
  if (!previous) return res.status(404).json({ success: false, message: 'Teacher not found' });

  removeTeacherPhotoFile(previous.photo);
  await audit(req, previous, 'Photo removed');
  res.json({ success: true, message: 'Photo removed' });
};

// PUT /api/teachers/:id/performance   body: { rating: 1-5, description: "..." }
exports.savePerformance = async (req, res) => {
  const rating = Number(req.body.rating);
  const description = String(req.body.description ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
  if (description.length > 1000)
    return res.status(400).json({ success: false, message: 'Description must be 1000 characters or less' });

  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { $set: { performance: { rating, description, reviewedBy: req.user._id, reviewedAt: new Date() } } },
    { new: true }
  ).select('name performance');
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

  await audit(req, teacher, `Performance rated ${rating}/5`);
  res.json({ success: true, data: teacher.performance });
};