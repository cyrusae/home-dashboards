/**
 * 3-Day Weather Forecast Cards
 * Shows high/low temps, precipitation, pressure, AQI for next 3 days
 */

import { DashboardComponent } from '../components/base.js';

class Weather3Day extends DashboardComponent {
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
    const html = `<div style="color: var(--text-light); font-style: italic; padding: 10px;">Loading 3-day forecast...</div>`;
    const styles = '';
    this.setContent(html, styles);
  }

  async fetchForecast() {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(window.configManager.get('openWeatherMapLocation'))}`);
      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();
      this.renderDaily(data.daily);
    } catch (error) {
      console.error('Daily forecast error:', error);
      this.showError(error.message);
    }
  }

  renderDaily(daily) {
    if (!daily || daily.length === 0) {
      this.setContent(`<div style="color: var(--text-light); font-style: italic; padding: 10px;">No forecast available</div>`);
      return;
    }

    const html = `
      <div class="daily-container">
        ${daily.map((day, idx) => this.renderDayCard(day, idx)).join('')}
      </div>
    `;

    const styles = `
      .daily-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        height: 100%;
      }

      .day-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        background: rgba(153, 209, 219, 0.05);
        border: 1px solid var(--frappe-crust);
        border-radius: 4px;
        font-size: var(--size-body);
      }

      .day-date {
        font-weight: bold;
        color: var(--text-secondary);
        text-align: center;
        border-bottom: 1px solid var(--frappe-crust);
        padding-bottom: 8px;
        margin-bottom: 5px;
      }

      .day-details {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .day-detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .detail-label {
        color: var(--text-light);
        font-size: var(--size-small);
        flex: 0 0 auto;
      }

      .detail-value {
        color: var(--text-primary);
        font-weight: bold;
        font-size: var(--size-small);
        text-align: right;
      }

      .temps {
        color: var(--accent-red);
      }

      .temps.low {
        color: var(--accent-blue);
      }

      .precip {
        color: var(--accent-sky);
      }

      .pressure {
        color: var(--accent-teal);
      }
    `;

    this.setContent(html, styles);
  }

  renderDayCard(day, idx) {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return `
      <div class="day-card">
        <div class="day-date">${dayName}</div>
        <div class="day-details">
          <div class="day-detail-item">
            <span class="detail-label">High/Low</span>
            <span class="detail-value"><span class="temps">${day.high}°</span> / <span class="temps low">${day.low}°</span></span>
          </div>
          <div class="day-detail-item">
            <span class="detail-label">Precip</span>
            <span class="detail-value precip">${day.precipMax}%</span>
          </div>
          <div class="day-detail-item">
            <span class="detail-label">Pressure</span>
            <span class="detail-value pressure">${day.pressureAvg} hPa</span>
          </div>
          <div class="day-detail-item">
            <span class="detail-label">Condition</span>
            <span class="detail-value">${day.condition}</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('weather-3day', Weather3Day);

export { Weather3Day };