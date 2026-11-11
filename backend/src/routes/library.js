const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBooks, getBook, createBook, updateBook, deleteBook,
  getTransactions, issueBook, returnBook, getStats
} = require('../controllers/libraryController');

router.use(protect);

router.get('/stats', getStats);

router.get('/transactions', getTransactions);
router.post('/transactions/issue', authorize('super_admin', 'school_admin'), issueBook);
router.put('/transactions/:id/return', authorize('super_admin', 'school_admin'), returnBook);

router.route('/books')
  .get(getBooks)
  .post(authorize('super_admin', 'school_admin'), createBook);

router.route('/books/:id')
  .get(getBook)
  .put(authorize('super_admin', 'school_admin'), updateBook)
  .delete(authorize('super_admin', 'school_admin'), deleteBook);

module.exports = router;