// models/WeatherData.js
const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  city: { type: String, required: true },
  temperature: { type: Number, required: true },
  feels_like: { type: Number, required: true },
  condition: { type: String, required: true },
  icon: { type: String, required: true },  // Add this line to store icon data
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WeatherData', weatherDataSchema);
