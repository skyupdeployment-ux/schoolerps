const { Bus, Route, PickupPoint } = require('../models/Transport');
const AuditLog = require('../models/AuditLog');

// ---------- Vehicles ----------

exports.getVehicles = async (req, res) => {
  const { page = 1, limit = 20, search, status, isActive = true } = req.query;
  const query = { isActive };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { vehicleNumber: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
      { driver: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Bus.countDocuments(query);
  const vehicles = await Bus.find(query)
    .populate('route', 'routeName routeNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: vehicles, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
};

exports.getVehicle = async (req, res) => {
  const vehicle = await Bus.findById(req.params.id).populate('route', 'routeName routeNumber');
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found', errorCode: 'VEHICLE_NOT_FOUND' });
  res.json({ success: true, data: vehicle });
};

exports.createVehicle = async (req, res) => {
  const vehicle = await Bus.create(req.body);
  await AuditLog.create({ user: req.user._id, action: 'CREATE', module: 'Transport', recordId: vehicle._id, description: `Vehicle "${vehicle.vehicleNumber}" added` });
  res.status(201).json({ success: true, data: vehicle });
};

exports.updateVehicle = async (req, res) => {
  const vehicle = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Transport', recordId: vehicle._id, description: `Vehicle "${vehicle.vehicleNumber}" updated` });
  res.json({ success: true, data: vehicle });
};

exports.deleteVehicle = async (req, res) => {
  const vehicle = await Bus.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  await AuditLog.create({ user: req.user._id, action: 'DELETE', module: 'Transport', recordId: vehicle._id, description: `Vehicle "${vehicle.vehicleNumber}" removed` });
  res.json({ success: true, message: 'Vehicle removed successfully' });
};

// Assign a vehicle to a route
exports.assignVehicle = async (req, res) => {
  const { routeId } = req.body;

  const route = await Route.findById(routeId);
  if (!route) return res.status(404).json({ success: false, message: 'Route not found', errorCode: 'ROUTE_NOT_FOUND' });

  const vehicle = await Bus.findByIdAndUpdate(req.params.id, { route: routeId }, { new: true }).populate('route', 'routeName routeNumber');
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

  route.bus = vehicle._id;
  await route.save();

  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Transport', recordId: vehicle._id, description: `Vehicle "${vehicle.vehicleNumber}" assigned to route "${route.routeName}"` });

  res.json({ success: true, data: vehicle });
};

// ---------- Routes (for the assign-vehicle dropdown) ----------

exports.getRoutes = async (req, res) => {
  const routes = await Route.find({ isActive: true }).sort({ routeName: 1 });
  res.json({ success: true, data: routes });
};

// ---------- Pickup Points ----------

exports.getPickupPoints = async (req, res) => {
  const { page = 1, limit = 20, search, isActive = true } = req.query;
  const query = { isActive };
  if (search) query.name = { $regex: search, $options: 'i' };

  const total = await PickupPoint.countDocuments(query);
  const points = await PickupPoint.find(query)
    .populate('route', 'routeName routeNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: points, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
};

exports.createPickupPoint = async (req, res) => {
  const point = await PickupPoint.create(req.body);
  await AuditLog.create({ user: req.user._id, action: 'CREATE', module: 'Transport', recordId: point._id, description: `Pickup point "${point.name}" added` });
  res.status(201).json({ success: true, data: point });
};

exports.updatePickupPoint = async (req, res) => {
  const point = await PickupPoint.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!point) return res.status(404).json({ success: false, message: 'Pickup point not found' });
  await AuditLog.create({ user: req.user._id, action: 'UPDATE', module: 'Transport', recordId: point._id, description: `Pickup point "${point.name}" updated` });
  res.json({ success: true, data: point });
};

exports.deletePickupPoint = async (req, res) => {
  const point = await PickupPoint.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!point) return res.status(404).json({ success: false, message: 'Pickup point not found' });
  await AuditLog.create({ user: req.user._id, action: 'DELETE', module: 'Transport', recordId: point._id, description: `Pickup point "${point.name}" removed` });
  res.json({ success: true, message: 'Pickup point removed successfully' });
};

// ---------- Stats ----------

exports.getStats = async (req, res) => {
  const totalVehicles = await Bus.countDocuments({ isActive: true });
  const activeVehicles = await Bus.countDocuments({ isActive: true, status: 'Active' });
  const totalRoutes = await Route.countDocuments({ isActive: true });
  const totalPickupPoints = await PickupPoint.countDocuments({ isActive: true });

  res.json({ success: true, data: { totalVehicles, activeVehicles, totalRoutes, totalPickupPoints } });
};

