/**
 * Weather Forecast Component
 * Displays hourly weather forecast table for today
 */

import { DashboardComponent } from '../base.js';
import html from './weather-forecast.html?raw';
import styles from './weather-forecast.css?raw';

class WeatherForecast extends DashboardComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    this.setContent(html, styles);
    this.fetchForecast();
    this.updateInterval = setInterval(() => this.fetchForecast(), 900000); // 15 min
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  async fetchForecast() {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(window.configManager.get('openWeatherMapLocation'))}`);
      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();
      this.updateForecast(data.hourly);
    } catch (error) {
      console.error('Forecast error:', error);
      this.showError(error.message);
    }
  }

  updateForecast(hourly) {
    const tbody = this.query('#forecastBody');
    
    if (!hourly || hourly.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light); font-style: italic;">No forecast available</td></tr>';
      return;
    }

    // Clear tbody
    tbody.innerHTML = '';

    // Clone and populate template for each hour
    hourly.forEach(item => {
      const row = this.createForecastRow(item);
      tbody.appendChild(row);
    });
  }

  createForecastRow(item) {
    const template = this.query('#forecastRowTemplate');
    const row = template.content.cloneNode(true);

    // Format time
    const time = new Date(item.time).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Get weather icon
    const icon = this.getWeatherIcon(item.condition);

    // Populate data
    row.querySelector('[data-time]').textContent = time;
    row.querySelector('[data-temp]').textContent = `${item.temp}°`;
    row.querySelector('[data-icon]').textContent = icon;
    row.querySelector('[data-precip]').textContent = `${item.precipProbability}%`;
    row.querySelector('[data-pressure]').textContent = item.pressureMb;

    return row;
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