const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  feeItems: [{
    type: { type: String, enum: ['Admission','Tuition','Exam','Transport','Library','Lab','Other'], required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    isInstallment: { type: Boolean, default: false }
  }],
  totalAmount: { type: Number },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

const feePaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  receiptNumber: { type: String, unique: true },
  paymentDate: { type: Date, default: Date.now },
  feeType: { type: String, enum: ['Admission','Tuition','Exam','Transport','Library','Lab','Other'], required: true },
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  fine: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash','UPI','Card','Bank Transfer','Online'], required: true },
  transactionId: { type: String },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  academicYear: { type: String },
  remarks: { type: String },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isCancelled: { type: Boolean, default: false }
}, { timestamps: true });

feePaymentSchema.index({ student: 1, academicYear: 1 });
feePaymentSchema.index({ receiptNumber: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = { FeeStructure, FeePayment };
