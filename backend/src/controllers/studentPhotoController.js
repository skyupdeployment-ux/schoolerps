const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { studentPhotoPath, removeStudentPhotoFile } = require('../middleware/upload');

// POST /api/students/:id/photo   (multipart field: "photo")
exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo uploaded' });

  const photo = studentPhotoPath(req.file.filename);
  // Returns the document as it was BEFORE the update, so we know the old photo to delete
  const previous = await Student.findByIdAndUpdate(req.params.id, { photo }, { new: false });

  if (!previous) {
    removeStudentPhotoFile(photo); // don't leave an orphan file behind
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  removeStudentPhotoFile(previous.photo);
  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Students', recordId: previous._id, description: `Photo updated for ${previous.firstName} ${previous.lastName}` });
  res.json({ success: true, data: { _id: previous._id, photo } });
};

// DELETE /api/students/:id/photo
exports.removePhoto = async (req, res) => {
  const previous = await Student.findByIdAndUpdate(req.params.id, { $unset: { photo: 1 } }, { new: false });
  if (!previous) return res.status(404).json({ success: false, message: 'Student not found' });

  removeStudentPhotoFile(previous.photo);
  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Students', recordId: previous._id, description: `Photo removed for ${previous.firstName} ${previous.lastName}` });
  res.json({ success: true, message: 'Photo removed' });
};