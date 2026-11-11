const express = require('express');
const router = express.Router();
const { getStats, getMonthlyFees, getRecentActivity } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/stats', getStats);
router.get('/monthly-fees', getMonthlyFees);
router.get('/recent-activity', getRecentActivity);
module.exports = router;
