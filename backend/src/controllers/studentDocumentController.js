// studentDocumentController.js
// ALL functions that students.js route might need

const Student = require('../models/Student');

// Upload / add a document to student
exports.uploadDocument = async (req, res) => {
  try {
    const { name, type, fileUrl, fileType, fileName } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    if (!student.documents) student.documents = [];
    student.documents.push({ name, type, fileUrl, fileType, fileName, uploadedAt: new Date() });
    await student.save();
    res.status(201).json({ success:true, data: student.documents });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// Get all documents for a student
exports.getDocuments = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    res.json({ success:true, data: student.documents || [] });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    student.documents = (student.documents || []).filter(
      d => d._id.toString() !== req.params.docId
    );
    await student.save();
    res.json({ success:true, message:'Document deleted' });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// Update student photo
exports.updatePhoto = async (req, res) => {
  try {
    const { photoUrl, photo } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { photo: photoUrl || photo },
      { new: true }
    );
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    res.json({ success:true, data: student });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// Upload photo (alias)
exports.uploadPhoto = exports.updatePhoto;

// Get photo
exports.getPhoto = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('photo');
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    res.json({ success:true, data: { photo: student.photo } });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// Bulk upload documents
exports.bulkUpload = async (req, res) => {
  try {
    const { documents } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    if (!student.documents) student.documents = [];
    student.documents.push(...documents);
    await student.save();
    res.status(201).json({ success:true, data: student.documents });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// Download document (stub)
exports.downloadDocument = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success:false, message:'Student not found' });
    const doc = (student.documents || []).find(d => d._id.toString() === req.params.docId);
    if (!doc) return res.status(404).json({ success:false, message:'Document not found' });
    res.json({ success:true, data: doc });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};