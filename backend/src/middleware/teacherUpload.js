const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// backend/uploads/teachers  (served publicly at /uploads/teachers/...)
const TEACHER_DIR = path.join(__dirname, '../../uploads/teachers');
const PUBLIC_PREFIX = '/uploads/teachers/';
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
fs.mkdirSync(TEACHER_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEACHER_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype]}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB
  fileFilter: (req, file, cb) =>
    EXT_BY_MIME[file.mimetype] ? cb(null, true) : cb(new Error('Only JPG, PNG or WebP images are allowed'))
}).single('photo');

const handleTeacherPhoto = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 2 MB or smaller' : err.message;
    res.status(400).json({ success: false, message });
  });
};

const teacherPhotoPath = (filename) => `${PUBLIC_PREFIX}${filename}`;

const removeTeacherPhotoFile = (photoPath) => {
  if (!photoPath || !photoPath.startsWith(PUBLIC_PREFIX)) return;
  fs.unlink(path.join(TEACHER_DIR, path.basename(photoPath)), () => {});
};

module.exports = { handleTeacherPhoto, teacherPhotoPath, removeTeacherPhotoFile };