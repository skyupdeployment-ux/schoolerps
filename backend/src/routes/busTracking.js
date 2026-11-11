const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Bus, TransportAssignment } = require('../models/Transport');
const BusLocation = require('../models/BusLocation');

router.use(protect);

const STALE_MS = 10 * 60 * 1000; // no GPS ping for 10 min => Off Duty
const DEFAULT_LAT = 12.9716;     // fallback map centre for buses with no GPS yet
const DEFAULT_LNG = 77.5946;

// POST /api/bus-tracking/update  — driver phone sends its GPS position
router.post('/update', authorize('super_admin', 'school_admin', 'transport_manager'), async (req, res) => {
  const { busId } = req.body;
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  const speed = Number(req.body.speed) || 0;
  const accuracy = req.body.accuracy !== undefined ? Number(req.body.accuracy) : undefined;

  if (!mongoose.Types.ObjectId.isValid(busId)) {
    return res.status(400).json({ success: false, message: 'Valid busId is required' });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ success: false, message: 'Valid lat and lng are required' });
  }
  if (!(await Bus.exists({ _id: busId }))) {
    return res.status(404).json({ success: false, message: 'Bus not found' });
  }

  const doc = await BusLocation.findOneAndUpdate(
    { bus: busId },
    { lat, lng, speed, accuracy, updatedBy: req.user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: { bus: doc.bus, lat: doc.lat, lng: doc.lng, updatedAt: doc.updatedAt } });
});

// GET /api/bus-tracking/live — latest position of every active bus
router.get('/live', async (req, res) => {
  const buses = await Bus.find({ isActive: true }).populate('route').lean();
  const [locations, counts] = await Promise.all([
    BusLocation.find({ bus: { $in: buses.map(b => b._id) } }).lean(),
    TransportAssignment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$bus', n: { $sum: 1 } } }
    ])
  ]);
  const locByBus = new Map(locations.map(l => [String(l.bus), l]));
  const countByBus = new Map(counts.map(c => [String(c._id), c.n]));
  const now = Date.now();

  const data = buses.map(b => {
    const loc = locByBus.get(String(b._id));
    const fresh = loc && now - new Date(loc.updatedAt).getTime() < STALE_MS;
    let status = 'Off Duty';
    if (fresh) status = loc.speed > 2 ? 'On Route' : 'At Stop';
    return {
      _id: b._id,
      vehicleNumber: b.vehicleNumber,
      routeNumber: b.route?.routeNumber || '—',
      routeName: b.route?.routeName || 'Unassigned',
      driverName: b.driver || '—',
      driverPhone: b.driverPhone || '',
      capacity: b.capacity,
      studentsOnBoard: countByBus.get(String(b._id)) || 0,
      status,
      speed: loc ? Math.round(loc.speed) : 0,
      lat: loc ? loc.lat : DEFAULT_LAT,
      lng: loc ? loc.lng : DEFAULT_LNG,
      hasGps: !!loc,
      nextStop: '—',
      nextStopETA: '—',
      lastUpdated: loc ? loc.updatedAt : null,
      stops: (b.route?.stops || []).map(s => ({ name: s.name, time: s.pickupTime || '', status: 'pending' }))
    };
  });

  res.json({ success: true, data });
});

module.exports = router;
