// FEES in ONE file: fee structure, dues, collecting fees, receipts.
// Mounted in index.js BEFORE your normal fees route.
//   GET    /api/fees/students?q=            find a student to collect fees from
//   GET    /api/fees/dues/:studentId        fee structure vs paid, per fee type  (?academicYear=2026-27)
//   POST   /api/fees/pay                    collect a fee and create a receipt
//   GET    /api/fees/payments               receipts list (?search &from &to &page &limit)
//   GET    /api/fees/payments/:id           one receipt
//   GET    /api/fees/payments/:id/pdf       receipt as a PDF file
//   GET    /api/fees/payments/export.csv    receipts list as a CSV file (same filters as the list)
//   GET    /api/fees/whatsapp-status        is automatic WhatsApp sending set up?
//   POST   /api/fees/payments/:id/whatsapp  send the receipt PDF to the parent's WhatsApp (needs WhatsApp Cloud API keys)
//   POST   /api/fees/payments/:id/cancel    cancel a receipt (admin only)
//   GET/POST/PUT/DELETE /api/fees/structures[/:id]   fee structures
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { FeeStructure, FeePayment } = require('../models/Fee');
const Student = require('../models/Student');
require('../models/Class'); // registers Class for populate
require('../models/User');  // registers User for populate
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
// Students store class/section either as IDs or as text ("10" / "A") - these handle both
const { resolveClassId, makeLabeler } = require('../utils/studentLink');

const FEE_TYPES = ['Admission', 'Tuition', 'Exam', 'Transport', 'Library', 'Lab', 'Other'];
const METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Online'];

const feeStaff = authorize('super_admin', 'school_admin', 'accountant');
const adminOnly = authorize('super_admin', 'school_admin');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const str = (v) => String(v ?? '').trim();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const audit = (req, action, recordId, description) =>
  AuditLog.create({ user: req.user._id, action, module: 'Fees', recordId, description }).catch(() => {});

const parseDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const currentAcademicYear = () => {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
};

// ---------- receipt numbers: RCP-2026-000001 (atomic counter, so two people never get the same number) ----------
const Counter = mongoose.models.FeeCounter ||
  mongoose.model('FeeCounter', new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false }));

const nextReceiptNumber = async (date) => {
  const s = await Settings.findOne().select('feeSettings').lean();
  const prefix = str(s?.feeSettings?.receiptPrefix).replace(/[^A-Za-z0-9-]/g, '').slice(0, 10) || 'RCP';
  const key = `${prefix}-${date.getFullYear()}`;
  const c = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `${key}-${String(c.seq).padStart(6, '0')}`;
};

const getSchool = async () => {
  const s = await Settings.findOne().select('schoolName address phone email').lean();
  return { name: s?.schoolName || 'School ERP', address: s?.address || '', phone: s?.phone || '', email: s?.email || '' };
};

// Student.class is a plain String (ID or text), so it is NOT populated - makeLabeler() names it instead
const POPULATE = [
  { path: 'student', select: 'firstName lastName admissionNumber parentPhone fatherName motherName class section' },
  { path: 'collectedBy', select: 'name' }
];

const shape = (p, school, label) => ({
  _id: p._id,
  receiptNumber: p.receiptNumber,
  paymentDate: p.paymentDate,
  feeType: p.feeType,
  amount: p.amount,
  discount: p.discount || 0,
  fine: p.fine || 0,
  totalAmount: p.totalAmount,
  paymentMethod: p.paymentMethod,
  transactionId: p.transactionId || '',
  remarks: p.remarks || '',
  academicYear: p.academicYear || '',
  isCancelled: !!p.isCancelled,
  collectedBy: p.collectedBy?.name || '',
  student: p.student ? {
    _id: p.student._id,
    name: `${p.student.firstName || ''} ${p.student.lastName || ''}`.trim(),
    admissionNumber: p.student.admissionNumber,
    className: label ? label(p.student) : '',
    parentPhone: p.student.parentPhone || '',
    parentName: p.student.fatherName || p.student.motherName || ''
  } : null,
  school
});

// shape a list of payments with class names + school details in two queries
const shapeAll = async (rows) => {
  const [label, school] = await Promise.all([makeLabeler(rows.map(r => r.student)), getSchool()]);
  return rows.map(r => shape(r, school, label));
};

// ---------- RECEIPT PDF (pure JavaScript, no packages needed) ----------
// Standard Helvetica font: Latin letters only. The rupee sign is written as "Rs." and other symbols become "?".
const HELV = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const HELV_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

const pdfClean = (v) => String(v ?? '').replace(/₹/g, 'Rs. ').replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
const pdfWidth = (s, size, bold) => {
  const table = bold ? HELV_BOLD : HELV;
  let w = 0;
  for (const ch of s) { const c = ch.charCodeAt(0); w += (c >= 32 && c <= 126 ? table[c - 32] : 556); }
  return (w * size) / 1000;
};
const pdfFit = (s, size, bold, maxW) => {
  let t = pdfClean(s);
  if (pdfWidth(t, size, bold) <= maxW) return t;
  while (t.length > 1 && pdfWidth(`${t}...`, size, bold) > maxW) t = t.slice(0, -1);
  return `${t}...`;
};
const pdfEsc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function buildReceiptPdf(r) {
  const W = 420, H = 595, M = 34;
  const out = [];
  const num = (n) => (Math.round(n * 100) / 100).toString();
  const text = (s, x, y, size = 10, bold = false, gray = 0) =>
    out.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${gray} g ${num(x)} ${num(y)} Td (${pdfEsc(pdfClean(s))}) Tj ET`);
  const center = (s, y, size, bold, gray) => text(pdfClean(s), (W - pdfWidth(pdfClean(s), size, bold)) / 2, y, size, bold, gray);
  const right = (s, xr, y, size, bold, gray) => text(pdfClean(s), xr - pdfWidth(pdfClean(s), size, bold), y, size, bold, gray);
  const line = (y, gray = 0.8, width = 0.6) => out.push(`${gray} G ${width} w ${M} ${num(y)} m ${W - M} ${num(y)} l S`);
  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const dateText = new Date(r.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (r.isCancelled) out.push(`BT /F2 64 Tf 1 0.78 0.78 rg 0.94 0.34 -0.34 0.94 46 210 Tm (CANCELLED) Tj ET`);

  out.push('0.75 G 0.8 w'); out.push(`${M - 14} ${M - 14} ${W - 2 * (M - 14)} ${H - 2 * (M - 14)} re S`);

  let y = H - 62;
  center(pdfFit(r.school.name, 17, true, W - 2 * M), y, 17, true, 0); y -= 17;
  if (r.school.address) { center(pdfFit(r.school.address, 9, false, W - 2 * M), y, 9, false, 0.4); y -= 12; }
  if (r.school.phone) { center(`Phone: ${r.school.phone}`, y, 9, false, 0.4); y -= 12; }
  y -= 8; line(y, 0.6, 0.8); y -= 20;
  center('FEE RECEIPT', y, 12, true, 0); y -= 12; line(y, 0.6, 0.8); y -= 24;

  const rows = [
    ['Receipt No', r.receiptNumber, true],
    ['Date', dateText],
    ['Student', r.student?.name || ''],
    ['Admission No', r.student?.admissionNumber || ''],
    r.student?.className ? ['Class', r.student.className] : null,
    r.student?.parentName ? ['Parent', r.student.parentName] : null,
    ['Fee Type', `${r.feeType}${r.academicYear ? ` (${r.academicYear})` : ''}`],
    ['Amount', money(r.amount)],
    r.discount > 0 ? ['Discount', `- ${money(r.discount)}`] : null,
    r.fine > 0 ? ['Fine', `+ ${money(r.fine)}`] : null
  ].filter(Boolean);

  const labelW = 90;
  for (const [label, value, bold] of rows) {
    text(label, M, y, 10, false, 0.4);
    right(pdfFit(value, 10, !!bold, W - 2 * M - labelW), W - M, y, 10, !!bold, 0);
    y -= 20;
  }

  y += 6; line(y, 0.2, 1); y -= 22;
  text('Total Paid', M, y, 14, true, 0);
  right(money(r.totalAmount), W - M, y, 14, true, 0); y -= 26;

  text('Payment Mode', M, y, 10, false, 0.4);
  right(pdfFit(`${r.paymentMethod}${r.transactionId ? ` - ${r.transactionId}` : ''}`, 10, false, W - 2 * M - labelW), W - M, y, 10, false, 0); y -= 20;
  if (r.collectedBy) { text('Collected By', M, y, 10, false, 0.4); right(pdfFit(r.collectedBy, 10, false, W - 2 * M - labelW), W - M, y, 10, false, 0); y -= 20; }

  center('This is a computer generated receipt. Thank you!', M + 4, 8, false, 0.5);

  const content = out.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

// ---------- dues: fee structure total vs. paid, per fee type ----------
const calcDues = async (student, academicYear) => {
  // was: student.class used directly - crashed (CastError) for students whose class is text like "10"
  const classId = await resolveClassId(student, academicYear);
  const structures = await FeeStructure.find({
    academicYear,
    $or: classId ? [{ class: classId }, { class: null }] : [{ class: null }]
  }).lean();

  const total = {};
  structures.forEach(s => s.feeItems.forEach(i => { total[i.type] = round2((total[i.type] || 0) + i.amount); }));

  const paidRows = await FeePayment.aggregate([
    { $match: { student: student._id, academicYear, isCancelled: { $ne: true } } },
    { $group: { _id: '$feeType', paid: { $sum: '$amount' } } }
  ]);
  const paid = {};
  paidRows.forEach(r => { paid[r._id] = round2(r.paid); });

  const items = FEE_TYPES
    .filter(t => total[t] || paid[t])
    .map(t => ({ type: t, total: total[t] || 0, paid: paid[t] || 0, due: Math.max(0, round2((total[t] || 0) - (paid[t] || 0))) }));

  return {
    academicYear,
    hasStructure: structures.length > 0,
    items,
    total: round2(items.reduce((n, i) => n + i.total, 0)),
    paid: round2(items.reduce((n, i) => n + i.paid, 0)),
    due: round2(items.reduce((n, i) => n + i.due, 0))
  };
};

// ---------- FIND STUDENT ----------
router.get('/students', protect, feeStaff, wrap(async (req, res) => {
  const words = str(req.query.q).split(/\s+/).filter(Boolean).slice(0, 4);
  if (!words.length || str(req.query.q).length < 2) return res.json({ success: true, data: [] });

  const and = words.map(w => {
    const rx = new RegExp(escapeRegex(w), 'i');
    return { $or: [{ firstName: rx }, { lastName: rx }, { admissionNumber: rx }, { parentPhone: rx }] };
  });
  const data = await Student.find({ isActive: { $ne: false }, $and: and })
    .select('firstName lastName admissionNumber parentPhone fatherName photo academicYear class section')
    .limit(10).lean();
  const label = await makeLabeler(data);
  data.forEach(s => { s.className = label(s); });
  res.json({ success: true, data });
}));

// ---------- DUES ----------
router.get('/dues/:studentId', protect, feeStaff, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.studentId)) return fail(res, 'Invalid student');
  const student = await Student.findById(req.params.studentId)
    .select('firstName lastName admissionNumber parentPhone fatherName photo academicYear class section').lean();
  if (!student) return fail(res, 'Student not found', 404);
  student.className = (await makeLabeler([student]))(student);

  const academicYear = str(req.query.academicYear) || student.academicYear || currentAcademicYear();
  const dues = await calcDues(student, academicYear);

  const recent = await FeePayment.find({ student: student._id })
    .sort({ createdAt: -1 }).limit(5).select('receiptNumber paymentDate feeType totalAmount isCancelled').lean();

  res.json({ success: true, data: { student, ...dues, recent } });
}));

// ---------- COLLECT A FEE ----------
router.post('/pay', protect, feeStaff, wrap(async (req, res) => {
  const b = req.body;
  if (!mongoose.isValidObjectId(b.student)) return fail(res, 'Select a student first');
  if (!FEE_TYPES.includes(b.feeType)) return fail(res, 'Select a fee type');
  if (!METHODS.includes(b.paymentMethod)) return fail(res, 'Select a payment method');

  const amount = round2(b.amount), discount = round2(b.discount), fine = round2(b.fine);
  if (!(amount > 0)) return fail(res, 'Amount must be greater than 0');
  if (discount < 0 || discount > amount) return fail(res, 'Discount cannot be more than the amount');
  if (fine < 0) return fail(res, 'Fine cannot be negative');
  const totalAmount = round2(amount - discount + fine);

  const transactionId = str(b.transactionId).slice(0, 60);
  const remarks = str(b.remarks).slice(0, 300);

  // payment date: today (with the current time) or an earlier day, never the future
  let paymentDate = new Date();
  if (b.paymentDate) {
    const d = parseDate(b.paymentDate);
    if (!d) return fail(res, 'Invalid payment date');
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    if (d.getTime() > todayStart.getTime()) return fail(res, 'Payment date cannot be in the future');
    if (d.getTime() < todayStart.getTime()) paymentDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }

  const student = await Student.findOne({ _id: b.student, isActive: { $ne: false } }).select('class academicYear').lean();
  if (!student) return fail(res, 'Student not found', 404);
  const academicYear = str(b.academicYear) || student.academicYear || currentAcademicYear();

  // Stop typing mistakes: cannot collect more than what is due for that fee type (when a structure exists)
  const dues = await calcDues(student, academicYear);
  const line = dues.items.find(i => i.type === b.feeType);
  if (line && line.total > 0 && amount > line.due + 0.005) {
    return fail(res, `Amount is more than the due for ${b.feeType} (${academicYear}): ₹${line.due}`);
  }

  const receiptNumber = await nextReceiptNumber(paymentDate);
  const payment = await FeePayment.create({
    student: student._id, receiptNumber, paymentDate, feeType: b.feeType,
    amount, discount, fine, totalAmount,
    paymentMethod: b.paymentMethod, transactionId, remarks, academicYear,
    collectedBy: req.user._id, isCancelled: false
  });

  const populated = await FeePayment.findById(payment._id).populate(POPULATE).lean();
  await audit(req, 'CREATE', payment._id, `Receipt ${receiptNumber}: ₹${totalAmount} ${b.feeType} (${populated.student?.firstName || ''} ${populated.student?.lastName || ''})`);
  const [data] = await shapeAll([populated]);
  res.status(201).json({ success: true, data });
}));

// ---------- RECEIPTS LIST + CSV ----------
const ymd = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

// same filters for the list and for the CSV download: ?search= &from=YYYY-MM-DD &to=YYYY-MM-DD
const buildPaymentQuery = async (q) => {
  const query = {};
  const from = parseDate(q.from), to = parseDate(q.to);
  if (from || to) {
    query.paymentDate = {};
    if (from) query.paymentDate.$gte = from;
    if (to) query.paymentDate.$lt = addDays(to, 1);
  }
  const search = str(q.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const words = search.split(/\s+/).filter(Boolean).slice(0, 4);
    const ids = await Student.find({
      $and: words.map(w => { const r = new RegExp(escapeRegex(w), 'i'); return { $or: [{ firstName: r }, { lastName: r }, { admissionNumber: r }] }; })
    }).select('_id').limit(200).lean();
    query.$or = [{ receiptNumber: rx }, { student: { $in: ids.map(s => s._id) } }];
  }
  return query;
};

router.get('/payments', protect, feeStaff, wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const query = await buildPaymentQuery(req.query);

  const [rows, total, sums] = await Promise.all([
    FeePayment.find(query).sort({ paymentDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(POPULATE).lean(),
    FeePayment.countDocuments(query),
    FeePayment.aggregate([{ $match: { ...query, isCancelled: { $ne: true } } }, { $group: { _id: null, sum: { $sum: '$totalAmount' } } }])
  ]);

  res.json({
    success: true,
    data: await shapeAll(rows),
    collected: round2(sums[0]?.sum || 0),
    pagination: { total, page, pages: Math.max(1, Math.ceil(total / limit)) }
  });
}));

// A cell that starts with = + - @ could run as a formula in Excel, so it is prefixed with an apostrophe
const csvCell = (v) => {
  let t = v === null || v === undefined ? '' : String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

router.get('/payments/export.csv', protect, feeStaff, wrap(async (req, res) => {
  const query = await buildPaymentQuery(req.query);
  const rows = await FeePayment.find(query).sort({ paymentDate: -1, createdAt: -1 }).limit(20000).populate(POPULATE).lean();
  const shaped = await shapeAll(rows);

  const header = ['Receipt No', 'Date', 'Student', 'Admission No', 'Class', 'Parent Phone', 'Fee Type', 'Academic Year', 'Amount', 'Discount', 'Fine', 'Total Paid', 'Payment Method', 'Reference', 'Collected By', 'Status', 'Remarks'];
  const lines = [header].concat(shaped.map(r => {
    return [r.receiptNumber, ymd(r.paymentDate), r.student?.name || '', r.student?.admissionNumber || '', r.student?.className || '', r.student?.parentPhone || '',
      r.feeType, r.academicYear, r.amount, r.discount, r.fine, r.totalAmount, r.paymentMethod, r.transactionId, r.collectedBy, r.isCancelled ? 'Cancelled' : 'Paid', r.remarks];
  }));

  const from = str(req.query.from) || 'start', to = str(req.query.to) || 'today';
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="fee-receipts_${from}_to_${to}.csv"`,
    'Cache-Control': 'private, no-store'
  });
  res.send('\uFEFF' + lines.map(row => row.map(csvCell).join(',')).join('\r\n')); // BOM so Excel shows symbols correctly
}));

router.get('/payments/:id', protect, feeStaff, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Invalid receipt');
  const p = await FeePayment.findById(req.params.id).populate(POPULATE).lean();
  if (!p) return fail(res, 'Receipt not found', 404);
  const [data] = await shapeAll([p]);
  res.json({ success: true, data });
}));

const loadReceipt = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const p = await FeePayment.findById(id).populate(POPULATE).lean();
  return p ? (await shapeAll([p]))[0] : null;
};

// ---------- RECEIPT AS PDF ----------
router.get('/payments/:id/pdf', protect, feeStaff, wrap(async (req, res) => {
  const r = await loadReceipt(req.params.id);
  if (!r) return fail(res, 'Receipt not found', 404);
  const pdf = buildReceiptPdf(r);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${r.receiptNumber}.pdf"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'private, no-store'
  });
  res.send(pdf);
}));

// ---------- WHATSAPP CLOUD API (optional) ----------
// Needs these in backend/.env (see README-WHATSAPP.txt):
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and for messages to parents who did not write first: WHATSAPP_TEMPLATE_NAME
const waConfig = () => ({
  token: process.env.WHATSAPP_TOKEN,
  phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  template: process.env.WHATSAPP_TEMPLATE_NAME,
  lang: process.env.WHATSAPP_TEMPLATE_LANG || 'en',
  version: process.env.WHATSAPP_API_VERSION || 'v20.0',
  country: process.env.WHATSAPP_COUNTRY_CODE || '91'
});

const waNumber = (raw, country) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = country + d;
  return d.length >= 11 && d.length <= 15 ? d : null;
};

const waCall = async (cfg, path, options) => {
  const r = await fetch(`https://graph.facebook.com/${cfg.version}/${cfg.phoneId}/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${cfg.token}`, ...(options.headers || {}) }
  });
  let body = {};
  try { body = await r.json(); } catch { /* not JSON */ }
  if (!r.ok) {
    const e = new Error(body.error?.error_user_msg || body.error?.message || `WhatsApp error ${r.status}`);
    e.waCode = body.error?.code;
    throw e;
  }
  return body;
};

const waFriendlyError = (e) => {
  if (e.waCode === 131047) return 'WhatsApp only allows an approved template message to this parent (they have not messaged your number in the last 24 hours). Set WHATSAPP_TEMPLATE_NAME in backend/.env - see README-WHATSAPP.txt.';
  if (e.waCode === 131030) return 'This number is not on your WhatsApp test recipient list. Add it in the Meta developer dashboard, or use a live number.';
  if (e.waCode === 190) return 'The WhatsApp access token is invalid or has expired. Create a new token and update WHATSAPP_TOKEN in backend/.env.';
  return `WhatsApp said: ${e.message}`;
};

const oneLine = (v) => String(v ?? '').replace(/\s+/g, ' ').trim() || '-';

router.get('/whatsapp-status', protect, feeStaff, (req, res) => {
  const cfg = waConfig();
  res.json({ success: true, data: { configured: !!(cfg.token && cfg.phoneId && typeof fetch === 'function'), template: !!cfg.template } });
});

router.post('/payments/:id/whatsapp', protect, feeStaff, wrap(async (req, res) => {
  const cfg = waConfig();
  if (!cfg.token || !cfg.phoneId) return fail(res, 'Automatic WhatsApp sending is not set up yet. See README-WHATSAPP.txt.');
  if (typeof fetch !== 'function' || typeof FormData !== 'function') return fail(res, 'Automatic sending needs Node.js 18 or newer on the server.', 500);

  const r = await loadReceipt(req.params.id);
  if (!r) return fail(res, 'Receipt not found', 404);
  if (r.isCancelled) return fail(res, 'This receipt is cancelled');

  const to = waNumber(req.body.phone || r.student?.parentPhone, cfg.country);
  if (!to) return fail(res, 'Enter a valid WhatsApp number (with country code if it is not an Indian number)');

  const filename = `${r.receiptNumber}.pdf`;
  try {
    // 1) upload the PDF to WhatsApp
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'application/pdf');
    form.append('file', new Blob([buildReceiptPdf(r)], { type: 'application/pdf' }), filename);
    const media = await waCall(cfg, 'media', { method: 'POST', body: form });

    // 2) send it: an approved template (works any time) or a plain document (only inside the 24-hour window)
    const payload = cfg.template
      ? {
          messaging_product: 'whatsapp', to, type: 'template',
          template: {
            name: cfg.template, language: { code: cfg.lang },
            components: [
              { type: 'header', parameters: [{ type: 'document', document: { id: media.id, filename } }] },
              { type: 'body', parameters: [
                { type: 'text', text: oneLine(r.student?.name) },
                { type: 'text', text: oneLine(r.receiptNumber) },
                { type: 'text', text: `Rs. ${r.totalAmount}` }
              ] }
            ]
          }
        }
      : {
          messaging_product: 'whatsapp', to, type: 'document',
          document: { id: media.id, filename, caption: `Fee receipt ${r.receiptNumber} - ${r.school.name}` }
        };
    await waCall(cfg, 'messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    return fail(res, waFriendlyError(e), 502);
  }

  await audit(req, 'UPDATE', r._id, `Receipt ${r.receiptNumber} sent on WhatsApp to ${to}`);
  res.json({ success: true, message: `Receipt sent on WhatsApp to +${to}` });
}));

router.post('/payments/:id/cancel', protect, adminOnly, wrap(async (req, res) => {
  const reason = str(req.body.reason);
  if (reason.length < 3) return fail(res, 'Please give a reason for cancelling');
  const p = await FeePayment.findById(req.params.id);
  if (!p) return fail(res, 'Receipt not found', 404);
  if (p.isCancelled) return fail(res, 'This receipt is already cancelled');

  p.isCancelled = true;
  p.remarks = `${p.remarks ? `${p.remarks} | ` : ''}CANCELLED: ${reason}`.slice(0, 500);
  await p.save();
  await audit(req, 'DELETE', p._id, `Receipt ${p.receiptNumber} cancelled: ${reason}`);
  res.json({ success: true, message: 'Receipt cancelled' });
}));

// ---------- FEE STRUCTURES ----------
const cleanStructure = (b) => {
  const name = str(b.name), academicYear = str(b.academicYear);
  const classId = b.class ? String(b.class) : null;
  if (!name) return { error: 'Structure name is required' };
  if (!academicYear) return { error: 'Academic year is required' };
  if (classId && !mongoose.isValidObjectId(classId)) return { error: 'Invalid class' };

  const items = Array.isArray(b.feeItems) ? b.feeItems : [];
  if (!items.length) return { error: 'Add at least one fee item' };
  const feeItems = [];
  for (const it of items) {
    if (!FEE_TYPES.includes(it.type)) return { error: 'Choose a fee type for every item' };
    const amount = round2(it.amount);
    if (!(amount > 0)) return { error: 'Every fee item needs an amount greater than 0' };
    const item = { type: it.type, amount };
    if (it.dueDate) {
      const d = parseDate(String(it.dueDate).slice(0, 10));
      if (!d) return { error: 'Invalid due date' };
      item.dueDate = d;
    }
    feeItems.push(item);
  }
  return { value: { name, academicYear, class: classId, feeItems, totalAmount: round2(feeItems.reduce((n, i) => n + i.amount, 0)) } };
};

router.get('/structures', protect, feeStaff, wrap(async (req, res) => {
  const data = await FeeStructure.find().populate('class', 'name').sort({ academicYear: -1, createdAt: -1 }).lean();
  res.json({ success: true, data });
}));

router.post('/structures', protect, adminOnly, wrap(async (req, res) => {
  const { value, error } = cleanStructure(req.body);
  if (error) return fail(res, error);
  const s = await FeeStructure.create(value);
  await audit(req, 'CREATE', s._id, `Fee structure created: ${s.name} (${s.academicYear})`);
  res.status(201).json({ success: true, data: s });
}));

router.put('/structures/:id', protect, adminOnly, wrap(async (req, res) => {
  const { value, error } = cleanStructure(req.body);
  if (error) return fail(res, error);
  const s = await FeeStructure.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
  if (!s) return fail(res, 'Fee structure not found', 404);
  await audit(req, 'UPDATE', s._id, `Fee structure updated: ${s.name} (${s.academicYear})`);
  res.json({ success: true, data: s });
}));

router.delete('/structures/:id', protect, adminOnly, wrap(async (req, res) => {
  const s = await FeeStructure.findByIdAndDelete(req.params.id);
  if (!s) return fail(res, 'Fee structure not found', 404);
  await audit(req, 'DELETE', s._id, `Fee structure deleted: ${s.name} (${s.academicYear})`);
  res.json({ success: true, message: 'Fee structure deleted' });
}));

module.exports = router;