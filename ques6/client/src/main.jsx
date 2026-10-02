import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

async function getDirectWeather(city) {
  const params = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' });
  const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  const geoData = await geoResponse.json();
  if (!geoData.results?.length) throw new Error('City not found.');
  const place = geoData.results[0];
  const forecastParams = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m', timezone: 'auto' });
  const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`);
  if (!forecastResponse.ok) throw new Error('Weather service is unavailable.');
  const forecast = await forecastResponse.json();
  return { place: `${place.name}${place.country ? ', ' + place.country : ''}`, current: forecast.current, current_units: forecast.current_units };
}
function App() {
  const [city, setCity] = useState('London');
  const [weather, setWeather] = useState(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function search(method) {
    if (!city.trim()) return;
    setLoading(true); setError(''); setWeather(null);
    try {
      const result = method === 'frontend' ? await getDirectWeather(city.trim()) : await (async () => {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city.trim())}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      })();
      setWeather(result); setSource(method === 'frontend' ? 'Fetched directly by the frontend' : 'Fetched by the Express backend');
    } catch (err) { setError(err.message || 'Could not load weather.'); }
    finally { setLoading(false); }
  }
  return <main><header><p className="eyebrow">OPEN-METEO · LIVE CONDITIONS</p><h1>Weather Check</h1><p>Current weather for a city, from a free weather service.</p></header><section><form onSubmit={(event) => { event.preventDefault(); search('backend'); }}><label htmlFor="city">City</label><input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Mumbai" /><div className="actions"><button disabled={loading} type="submit">{loading ? 'Loading...' : 'Search via backend'}</button><button disabled={loading} type="button" className="secondary" onClick={() => search('frontend')}>Search via frontend</button></div></form>{error && <p className="error">{error}</p>}{weather && <article><p className="eyebrow">{source}</p><h2>{weather.place}</h2><p className="temperature">{weather.current.temperature_2m}<span>{weather.current_units.temperature_2m}</span></p><div className="details"><p>Feels like <strong>{weather.current.apparent_temperature}°</strong></p><p>Humidity <strong>{weather.current.relative_humidity_2m}%</strong></p><p>Wind <strong>{weather.current.wind_speed_10m} km/h</strong></p><p>Updated <strong>{weather.current.time}</strong></p></div></article>}</section><footer>Weather data provided by Open-Meteo.</footer></main>;
}
createRoot(document.getElementById('root')).render(<App />);