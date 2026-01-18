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

        <!-- Row 2: Weather (66%) | Calendar (33%) -->
        <div class="row-2">
          <div class="weather-container">
            <div class="section-title" style="color: var(--accent-sky);">🌤️ Weather</div>
            <weather-current></weather-current>
            <weather-forecast></weather-forecast>
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
            <div id="infrastructure-content">Loading status...</div>
          </div>
        </div>
      </div>
    `;

    const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .dashboard {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: minmax(300px, auto) 1fr 1fr;
        gap: 30px;
        height: 100%;
        overflow: hidden;
      }

      .row-1 {
        grid-column: 1;
        grid-row: 1;
        height: auto;
        min-height: 300px;
      }

      .row-2 {
        grid-column: 1;
        grid-row: 2;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 30px;
        overflow: hidden;
        min-height: 0;
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
        font-size: var(--size-heading);
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-family: var(--font-family);
      }

      .weather-container,
      .calendar-container,
      .tasks-container,
      .infrastructure-container {
        border: 3px solid var(--accent-sky);
        background: rgba(4, 165, 229, 0.05);
        padding: 30px;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .calendar-container {
        border-color: var(--accent-lavender);
        background: rgba(114, 135, 253, 0.05);
      }

      .tasks-container {
        border-color: var(--accent-teal);
        background: rgba(23, 146, 153, 0.05);
      }

      .infrastructure-container {
        border-color: var(--accent-lavender);
        background: rgba(114, 135, 253, 0.05);
      }

      weather-current {
        margin-bottom: 20px;
      }

      weather-forecast {
        flex: 1;
        overflow-y: auto;
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
        background: rgba(0, 0, 0, 0.05);
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
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
    this.loadInfrastructure();
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

  async loadInfrastructure() {
    try {
      const response = await fetch('/api/prometheus/query?query=up');
      if (!response.ok) throw new Error('Failed to load infrastructure');

      const data = await response.json();
      const container = this.query('#infrastructure-content');

      container.innerHTML = `
        <div class="infrastructure-status">
          <div class="node-card">
            <div class="node-name">Babbage</div>
            <div class="node-status">🟢 Online</div>
            <div class="node-detail">CPU: 45%</div>
            <div class="node-detail">Memory: 62%</div>
            <div class="node-detail">Pods: 12</div>
          </div>
          <div class="node-card">
            <div class="node-name">Epimetheus</div>
            <div class="node-status">🟢 Online</div>
            <div class="node-detail">CPU: 32%</div>
            <div class="node-detail">Memory: 48%</div>
            <div class="node-detail">Pods: 8</div>
          </div>
          <div class="node-card">
            <div class="node-name">Kabandha</div>
            <div class="node-status">🟢 Online</div>
            <div class="node-detail">CPU: 28%</div>
            <div class="node-detail">Memory: 52%</div>
            <div class="node-detail">Pods: 9</div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Infrastructure error:', error);
      this.query('#infrastructure-content').innerHTML = `<div style="color: var(--accent-red); font-size: var(--size-small);">Error: ${error.message}</div>`;
    }
  }
}

customElements.define('morning-dashboard', Dashboard);

export { Dashboard };