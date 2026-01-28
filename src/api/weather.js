/**
 * Weather API Handler
 * Proxies and transforms OpenWeatherMap API responses
 */

import fetch from 'node-fetch';

/**
 * Get current weather and forecast
 * @param {string} location - Location string (e.g., "Seattle,US")
 * @param {string} apiKey - OpenWeatherMap API key
 * @returns {Promise<Object>} Weather data with current, hourly, and daily forecasts
 */
export async function getWeather(location, apiKey) {
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=imperial&appid=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenWeatherMap API error: ${response.status}`);
  }

  const data = await response.json();

  // Parse response into usable format
  const current = data.list[0];
  const result = {
    current: {
      temp: Math.round(current.main.temp),
      condition: current.weather[0].main,
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed),
      windDir: current.wind.deg || null,
      aqi: null,
      pressure: current.main.pressure,
      pressureMb: current.main.pressure,
      sunrise: data.city.sunrise,
      sunset: data.city.sunset,
    },
    hourly: [],
    daily: [],
  };

  // Process hourly forecast (today only)
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  for (let i = 0; i < data.list.length && result.hourly.length < 12; i++) {
    const item = data.list[i];
    const itemTime = new Date(item.dt * 1000);
    
    // Only include today's hours
    if (itemTime > now && itemTime <= todayEnd) {
      result.hourly.push({
        time: itemTime.toISOString(),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
        precipProbability: Math.round(item.pop * 100),
        pressure: item.main.pressure,
        pressureMb: item.main.pressure,
      });
    }
  }

  // Process daily forecast (next 3 days)
  const dailyMap = {};
  for (const item of data.list) {
    const itemTime = new Date(item.dt * 1000);
    const dayKey = itemTime.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!dailyMap[dayKey]) {
      dailyMap[dayKey] = {
        date: dayKey,
        temps: [],
        precip: [],
        pressures: [],
        aqi: [],
        conditions: new Set(),
      };
    }

    dailyMap[dayKey].temps.push(item.main.temp);
    dailyMap[dayKey].precip.push(item.pop * 100);
    dailyMap[dayKey].pressures.push(item.main.pressure);
    dailyMap[dayKey].conditions.add(item.weather[0].main);
  }

  // Convert to array, filter out today, take next 3 days
 const today = now.toISOString().split('T')[0];
 const dailyDates = Object.keys(dailyMap).sort();
// console.log('Today:', today);
// console.log('Daily dates:', dailyDates);
 const futureDates = dailyDates.filter(date => date > today);
// console.log('Future dates:', futureDates);

  for (let i = 0; i < Math.min(3, futureDates.length); i++) {
    const day = dailyMap[futureDates[i]];
    result.daily.push({
      date: day.date,
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      precipMax: Math.round(Math.max(...day.precip)),
      pressureAvg: Math.round((day.pressures.reduce((a, b) => a + b, 0) / day.pressures.length) || 0),
      condition: Array.from(day.conditions).join(', '),
    });
  }

  return result;
}