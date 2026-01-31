/**
 * Weather Current Component
 * Displays current weather conditions with temperature, humidity, wind,
 * pressure trend, and sunrise/sunset times
 * 
 * Enhanced with network resilience and null-safe DOM operations
 */

import { DashboardComponent } from '../../base.js';
import html from './weather-current.html?raw';
import styles from './weather-current.css?raw';

class WeatherCurrent extends DashboardComponent {
  constructor() {
    super();
    this.updateInterval = null;
    this.lastSuccessfulData = null;
  }

  connectedCallback() {
    this.setContent(html, styles);
    this.fetchWeather();
    // Refresh every 10 minutes
    this.updateInterval = setInterval(() => this.fetchWeather(), 600000);
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async fetchWeather() {
    try {
      const location = window.configManager?.get('openWeatherMapLocation') || 'Seattle,US';
      const url = `/api/weather?location=${encodeURIComponent(location)}`;
      
      // Use retry logic from base class
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      
      // Cache successful data
      this.lastSuccessfulData = data.current;
      
      this.updateDisplay(data.current);
      
    } catch (error) {
      console.error('Weather error:', error);
      
      // Try to show cached data with warning
      if (this.lastSuccessfulData) {
        console.log('Using cached weather data');
        this.updateDisplay(this.lastSuccessfulData, true); // true = stale data
      } else {
        // No cached data - show error
        this.showError(`Weather unavailable: ${error.message}`);
      }
    }
  }

  updateDisplay(current, isStale = false) {
    // Null-safe DOM updates
    try {
      // Temperature and condition
      this.setText('#currentTemp', `${current.temp}°F${isStale ? ' ⚠' : ''}`);
      
      const icons = this.getWeatherIcon(current.condition);
      this.setText('#currentCondition', `${icons.emoji} ${current.condition}`);
      
      // Set background icon (Nerd Font glyph)
      const container = this.query('.weather-left');
      if (container) {
        container.setAttribute('data-icon', icons.nerdFont);
      }

      // Humidity and wind
      this.setText('#humidity', `${current.humidity}%`);
      this.setText('#wind', `${current.windSpeed} mph`);

      // AQI (if available)
      if (current.aqi) {
        const aqi = this.getAQIColor(current.aqi);
        const aqiRow = this.query('#aqiRow');
        const aqiDot = this.query('#aqiDot');
        
        if (aqiRow) aqiRow.style.display = 'flex';
        if (aqiDot) aqiDot.style.color = aqi.color;
        this.setText('#aqiLabel', aqi.label);
      }

      // Pressure and trend
      const pressure = current.pressure || current.pressureMb;
      this.setText('#pressure', `${pressure} hPa`);
      
      const pressureTrend = this.getPressureTrend(current.pressure);
      const trendElement = this.query('#pressureTrend');
      if (trendElement) {
        trendElement.textContent = pressureTrend;
        trendElement.style.color = this.getPressureTrendColor(pressureTrend);
      }

      // Sunrise and sunset
      const sunrise = this.formatSunTime(current.sunrise);
      const sunset = this.formatSunTime(current.sunset);
      this.setText('#sunrise', `🌅 ${sunrise}  • • •  `);
      this.setText('#sunset', `🌇 ${sunset}`);
      
      // Show stale data warning if applicable
      if (isStale) {
        this.showTransientError('Using cached weather data (connection issue)');
      }
      
    } catch (error) {
      console.error('Error updating weather display:', error);
      // Don't crash - just log the error
    }
  }

  getAQIColor(aqi) {
    if (aqi <= 50) return { color: 'var(--aqi-good)', label: 'Good' };
    if (aqi <= 100) return { color: 'var(--aqi-moderate)', label: 'Moderate' };
    if (aqi <= 150) return { color: 'var(--aqi-unhealthy-sensitive)', label: 'Unhealthy' };
    if (aqi <= 200) return { color: 'var(--aqi-unhealthy)', label: 'Very Unhealthy' };
    if (aqi <= 300) return { color: 'var(--aqi-very-unhealthy)', label: 'Very Unhealthy' };
    return { color: 'var(--aqi-hazardous)', label: 'Hazardous' };
  }

  getPressureTrend(currentPressure) {
    try {
      // Get stored pressure from 3 hours ago
      const storedData = localStorage.getItem('weatherPressureHistory');
      const now = Date.now();
      
      if (!storedData) {
        // First time - store current pressure and return steady
        this.storePressure(currentPressure, now);
        return '➡️ Steady';
      }
      
      const history = JSON.parse(storedData);
      
      // Clean up old entries (older than 6 hours)
      const sixHoursAgo = now - (6 * 60 * 60 * 1000);
      history.readings = history.readings.filter(r => r.timestamp > sixHoursAgo);
      
      // Store current reading
      history.readings.push({ pressure: currentPressure, timestamp: now });
      localStorage.setItem('weatherPressureHistory', JSON.stringify(history));
      
      // Need at least 2 readings, 2+ hours apart
      if (history.readings.length < 2) {
        return '➡️ Steady';
      }
      
      // Compare with reading from ~3 hours ago
      const threeHoursAgo = now - (3 * 60 * 60 * 1000);
      const oldReading = history.readings.find(r => r.timestamp < threeHoursAgo);
      
      if (!oldReading) {
        return '➡️ Steady';
      }
      
      const diff = currentPressure - oldReading.pressure;
      
      // Significant change is +/- 2 hPa over 3 hours
      if (diff > 2) {
        return '⬆️ Rising';
      } else if (diff < -2) {
        return '⬇️ Falling';
      } else {
        return '➡️ Steady';
      }
    } catch (error) {
      console.error('Error calculating pressure trend:', error);
      return '➡️ Steady';
    }
  }

  storePressure(pressure, timestamp) {
    try {
      const history = {
        readings: [{ pressure, timestamp }]
      };
      localStorage.setItem('weatherPressureHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error storing pressure data:', error);
    }
  }

  getPressureTrendColor(trend) {
    if (trend.includes('Rising') || trend.includes('⬆️')) {
      return 'var(--pressure-rising)';
    } else if (trend.includes('Falling') || trend.includes('⬇️')) {
      return 'var(--pressure-falling)';
    } else {
      return 'var(--pressure-steady)';
    }
  }

  formatSunTime(unixTimestamp) {
    if (!unixTimestamp) return '--:--';
    
    try {
      const date = new Date(unixTimestamp * 1000);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles'
      });
    } catch (error) {
      console.error('Error formatting sun time:', error);
      return '--:--';
    }
  }

  getWeatherIcon(condition) {
    // Emoji for inline display
    const emoji = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Smoke': '💨',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Fog': '🌫️',
      'Sand': '🌪️',
      'Ash': '💨',
      'Squall': '💨',
      'Tornado': '🌪️',
    };
    
    // Nerd Font glyphs for background (monochrome, from Weather Icons set)
    const nerdFont = {
      'Clear': '\ue30d',        // nf-weather-day_sunny
      'Clouds': '\ue33d',       // nf-weather-cloudy
      'Rain': '\ue318',         // nf-weather-rain
      'Drizzle': '\ue319',      // nf-weather-sprinkle
      'Thunderstorm': '\ue31d', // nf-weather-thunderstorm
      'Snow': '\ue31a',         // nf-weather-snow
      'Mist': '\ue313',         // nf-weather-fog
      'Smoke': '\ue35c',        // nf-weather-smoke
      'Haze': '\ue313',         // nf-weather-fog
      'Dust': '\ue35c',         // nf-weather-smoke
      'Fog': '\ue313',          // nf-weather-fog
      'Sand': '\ue35c',         // nf-weather-smoke
      'Ash': '\ue35c',          // nf-weather-smoke
      'Squall': '\ue34b',       // nf-weather-strong_wind
      'Tornado': '\ue351',      // nf-weather-tornado
    };
    
    return {
      emoji: emoji[condition] || '🌤️',
      nerdFont: nerdFont[condition] || '\ue30d'
    };
  }
}

customElements.define('weather-current', WeatherCurrent);

export { WeatherCurrent };