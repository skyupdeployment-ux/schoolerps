const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

exports.getStudents = async (req, res) => {
  const { page = 1, limit = 20, search, class: classId, section, gender, isActive = true } = req.query;
  const query = { isActive };
  if (classId) query.class = classId;
  if (section) query.section = section;
  if (gender) query.gender = gender;
  if (search) query.$text = { $search: search };

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .populate('class', 'name grade')
    .populate('section', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: students, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
};

exports.getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('class', 'name grade')
    .populate('section', 'name');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found', errorCode: 'STUDENT_NOT_FOUND' });
  res.json({ success: true, data: student });
};

exports.createStudent = async (req, res) => {
  // Clean empty ObjectId fields
  if (!req.body.class) delete req.body.class;
  if (!req.body.section) delete req.body.section;

  const count = await Student.countDocuments();
  req.body.studentId = `STU${String(count + 1).padStart(5, '0')}`;

  const student = await Student.create(req.body);
  await AuditLog.create({ user: req.user._id, action: 'CREATE', module: 'Students', recordId: student._id, description: `Student ${student.firstName} ${student.lastName} created` });
  res.status(201).json({ success: true, data: student });
};

exports.updateStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Students', recordId: student._id, description: `Student ${student.firstName} updated` });
  res.json({ success: true, data: student });
};

exports.deleteStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, { isActive: false, deletedAt: new Date() }, { new: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  await AuditLog.create({ user: req.user._id, action: 'DELETE', module: 'Students', recordId: student._id, description: `Student ${student.firstName} deactivated` });
  res.json({ success: true, message: 'Student removed successfully' });
};
