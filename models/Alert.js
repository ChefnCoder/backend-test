// models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  city: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
