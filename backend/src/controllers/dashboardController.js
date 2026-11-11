const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Class } = require('../models/Class');
const Attendance = require('../models/Attendance');
const { FeePayment } = require('../models/Fee');
const { LibraryBook } = require('../models/Library');
const { Bus } = require('../models/Transport');

exports.getStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalStudents, totalTeachers, totalClasses,
    todayPresent, totalFees, pendingFees,
    totalBooks, activeBuses
  ] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
    Attendance.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Present' }),
    FeePayment.aggregate([{ $match: { isCancelled: false } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Student.countDocuments({ isActive: true }),
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
      totalFeesCollected: totalFees[0]?.total || 0,
      pendingFees: 0,
      totalBooks,
      activeBuses
    }
  });
};

exports.getMonthlyFees = async (req, res) => {
  const data = await FeePayment.aggregate([
    { $match: { isCancelled: false } },
    { $group: { _id: { month: { $month: '$paymentDate' }, year: { $year: '$paymentDate' } }, total: { $sum: '$totalAmount' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);
  res.json({ success: true, data });
};

exports.getRecentActivity = async (req, res) => {
  const [students, payments] = await Promise.all([
    Student.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('firstName lastName admissionNumber createdAt'),
    FeePayment.find({ isCancelled: false }).sort({ createdAt: -1 }).limit(5).populate('student', 'firstName lastName')
  ]);
  res.json({ success: true, data: { recentAdmissions: students, recentPayments: payments } });
};
