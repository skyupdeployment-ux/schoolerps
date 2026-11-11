const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookId: { type: String, unique: true },
  isbn: { type: String },
  title: { type: String, required: true },
  author: { type: String, required: true },
  publisher: { type: String },
  category: { type: String },
  edition: { type: String },
  language: { type: String },
  year: { type: Number },
  description: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  availableQuantity: { type: Number, required: true },
  shelfNumber: { type: String },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

const libraryTransactionSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
  borrower: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'borrowerModel' },
  borrowerModel: { type: String, enum: ['Student','Teacher'] },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  lateDays: { type: Number, default: 0 },
  fine: { type: Number, default: 0 },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Issued','Returned','Overdue'], default: 'Issued' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
}, { timestamps: true });

const LibraryBook = mongoose.model('LibraryBook', bookSchema);
const LibraryTransaction = mongoose.model('LibraryTransaction', libraryTransactionSchema);

module.exports = { LibraryBook, LibraryTransaction };
