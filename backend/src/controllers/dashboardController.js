const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Class } = require('../models/Class');
const Attendance = require('../models/Attendance');
const { FeePayment } = require('../models/Fee');
const { LibraryBook } = require('../models/Library');
const { Bus } = require('../models/Transport');
const { feeSummary } = require('../utils/feeSummary');

exports.getStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalStudents, totalTeachers, totalClasses,
    todayPresent, fees,
    totalBooks, activeBuses
  ] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
    Attendance.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Present' }),
    feeSummary(), // same numbers as the Reports page (current academic year)
    LibraryBook.countDocuments({ isActive: true }),
    Bus.countDocuments({ status: 'Active' })
  ]);

  res.json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendance: todayPresent,
      totalFeesCollected: fees.collected,
      pendingFees: fees.pending,
      feeAcademicYear: fees.academicYear,
      totalBooks,
      activeBuses
    }
  });
};

// Months of the current academic year that have payments (same source as Reports)
exports.getMonthlyFees = async (req, res) => {
  const fees = await feeSummary();
  const data = fees.monthly
    .filter(m => m.collected > 0)
    .map(m => ({ _id: { month: m.monthNo, year: m.year }, total: m.collected }));
  res.json({ success: true, data });
};

exports.getRecentActivity = async (req, res) => {
  const [students, payments] = await Promise.all([
    Student.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('firstName lastName admissionNumber createdAt'),
    FeePayment.find({ isCancelled: { $ne: true } }).sort({ createdAt: -1 }).limit(5).populate('student', 'firstName lastName')
  ]);
  res.json({ success: true, data: { recentAdmissions: students, recentPayments: payments } });
};
