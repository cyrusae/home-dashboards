/**
 * Morning Dashboard Layout
 * 3-row grid:
 *   Row 1: 50/50 - Date/EST (left) | PST Time (right)
 *   Row 2: 66/33 - Weather (left) | Calendar (right)
 *   Row 3: 33/66 - Tasks (left) | Infrastructure (right)
 */

import { DashboardComponent } from '../components/base.js';
import { TimeDisplay } from '../components/time-display.js';
import { WeatherCurrent, WeatherForecast } from '../components/weather.js';
import { Weather3Day } from '../components/weather-3day.js';
import { InfrastructureStatus } from '../components/infrastructure.js';

class Dashboard extends DashboardComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const html = `
      <div class="dashboard">
        <!-- Row 1: Date/EST (50%) | PST Time (50%) -->
        <div class="row-1">
          <time-display></time-display>
        </div>

        <!-- Row 2: Weather (current full row | today forecast + 3day stacked) -->
        <div class="row-2">
          <div class="weather-current-container">
            <div class="section-title" style="color: var(--accent-sky);">🌤️ Now</div>
            <weather-current></weather-current>
          </div>
          <div class="weather-details-column">
            <div class="weather-forecast-container">
              <div class="section-title" style="color: var(--accent-sky);">📊 Today</div>
              <weather-forecast></weather-forecast>
            </div>
            <div class="weather-3day-container">
              <div class="section-title" style="color: var(--accent-sky);">📅 Next 3 Days</div>
              <weather-3day></weather-3day>
            </div>
          </div>
          <div class="calendar-container">
            <div class="section-title" style="color: var(--accent-lavender);">📅 Today's Events</div>
            <div id="calendar-content">Loading events...</div>
          </div>
        </div>

        <!-- Row 3: Tasks (33%) | Infrastructure (66%) -->
        <div class="row-3">
          <div class="tasks-container">
            <div class="section-title" style="color: var(--accent-teal);">✓ Morning Routine</div>
            <div id="tasks-content">Loading...</div>
          </div>
          <div class="infrastructure-container">
            <div class="section-title" style="color: var(--accent-lavender);">🖥️ Infrastructure</div>
            <infrastructure-status></infrastructure-status>
          </div>
        </div>
      </div>
    `;

    const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        flex: 1;
      }

      .dashboard {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr 1fr;
        gap: 30px;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .row-1 {
        grid-column: 1;
        grid-row: 1;
        min-height: 300px;
      }

      .row-2 {
        grid-column: 1;
        grid-row: 2;
        display: grid;
        grid-template-columns: 1fr 2fr 2fr;
        gap: 30px;
        overflow: hidden;
        min-height: 0;
      }

      .weather-current-container {
        border: 3px solid var(--accent-sky);
        background: rgba(153, 209, 219, 0.1);
        padding: 30px;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .weather-details-column {
        display: grid;
        grid-template-rows: 1fr 1fr;
        gap: 30px;
        min-height: 0;
      }

      .weather-forecast-container,
      .weather-3day-container {
        border: 3px solid var(--accent-sky);
        background: rgba(153, 209, 219, 0.1);
        padding: 30px;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .weather-forecast-container > .section-title,
      .weather-3day-container > .section-title {
        margin-bottom: 15px;
      }

      weather-current {
        flex: 1;
        overflow-y: auto;
        padding-left: 15px;
      }

      weather-forecast {
        flex: 1;
        overflow-y: auto;
      }

      weather-3day {
        flex: 1;
        overflow-y: auto;
      }

      .row-3 {
        grid-column: 1;
        grid-row: 3;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 30px;
        overflow: hidden;
        min-height: 0;
      }

      .section-title {
        font-weight: bold;
        font-size: var(--size-small);
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-family: var(--font-family);
      }

      .calendar-container,
      .tasks-container,
      .infrastructure-container {
        border: 3px solid var(--accent-sky);
        background: rgba(153, 209, 219, 0.1);
        padding: 30px;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .calendar-container {
        border-color: var(--accent-lavender);
        background: rgba(186, 187, 241, 0.1);
      }

      .tasks-container {
        border-color: var(--accent-teal);
        background: rgba(129, 200, 190, 0.1);
      }

      .infrastructure-container {
        border-color: var(--accent-lavender);
        background: rgba(186, 187, 241, 0.1);
      }

      #calendar-content,
      #tasks-content,
      #infrastructure-content {
        flex: 1;
        overflow-y: auto;
      }

      /* Scrollbar styling */
      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }

      @media (max-width: 1200px) {
        .row-2 {
          grid-template-columns: 1fr;
        }

        .row-3 {
          grid-template-columns: 1fr;
        }

        .dashboard {
          grid-template-rows: auto auto auto auto auto;
        }

        .row-2 {
          grid-row: 2;
        }

        .row-3 {
          grid-row: 3;
        }
      }
    `;

    this.setContent(html, styles);
    
    // Load data after component is mounted
    this.loadCalendarEvents();
    this.loadTasks();
  }

  async loadCalendarEvents() {
    try {
      const response = await fetch('/api/calendar/events?date=today');
      if (!response.ok) throw new Error('Failed to load calendar');

      const events = await response.json();
      const container = this.query('#calendar-content');

      if (!events || events.length === 0) {
        container.innerHTML = '<div style="color: var(--text-light); font-style: italic; padding: 16px;">No events today</div>';
        return;
      }

      let html = '<div class="events-list">';
      for (const event of events) {
        const startTime = new Date(event.start).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        html += `
          <div class="event-item">
            <div class="event-time">${startTime}</div>
            <div class="event-title">${this.escapeHTML(event.summary)}</div>
            ${event.calendar ? `<div class="event-calendar">${this.escapeHTML(event.calendar)}</div>` : ''}
          </div>
        `;
      }
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Calendar error:', error);
      this.query('#calendar-content').innerHTML = `<div style="color: var(--accent-red); font-size: var(--size-small);">Error: ${error.message}</div>`;
    }
  }

  loadTasks() {
    const tasks = [
      'Wakix + Focalin, tell Tea',
      'Take Latuda, eat, update Tea',
      'Do TENS session & PT exercises',
      'Update planner/journal',
      'Take post-food meds & modafinil',
      'Wash face & brush teeth',
      'Go to the gym'
    ];

    const container = this.query('#tasks-content');
    let html = '<div class="task-list">';
    for (const task of tasks) {
      html += `
        <div class="task-item">
          <span class="task-icon">↦</span>
          <span>${this.escapeHTML(task)}</span>
        </div>
      `;
    }
    html += '</div>';
    container.innerHTML = html;
  }
}

customElements.define('morning-dashboard', Dashboard);

export { Dashboard };