// models/DailySummary.js
const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema({
  city: String,
  avg_temp: Number,
  max_temp: Number,
  min_temp: Number,
  dominant_condition: String,
  icon: String, // Add this line
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DailySummary', dailySummarySchema);
