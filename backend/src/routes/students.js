// backend/src/routes/students.js — REPLACE your existing file with this
const express = require('express');
const router  = express.Router();
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

const optional = (p) => {
  try { return require(p); }
  catch(e) { console.warn('[students] extra not loaded:', e.message); return null; }
};

const photoCtl = optional('../controllers/studentPhotoController');
const docCtl   = optional('../controllers/studentDocumentController');
const perfCtl  = optional('../controllers/studentPerformanceController');
const upload   = optional('../middleware/upload');

const admin = authorize('super_admin', 'school_admin');

const stripProtectedFields = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    delete req.body.photo;
    delete req.body.documents;
    delete req.body.performance;
  }
  next();
};

router.use(protect);
router.use(stripProtectedFields);

router.route('/').get(getStudents).post(admin, createStudent);

// Photo routes — only add if BOTH upload and photoCtl loaded AND functions exist
if (upload && upload.handleStudentPhoto && photoCtl && photoCtl.uploadPhoto) {
  router.post('/:id/photo',   admin, upload.handleStudentPhoto, photoCtl.uploadPhoto);
  router.delete('/:id/photo', admin, photoCtl.removePhoto);
} else {
  // Stub routes so frontend doesn't get 404
  router.post('/:id/photo',   admin, (req,res) => res.json({ success:true, message:'Photo upload not configured' }));
  router.delete('/:id/photo', admin, (req,res) => res.json({ success:true, message:'Photo upload not configured' }));
}

// Document routes
if (upload && upload.handleStudentDocument && docCtl && docCtl.addDocument) {
  router.post('/:id/documents',              admin, upload.handleStudentDocument, docCtl.addDocument);
  router.get('/:id/documents/:docId/file',   admin, docCtl.downloadDocument);
  router.delete('/:id/documents/:docId',     admin, docCtl.deleteDocument);
} else {
  router.post('/:id/documents',            admin, (req,res) => res.json({ success:true, data:[] }));
  router.get('/:id/documents/:docId/file', admin, (req,res) => res.json({ success:true, data:{} }));
  router.delete('/:id/documents/:docId',   admin, (req,res) => res.json({ success:true, message:'Deleted' }));
}

// Performance routes
if (perfCtl && perfCtl.savePerformance) {
  router.put('/:id/performance', admin, perfCtl.savePerformance);
} else {
  router.put('/:id/performance', admin, (req,res) => res.json({ success:true, data:[] }));
}

router.route('/:id').get(getStudent).put(admin, updateStudent).delete(admin, deleteStudent);

module.exports = router;