const axios = require('axios');
const WeatherData = require('../models/WeatherData');
const DailySummary = require('../models/DailySummary');
const Alert = require('../models/Alert');

// Helper function to convert Kelvin to Celsius
const convertKelvinToCelsius = (kelvin) => kelvin - 273.15;

// User-configurable thresholds for triggering alerts
const userThresholds = {
  temperature: 20  // Example: Alert if temperature exceeds 35°C
};

// Function to check if the weather data breaches user-configurable thresholds
// Object to store the last temperature update for each city
let lastTemperatures = {};

// Function to check if the weather data breaches user-configurable thresholds
const checkAlertConditions = async (weather) => {
  const city = weather.city;
  const currentTemp = weather.temperature;

  // Check if there's a last temperature recorded for the city
  if (lastTemperatures[city] !== undefined) {
    const lastTemp = lastTemperatures[city];

    // Trigger alert if the last and current temperatures exceed the threshold
    if (lastTemp > userThresholds.temperature && currentTemp > userThresholds.temperature) {
      const alertMessage = `Temperature in ${city} exceeded ${userThresholds.temperature}°C for two consecutive updates.`;
      console.log(alertMessage);

      // Optionally delete old alerts
      await Alert.deleteMany({});  // Keeps only the latest alert

      // Save the alert in MongoDB
      const newAlert = new Alert({ city, message: alertMessage });
      await newAlert.save();

      
    }
  }

  // Update last temperature for the city
  lastTemperatures[city] = currentTemp;
};




// Fetch weather data from OpenWeatherMap API for a given city
// const fetchWeatherData = async (city) => {
//   const apiKey = process.env.OPENWEATHERMAP_API_KEY;
//   const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

//   try {
//     const response = await axios.get(url);
//     const data = response.data;

//     return {
//       city: data.name,
//       temperature: convertKelvinToCelsius(data.main.temp),
//       feels_like: convertKelvinToCelsius(data.main.feels_like),
//       condition: data.weather[0].main,
//       timestamp: new Date(data.dt * 1000),  // Convert Unix timestamp to JavaScript Date
//     };
//   } catch (error) {
//     throw new Error('Error fetching weather data');
//   }
// };
const fetchWeatherData = async (city) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    return {
      city: data.name,
      temperature: convertKelvinToCelsius(data.main.temp),
      feels_like: convertKelvinToCelsius(data.main.feels_like),
      condition: data.weather[0].main,
      icon: data.weather[0].icon,  // Fetch and store the icon code here
      timestamp: new Date(data.dt * 1000),  // Convert Unix timestamp to JavaScript Date
    };
  } catch (error) {
    throw new Error('Error fetching weather data');
  }
};


// Save fetched weather data to MongoDB and check for alerts
const saveWeatherData = async (weather) => {
  const weatherData = new WeatherData(weather);
  await weatherData.save();

  // Check for alerts after saving the weather data
  checkAlertConditions(weather);
};

// Fetch and save weather data for multiple cities
const getWeatherForCities = async () => {
  const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

  try {
    const weatherPromises = cities.map(fetchWeatherData);
    const weatherDataArray = await Promise.all(weatherPromises);

    weatherDataArray.forEach(async (weather) => {
      await saveWeatherData(weather);
    });

    console.log('Weather data fetched and stored successfully');
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
};

// Calculate daily weather summary for a specific city
// Backend controller
// const calculateDailySummary = async (city) => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const tomorrow = new Date(today);
//   tomorrow.setDate(today.getDate() + 1);

//   const weatherData = await WeatherData.find({
//     city,
//     timestamp: { $gte: today, $lt: tomorrow }
//   });

//   if (weatherData.length === 0) {
//     console.log(`No weather data found for ${city} today.`);
//     return null;
//   }

//   const avgTemp = weatherData.reduce((sum, entry) => sum + entry.temperature, 0) / weatherData.length;
//   const maxTemp = Math.max(...weatherData.map(entry => entry.temperature));
//   const minTemp = Math.min(...weatherData.map(entry => entry.temperature));

//   // Determine the dominant weather condition and icon
//   const conditions = weatherData.map(entry => ({ condition: entry.condition, icon: entry.icon }));
//   const dominantCondition = conditions
//     .map(c => c.condition)
//     .sort((a, b) =>
//       conditions.filter(c => c.condition === a).length - conditions.filter(c => c.condition === b).length
//     )
//     .pop();
//   return {
//     city,
//     avg_temp: avgTemp,
//     max_temp: maxTemp,
//     min_temp: minTemp,
//     dominant_condition: dominantCondition,
//     date: today
//   };
// };

// controllers/weatherController.js

const calculateDailySummary = async (city) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const weatherData = await WeatherData.find({
    city,
    timestamp: { $gte: today, $lt: tomorrow }
  });

  if (weatherData.length === 0) {
    console.log(`No weather data found for ${city} today.`);
    return null;
  }

  const avgTemp = weatherData.reduce((sum, entry) => sum + entry.temperature, 0) / weatherData.length;
  const maxTemp = Math.max(...weatherData.map(entry => entry.temperature));
  const minTemp = Math.min(...weatherData.map(entry => entry.temperature));

  // Determine the dominant weather condition and icon
  const conditions = weatherData.map(entry => ({
    condition: entry.condition,
    icon: entry.icon  // Include the icon in the summary
  }));

  const dominantConditionEntry = conditions
    .sort((a, b) =>
      conditions.filter(c => c.condition === a.condition).length -
      conditions.filter(c => c.condition === b.condition).length
    )
    .pop();

  return {
    city,
    avg_temp: avgTemp,
    max_temp: maxTemp,
    min_temp: minTemp,
    dominant_condition: dominantConditionEntry.condition,
    icon: dominantConditionEntry.icon,  // Save the icon here
    date: today
  };
};




// Save daily weather summary to MongoDB
const saveDailySummary = async (city) => {
  const dailySummary = await calculateDailySummary(city);

  if (dailySummary) {
    const summary = new DailySummary(dailySummary);
    await summary.save();
    console.log(`Daily summary saved for ${city}`);
  }
};


// Fetch all daily summaries from MongoDB (for frontend)
const getDailySummaries = async (req, res) => {
  try {
    const summaries = await DailySummary.find().sort({ date: -1 });  // Sort by most recent date
    res.status(200).json(summaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily summaries' });
  }
};

module.exports = {
  getWeatherForCities,
  saveDailySummary,
  getDailySummaries,  // Ensure this is exported for use in routes
};
