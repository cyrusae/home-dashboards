/**
 * 3-Day Weather Forecast Component
 * Shows high/low temps, precipitation, pressure, and conditions for next 3 days
 * Enhanced with network resilience
 */

import { DashboardComponent } from '../../base.js';
import html from './weather-3day.html?raw';
import styles from './weather-3day.css?raw';

class Weather3Day extends DashboardComponent {
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
      this.lastSuccessfulData = data.daily;
      
      this.updateDaily(data.daily);
      
    } catch (error) {
      console.error('Daily forecast error:', error);
      
      // Try cached data
      if (this.lastSuccessfulData) {
        console.log('Using cached 3-day forecast');
        this.updateDaily(this.lastSuccessfulData, true);
      } else {
        this.showError(`3-day forecast unavailable: ${error.message}`);
      }
    }
  }

  updateDaily(daily, isStale = false) {
    console.log('Received daily forecast data:', daily);
    
    const container = this.query('#dailyContainer');
    
    if (!container) {
      console.error('Daily container not found');
      return;
    }
    
    if (!daily || daily.length === 0) {
      container.innerHTML = '<div style="color: var(--text-light); font-style: italic; padding: 10px;">No forecast available</div>';
      return;
    }

    try {
      // Clear container
      container.innerHTML = '';

      // Clone and populate template for each day
      daily.forEach((day, idx) => {
        const card = this.createDayCard(day);
        if (card) {
          container.appendChild(card);
        }
      });
      
      // Show stale warning if applicable
      if (isStale) {
        this.showTransientError('Using cached 3-day forecast (connection issue)');
      }
      
    } catch (error) {
      console.error('Error updating daily forecast:', error);
    }
  }

  createDayCard(day) {
    try {
      console.log('Creating card for day:', day);
      
      const template = this.query('#dayCardTemplate');
      if (!template) {
        console.error('Day card template not found');
        return null;
      }
      
      const card = template.content.cloneNode(true);

      // Format date
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        timeZone: 'UTC'
      });

      console.log('Formatted as:', dayName);

      // Populate data (null-safe)
      const dateEl = card.querySelector('[data-day-date]');
      const highEl = card.querySelector('[data-high]');
      const lowEl = card.querySelector('[data-low]');
      const precipEl = card.querySelector('[data-precip]');
      const pressureEl = card.querySelector('[data-pressure]');
      const conditionEl = card.querySelector('[data-condition]');
      
      if (dateEl) dateEl.textContent = dayName;
      if (highEl) highEl.textContent = `${day.high}°`;
      if (lowEl) lowEl.textContent = `${day.low}°`;
      if (precipEl) precipEl.textContent = `${day.precipMax}%`;
      if (pressureEl) pressureEl.textContent = `${day.pressureAvg} hPa`;
      if (conditionEl) conditionEl.textContent = day.condition;

      return card;
    } catch (error) {
      console.error('Error creating day card:', error);
      return null;
    }
  }
}

customElements.define('weather-3day', Weather3Day);

export { Weather3Day };