// teacherExtras.js — routes/teacherExtras.js
// Extra teacher features: photo, rating, documents

const express    = require('express');
const router     = express.Router();
const Teacher    = require('../models/Teacher');
const { protect } = require('../middleware/auth');

// PUT /api/teachers/:id/photo
router.put('/:id/photo', protect, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { photo: photoUrl },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ success:false, message:'Teacher not found' });
    res.json({ success:true, data: teacher });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

// PUT /api/teachers/:id/rating
router.put('/:id/rating', protect, async (req, res) => {
  try {
    const { rating, description } = req.body;
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { rating: Math.min(5, Math.max(1, rating)), description },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ success:false, message:'Teacher not found' });
    res.json({ success:true, data: teacher });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

// POST /api/teachers/:id/documents
router.post('/:id/documents', protect, async (req, res) => {
  try {
    const { name, type, fileUrl, fileType } = req.body;
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success:false, message:'Teacher not found' });

    if (!teacher.documents) teacher.documents = [];
    teacher.documents.push({ name, type, fileUrl, fileType, uploadedAt: new Date() });
    await teacher.save();

    res.status(201).json({ success:true, data: teacher.documents });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

// DELETE /api/teachers/:id/documents/:docId
router.delete('/:id/documents/:docId', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success:false, message:'Teacher not found' });

    teacher.documents = (teacher.documents || []).filter(
      d => d._id.toString() !== req.params.docId
    );
    await teacher.save();

    res.json({ success:true, message:'Document deleted' });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;