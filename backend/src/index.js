require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const feeRoutes = require('./routes/fees');
const examinationRoutes = require('./routes/examinations');
const libraryRoutes = require('./routes/library');
const transportRoutes = require('./routes/transport');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/auditLogs');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Connect DB
connectDB();

// Security Middleware
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'frame-src': ["'self'", 'https://maps.google.com', 'https://www.google.com'],
    },
  },
}));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 200,
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files
// Helmet's default "same-origin" policy would block <img> loads from the frontend origin
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
// Teacher photo + rating (optional: if this file has a problem, the server still starts and login keeps working)
try { app.use('/api/teachers', require('./routes/teacherExtras')); }
catch (e) { console.warn('[teachers] photo/rating extras not loaded:', e.message); }
app.use('/api/teachers', teacherRoutes);
// Classes + sections management (optional: if this file has a problem, the server still starts and login keeps working)
try { app.use('/api/classes', require('./routes/classesManage')); }
catch (e) { console.warn('[classes] management routes not loaded:', e.message); }
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
// Timetable grid (optional: if this file has a problem, the server still starts and login keeps working)
try { app.use('/api/timetable', require('./routes/timetableManage')); }
catch (e) { console.warn('[timetable] routes not loaded:', e.message); }
app.use('/api/timetable', timetableRoutes);
// Attendance sheet + report (optional: if this file has a problem, the server still starts and login keeps working)
try { app.use('/api/attendance', require('./routes/attendanceManage')); }
catch (e) { console.warn('[attendance] routes not loaded:', e.message); }
app.use('/api/attendance', attendanceRoutes);
// Fees, receipts, fee structure (optional: if this file has a problem, the server still starts and login keeps working)
try { app.use('/api/fees', require('./routes/feesManage')); }
catch (e) { console.warn('[fees] routes not loaded:', e.message); }
app.use('/api/fees', feeRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/bus-tracking', require('./routes/busTracking'));
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'School ERP API Running' }));

// Serve the built React frontend (single-service deploy)
const clientDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => { if (err) next(); });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
