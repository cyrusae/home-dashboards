/**
 * 3-Day Weather Forecast Component
 * Shows high/low temps, precipitation, pressure, and conditions for next 3 days
 */

import { DashboardComponent } from '../../base.js';
import html from './weather-3day.html?raw';
import styles from './weather-3day.css?raw';

class Weather3Day extends DashboardComponent {
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
      this.updateDaily(data.daily);
    } catch (error) {
      console.error('Daily forecast error:', error);
      this.showError(error.message);
    }
  }

  updateDaily(daily) {
   
  console.log('Received daily forecast data:', daily);
  
  const container = this.query('#dailyContainer');
  
  if (!daily || daily.length === 0) {
    container.innerHTML = '<div style="color: var(--text-light); font-style: italic; padding: 10px;">No forecast available</div>';
    return;
  }

    // Clear container
    container.innerHTML = '';

    // Clone and populate template for each day
    daily.forEach((day, idx) => {
      const card = this.createDayCard(day);
      container.appendChild(card);
    });
  }

  createDayCard(day) {
//  console.log('Creating card for day:', day);
  
  const template = this.query('#dayCardTemplate');
  const card = template.content.cloneNode(true);

  // Format date
  const date = new Date(day.date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'});

//  console.log('Formatted as:', dayName);

    // Populate data
    card.querySelector('[data-day-date]').textContent = dayName;
    card.querySelector('[data-high]').textContent = `${day.high}°`;
    card.querySelector('[data-low]').textContent = `${day.low}°`;
    card.querySelector('[data-precip]').textContent = `${day.precipMax}%`;
    card.querySelector('[data-pressure]').textContent = `${day.pressureAvg} hPa`;
    card.querySelector('[data-condition]').textContent = day.condition;

    return card;
  }
}

customElements.define('weather-3day', Weather3Day);

export { Weather3Day };