/**
 * Weather Forecast Component
 * Displays hourly weather forecast table for today
 * Enhanced with network resilience
 */

import { DashboardComponent } from '../../base.js';
import html from './weather-forecast.html?raw';
import styles from './weather-forecast.css?raw';

class WeatherForecast extends DashboardComponent {
  constructor() {
    super();
    this.updateInterval = null;
    this.lastSuccessfulData = null;
  }

  connectedCallback() {
    this.setContent(html, styles);
    this.fetchForecast();
    this.updateInterval = setInterval(() => this.fetchForecast(), 900000); // 15 min
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async fetchForecast() {
    try {
      const location = window.configManager?.get('openWeatherMapLocation') || 'Seattle,US';
      const url = `/api/weather?location=${encodeURIComponent(location)}`;
      
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      
      // Cache successful data
      this.lastSuccessfulData = data.hourly;
      
      this.updateForecast(data.hourly);
      
    } catch (error) {
      console.error('Forecast error:', error);
      
      // Try cached data
      if (this.lastSuccessfulData) {
        console.log('Using cached forecast data');
        this.updateForecast(this.lastSuccessfulData, true);
      } else {
        this.showError(`Forecast unavailable: ${error.message}`);
      }
    }
  }

  updateForecast(hourly, isStale = false) {
    const tbody = this.query('#forecastBody');
    
    if (!tbody) {
      console.error('Forecast table body not found');
      return;
    }
    
    if (!hourly || hourly.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light); font-style: italic;">No forecast available</td></tr>';
      return;
    }

    try {
      // Clear tbody
      tbody.innerHTML = '';

      // Clone and populate template for each hour
      hourly.forEach(item => {
        const row = this.createForecastRow(item);
        if (row) {
          tbody.appendChild(row);
        }
      });
      
      // Show stale warning if applicable
      if (isStale) {
        this.showTransientError('Using cached forecast (connection issue)');
      }
      
    } catch (error) {
      console.error('Error updating forecast display:', error);
    }
  }

  createForecastRow(item) {
    try {
      const template = this.query('#forecastRowTemplate');
      if (!template) {
        console.error('Forecast row template not found');
        return null;
      }
      
      const row = template.content.cloneNode(true);

      // Format time
      const time = new Date(item.time).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Get weather icon
      const icon = this.getWeatherIcon(item.condition);

      // Populate data (null-safe)
      const timeEl = row.querySelector('[data-time]');
      const tempEl = row.querySelector('[data-temp]');
      const iconEl = row.querySelector('[data-icon]');
      const precipEl = row.querySelector('[data-precip]');
      const pressureEl = row.querySelector('[data-pressure]');
      
      if (timeEl) timeEl.textContent = time;
      if (tempEl) tempEl.textContent = `${item.temp}°`;
      if (iconEl) iconEl.textContent = icon;
      if (precipEl) precipEl.textContent = `${item.precipProbability}%`;
      if (pressureEl) pressureEl.textContent = item.pressureMb;

      return row;
    } catch (error) {
      console.error('Error creating forecast row:', error);
      return null;
    }
  }

  getWeatherIcon(condition) {
    const icons = {
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
    return icons[condition] || '🌤️';
  }
}

customElements.define('weather-forecast', WeatherForecast);

export { WeatherForecast };