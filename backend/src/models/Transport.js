const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  model: { type: String },
  capacity: { type: Number, required: true },
  driver: { type: String },
  driverPhone: { type: String },
  attendant: { type: String },
  photo: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  routeNumber: { type: String, required: true },
  startPoint: { type: String },
  endPoint: { type: String },
  stops: [{ name: String, pickupTime: String, dropTime: String }],
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const pickupPointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  distanceKm: { type: Number },
  monthlyFee: { type: Number, required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const transportAssignmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  pickupPoint: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupPoint' },
  academicYear: { type: String },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);
const Route = mongoose.model('Route', routeSchema);
const PickupPoint = mongoose.model('PickupPoint', pickupPointSchema);
const TransportAssignment = mongoose.model('TransportAssignment', transportAssignmentSchema);

module.exports = { Bus, Route, PickupPoint, TransportAssignment };

