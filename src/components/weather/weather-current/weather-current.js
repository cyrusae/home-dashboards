/**
 * Weather Current Component
 * Displays current weather conditions with temperature, humidity, wind,
 * pressure trend, and sunrise/sunset times
 */

import { DashboardComponent } from '../../base.js';
import html from './weather-current.html?raw';
import styles from './weather-current.css?raw';

class WeatherCurrent extends DashboardComponent {
  constructor() {
    super();
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
    }
  }

  async fetchWeather() {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(window.configManager.get('openWeatherMapLocation'))}`);
      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();
      this.updateDisplay(data.current);
    } catch (error) {
      console.error('Weather error:', error);
      this.showError(error.message);
    }
  }

  updateDisplay(current) {
    // Temperature and condition
    this.query('#currentTemp').textContent = `${current.temp}°F`;
    this.query('#currentCondition').textContent = current.condition;

    // Humidity and wind
    this.query('#humidity').textContent = `${current.humidity}%`;
    this.query('#wind').textContent = `${current.windSpeed} mph`;

    // AQI (if available)
    if (current.aqi) {
      const aqi = this.getAQIColor(current.aqi);
      const aqiRow = this.query('#aqiRow');
      const aqiDot = this.query('#aqiDot');
      const aqiLabel = this.query('#aqiLabel');
      
      aqiRow.style.display = 'flex';
      aqiDot.style.color = aqi.color;
      aqiLabel.textContent = aqi.label;
    }

    // Pressure and trend
    const pressure = current.pressure || current.pressureMb;
    this.query('#pressure').textContent = `${pressure} hPa`;
    
    const pressureTrend = this.getPressureTrend(current.pressure);
    const trendElement = this.query('#pressureTrend');
    trendElement.textContent = pressureTrend;
    trendElement.style.color = this.getPressureTrendColor(pressureTrend);

    // Sunrise and sunset
    const sunrise = this.formatSunTime(current.sunrise);
    const sunset = this.formatSunTime(current.sunset);
    this.query('#sunrise').textContent = `🌅 ${sunrise}  • • •  `;
    this.query('#sunset').textContent = `🌇 ${sunset}`;
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
  }

  storePressure(pressure, timestamp) {
    const history = {
      readings: [{ pressure, timestamp }]
    };
    localStorage.setItem('weatherPressureHistory', JSON.stringify(history));
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
    
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  }
}

customElements.define('weather-current', WeatherCurrent);

export { WeatherCurrent };