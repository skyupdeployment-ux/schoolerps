const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, assignVehicle,
  getRoutes,
  getPickupPoints, createPickupPoint, updatePickupPoint, deletePickupPoint,
  getStats
} = require('../controllers/transportController');

router.use(protect);

router.get('/stats', getStats);
router.get('/routes', getRoutes);

router.get('/pickup-points', getPickupPoints);
router.post('/pickup-points', authorize('super_admin', 'school_admin'), createPickupPoint);
router.put('/pickup-points/:id', authorize('super_admin', 'school_admin'), updatePickupPoint);
router.delete('/pickup-points/:id', authorize('super_admin', 'school_admin'), deletePickupPoint);

router.route('/vehicles')
  .get(getVehicles)
  .post(authorize('super_admin', 'school_admin'), createVehicle);

router.route('/vehicles/:id')
  .get(getVehicle)
  .put(authorize('super_admin', 'school_admin'), updateVehicle)
  .delete(authorize('super_admin', 'school_admin'), deleteVehicle);

router.put('/vehicles/:id/assign', authorize('super_admin', 'school_admin'), assignVehicle);

module.exports = router;