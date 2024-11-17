// backend/routes/weatherRoutes.js
const express = require('express');
const { getDailySummaries } = require('../controllers/weatherController');
const { getAlerts } = require('../controllers/alertController');

const router = express.Router();

// Route to fetch daily weather summaries
router.get('/summaries', getDailySummaries);
router.get('/alerts', getAlerts);

module.exports = router;
