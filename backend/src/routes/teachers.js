const express = require('express');
const router = express.Router();
const { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTeachers).post(authorize('super_admin','school_admin'), createTeacher);
router.route('/:id').get(getTeacher).put(authorize('super_admin','school_admin'), updateTeacher).delete(authorize('super_admin','school_admin'), deleteTeacher);

module.exports = router;
