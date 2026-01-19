/**
 * Weather Components
 * Current conditions (left) + Hourly forecast wttr.in-inspired table (right)
 */

import { DashboardComponent } from '../components/base.js';

class WeatherCurrent extends DashboardComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    this.renderInitial();
    this.fetchWeather();
    // Refresh every 10 minutes
    this.updateInterval = setInterval(() => this.fetchWeather(), 600000);
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  renderInitial() {
    const html = `<div class="weather-left"><div style="color: var(--text-light); font-style: italic;">Loading weather...</div></div>`;
    const styles = `
      .weather-left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
      }
    `;
    this.setContent(html, styles);
  }

  async fetchWeather() {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(window.configManager.get('openWeatherMapLocation'))}`);
      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();
      this.renderCurrent(data.current);
    } catch (error) {
      console.error('Weather error:', error);
      this.showError(error.message);
    }
  }

  renderCurrent(current) {
    const aqi = current.aqi ? this.getAQIColor(current.aqi) : null;
    const pressure = current.pressure || current.pressureMb;
    const pressureTrend = this.getPressureTrend();

    const html = `
      <div class="weather-left">
        <div class="current-temp">${current.temp}°F</div>
        <div class="current-condition">${current.condition}</div>
        <div class="divider"></div>
        <div class="detail-row">
          <span class="label">Humidity:</span>
          <span class="value">${current.humidity}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Wind:</span>
          <span class="value">${current.windSpeed} mph</span>
        </div>
        ${aqi ? `
        <div class="detail-row">
          <span class="label">AQI:</span>
          <span class="value aqi" style="color: ${aqi.color}">●</span>
          <span class="value">${aqi.label}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="label">Pressure:</span>
          <span class="value">${pressure} hPa</span>
        </div>
        <div class="detail-row">
          <span class="label">Trend:</span>
          <span class="value trend">${pressureTrend}</span>
        </div>
        <div class="divider"></div>
        <div class="detail-row">
          <span class="sunrise">🌅 ${this.getSunrise()}</span>
        </div>
        <div class="detail-row">
          <span class="sunset">🌇 ${this.getSunset()}</span>
        </div>
      </div>
    `;

    const styles = `
      .weather-left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
        background: rgba(153, 209, 219, 0.05);
        border-radius: 6px;
      }

      .current-temp {
        font-size: var(--size-large);
        font-weight: bold;
        color: var(--text-primary);
        line-height: var(--line-height-tight);
      }

      .current-condition {
        font-size: var(--size-body);
        color: var(--text-secondary);
        margin-top: 10px;
      }

      .divider {
        width: 100%;
        height: 1px;
        background: var(--frappe-crust);
        margin: 15px 0;
      }

      .detail-row {
        display: flex;
        gap: 15px;
        font-size: var(--size-small);
        margin-bottom: 8px;
      }

      .label {
        color: var(--text-light);
        min-width: 90px;
      }

      .value {
        color: var(--text-secondary);
        font-weight: bold;
      }

      .value.aqi {
        font-size: 24px;
        line-height: 1;
      }

      .sunrise, .sunset {
        font-size: var(--size-small);
        color: var(--text-secondary);
      }

      .trend {
        font-size: 20px;
      }
    `;

    this.setContent(html, styles);
  }

  getAQIColor(aqi) {
    if (aqi <= 50) return { color: 'var(--aqi-good)', label: 'Good' };
    if (aqi <= 100) return { color: 'var(--aqi-moderate)', label: 'Moderate' };
    if (aqi <= 150) return { color: 'var(--aqi-unhealthy-sensitive)', label: 'Unhealthy' };
    if (aqi <= 200) return { color: 'var(--aqi-unhealthy)', label: 'Very Unhealthy' };
    if (aqi <= 300) return { color: 'var(--aqi-very-unhealthy)', label: 'Very Unhealthy' };
    return { color: 'var(--aqi-hazardous)', label: 'Hazardous' };
  }

  getPressureTrend() {
    // This would need to compare current vs previous
    // For now, return steady
    return '➡️ Steady';
  }

  getSunrise() {
    // Would pull from weather API
    return '7:34 AM';
  }

  getSunset() {
    // Would pull from weather API
    return '5:18 PM';
  }
}

class WeatherForecast extends DashboardComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    this.renderInitial();
    this.fetchForecast();
    this.updateInterval = setInterval(() => this.fetchForecast(), 900000); // 15 min
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  renderInitial() {
    const html = `<div class="loading" style="color: var(--text-light); font-style: italic;">Loading forecast...</div>`;
    const styles = `
      .loading {
        padding: 20px;
      }
    `;
    this.setContent(html, styles);
  }

  async fetchForecast() {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(window.configManager.get('openWeatherMapLocation'))}`);
      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();
      this.renderForecast(data.hourly);
    } catch (error) {
      console.error('Forecast error:', error);
      this.showError(error.message);
    }
  }

  renderForecast(hourly) {
    if (!hourly || hourly.length === 0) {
      const html = `<div style="color: var(--text-light); font-style: italic; padding: 10px;">No forecast available</div>`;
      this.setContent(html);
      return;
    }

    const html = `
      <div class="weather-right">
        <div class="forecast-section">
          <table class="forecast-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Temp</th>
                <th></th>
                <th>Rain</th>
                <th>Pressure</th>
              </tr>
            </thead>
            <tbody>
              ${hourly.map(item => this.renderForecastRow(item)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const styles = `
      .weather-right {
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
      }

      .forecast-section {
        background: rgba(153, 209, 219, 0.05);
        border-radius: 6px;
        overflow: hidden;
      }

      .forecast-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--size-tiny);
        font-family: var(--font-family);
      }

      .forecast-table thead th {
        color: var(--text-secondary);
        text-align: left;
        padding: 10px;
        border-bottom: 1px solid var(--frappe-crust);
        font-weight: bold;
      }

      .forecast-table tbody td {
        padding: 10px;
        border-bottom: 1px solid var(--frappe-crust);
        color: var(--text-primary);
      }

      .forecast-table tbody tr:last-child td {
        border-bottom: none;
      }

      .icon {
        font-size: 20px;
      }

      .rain-prob {
        color: var(--accent-blue);
      }
    `;

    this.setContent(html, styles);
  }

  renderForecastRow(item) {
    const time = new Date(item.time).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const icon = this.getWeatherIcon(item.condition);

    return `
      <tr>
        <td>${time}</td>
        <td>${item.temp}°</td>
        <td class="icon">${icon}</td>
        <td class="rain-prob">${item.precipProbability}%</td>
        <td>${item.pressureMb}</td>
      </tr>
    `;
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

customElements.define('weather-current', WeatherCurrent);
customElements.define('weather-forecast', WeatherForecast);

export { WeatherCurrent, WeatherForecast };