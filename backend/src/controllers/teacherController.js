const Teacher = require('../models/Teacher');
const AuditLog = require('../models/AuditLog');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Fields the client must never set directly
const PROTECTED_FIELDS = ['_id', 'teacherId', 'createdAt', 'updatedAt', '__v'];

const cleanBody = (body = {}) => {
  const data = { ...body };
  PROTECTED_FIELDS.forEach(k => delete data[k]);
  if (!Array.isArray(data.subjects)) delete data.subjects;
  if (!Array.isArray(data.assignedClasses)) delete data.assignedClasses;
  if (!Array.isArray(data.documents)) delete data.documents;
  if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
  return data;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finds another teacher (active OR deactivated) already using this email
const findEmailOwner = (email, excludeId) => {
  if (!email) return null;
  const query = { email: new RegExp(`^${escapeRegex(email)}$`, 'i') };
  if (excludeId) query._id = { $ne: excludeId };
  return Teacher.findOne(query).select('name teacherId isActive').lean();
};

// Next ID after the highest existing TCHnnn — safe after deletes, unlike countDocuments()+1
const nextTeacherId = async () => {
  const rows = await Teacher.find({ teacherId: /^TCH\d+$/i }).select('teacherId').lean();
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.teacherId.slice(3), 10) || 0), 0);
  return `TCH${String(max + 1).padStart(3, '0')}`;
};

// ── Controllers ───────────────────────────────────────────────────────────────

exports.getTeachers = async (req, res) => {
  const { page = 1, limit = 20, search, department, isActive = true } = req.query;
  const query = {};
  if (isActive !== 'all') query.isActive = isActive;
  if (department) query.department = department;
  if (search) {
    const s = escapeRegex(String(search));
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { teacherId: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } }
    ];
  }

  const total = await Teacher.countDocuments(query);
  const teachers = await Teacher.find(query)
    .select('-documents') // documents can be large — loaded per teacher via GET /:id
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: teachers, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
};

exports.getTeacher = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
  res.json({ success: true, data: teacher });
};

exports.createTeacher = async (req, res) => {
  const data = cleanBody(req.body);

  const owner = await findEmailOwner(data.email);
  if (owner) {
    if (owner.isActive) {
      return res.status(409).json({
        success: false,
        message: `This email is already used by ${owner.name} (${owner.teacherId})`
      });
    }
    // The teacher was deactivated earlier — the frontend offers to restore them
    return res.status(409).json({
      success: false,
      message: `This email belongs to deactivated teacher ${owner.name} (${owner.teacherId})`,
      inactiveTeacher: { _id: owner._id, name: owner.name, teacherId: owner.teacherId }
    });
  }

  // Retry if two admins save at the same moment and grab the same ID
  for (let attempt = 0; attempt < 3; attempt++) {
    data.teacherId = await nextTeacherId();
    try {
      const teacher = await Teacher.create(data);
      await AuditLog.create({
        user: req.user._id, action: 'CREATE', module: 'Teachers',
        recordId: teacher._id, description: `Teacher ${teacher.name} created`
      });
      return res.status(201).json({ success: true, data: teacher });
    } catch (err) {
      if (err.code === 11000 && err.keyValue && err.keyValue.teacherId) continue;
      throw err;
    }
  }
  res.status(500).json({ success: false, message: 'Could not generate a unique Teacher ID, please try again' });
};

exports.updateTeacher = async (req, res) => {
  const data = cleanBody(req.body); // Teacher ID cannot be changed after creation

  if (data.email) {
    const owner = await findEmailOwner(data.email, req.params.id);
    if (owner) {
      return res.status(409).json({
        success: false,
        message: `This email is already used by ${owner.isActive ? '' : 'deactivated teacher '}${owner.name} (${owner.teacherId})`
      });
    }
  }

  const teacher = await Teacher.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
  await AuditLog.create({
    user: req.user._id, action: 'UPDATE', module: 'Teachers',
    recordId: teacher._id, description: `Teacher ${teacher.name} updated`
  });
  res.json({ success: true, data: teacher });
};

exports.deleteTeacher = async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
  await AuditLog.create({
    user: req.user._id, action: 'DELETE', module: 'Teachers',
    recordId: teacher._id, description: `Teacher ${teacher.name} deactivated`
  });
  res.json({ success: true, message: 'Teacher removed successfully' });
};