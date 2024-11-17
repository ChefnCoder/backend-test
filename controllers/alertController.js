// backend/controllers/alertController.js
const Alert = require('../models/Alert');

// Fetch all alerts from MongoDB
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

module.exports = { getAlerts };
