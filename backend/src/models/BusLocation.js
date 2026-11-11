const mongoose = require('mongoose');

// One document per bus = its latest GPS position (upserted, so it never grows).
const busLocationSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, unique: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  speed: { type: Number, default: 0 },
  accuracy: { type: Number },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('BusLocation', busLocationSchema);
