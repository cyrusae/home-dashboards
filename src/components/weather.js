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
    const pressureTrend = this.getPressureTrend(current.pressure);
    const sunrise = this.formatSunTime(current.sunrise);
    const sunset = this.formatSunTime(current.sunset);

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
          <span class="value trend" style="color: ${this.getPressureTrendColor(pressureTrend)}">${pressureTrend}</span>
        </div>
        <div class="divider"></div>
        <div class="detail-row">
          <span class="sunrise">🌅 ${sunrise}  • • •  </span>
          <span class="sunset">🌇 ${sunset}</span>
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
        font-size: var(--size-body);
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
        font-size: var(--size-small);
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
       timeZone: 'America/Los_Angeles'  // Match your PST timezone
     });
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