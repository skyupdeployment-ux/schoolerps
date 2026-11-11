// backend/src/middleware/upload.js
let multer;
try {
  multer = require('multer');
} catch(e) {
  // multer not installed — provide dummy middleware
  const dummy = (req, res, next) => next();
  module.exports = {
    handleStudentPhoto:    dummy,
    handleStudentDocument: dummy,
    handleTeacherPhoto:    dummy,
    handleTeacherDocument: dummy,
    single:  () => dummy,
    array:   () => dummy,
    fields:  () => dummy,
  };
  return;
}

const path = require('path');
const fs   = require('fs');

// Create folders
['./uploads','./uploads/students','./uploads/teachers','./uploads/documents']
  .forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive:true }); });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'photo' ? './uploads/students' : './uploads/documents';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits:{ fileSize: 5*1024*1024 } });

module.exports = {
  handleStudentPhoto:    upload.single('photo'),
  handleStudentDocument: upload.single('document'),
  handleTeacherPhoto:    upload.single('photo'),
  handleTeacherDocument: upload.single('document'),
  single:  (f) => upload.single(f),
  array:   (f,m) => upload.array(f,m),
  fields:  (f) => upload.fields(f),
};