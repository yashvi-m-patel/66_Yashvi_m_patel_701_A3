const express = require('express');
const path = require('path');

const app = express();
app.get('/api/weather', async (req, res) => {
  const city = String(req.query.city || '').trim();
  if (!city) return res.status(400).json({ message: 'Enter a city name.' });
  try {
    const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geoUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' });
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) throw new Error('Could not find weather data.');
    const geoData = await geoResponse.json();
    if (!geoData.results?.length) return res.status(404).json({ message: 'City not found.' });
    const place = geoData.results[0];
    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.search = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m', timezone: 'auto' });
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error('Weather service is unavailable.');
    const forecast = await forecastResponse.json();
    res.json({ place: `${place.name}${place.country ? ', ' + place.country : ''}`, current: forecast.current, current_units: forecast.current_units });
  } catch (error) { res.status(502).json({ message: error.message || 'Weather service is unavailable.' }); }
});
app.use(express.static(path.join(__dirname, 'client', 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html')));
app.listen(3006, () => console.log('Weather utility: http://localhost:3006'));