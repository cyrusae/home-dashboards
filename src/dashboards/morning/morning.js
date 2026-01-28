/**
 * Morning Dashboard Layout
 * Orchestrates the morning dashboard with time display, weather sections,
 * calendar events, tasks, and infrastructure status
 */

import { DashboardComponent } from '../../components/base.js';
import { TimeDisplay } from '../../components/time-display/time-display.js';
import { WeatherCurrent } from '../../components/weather/weather-current/weather-current.js';
import { WeatherForecast } from '../../components/weather/weather-forecast/weather-forecast.js';
import { Weather3Day } from '../../components/weather/weather-3day/weather-3day.js';
import { InfrastructureStatus } from '../../components/infrastructure-status/infrastructure-status.js';
import html from './morning.html?raw';
import styles from './morning.css?raw';

class Dashboard extends DashboardComponent {
  constructor() {
    super();
  }

  connectedCallback() {
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

      // Create events list container
      const eventsList = document.createElement('div');
      eventsList.className = 'events-list';

      // Clone and populate template for each event
      events.forEach(event => {
        const eventElement = this.createEventElement(event);
        eventsList.appendChild(eventElement);
      });

      container.innerHTML = '';
      container.appendChild(eventsList);
    } catch (error) {
      console.error('Calendar error:', error);
      this.query('#calendar-content').innerHTML = `<div style="color: var(--accent-red); font-size: var(--size-small);">Error: ${error.message}</div>`;
    }
  }

  createEventElement(event) {
    const template = this.query('#eventTemplate');
    const element = template.content.cloneNode(true);

    // Format time
    const startTime = new Date(event.start).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Populate data
    element.querySelector('[data-event-time]').textContent = startTime;
    element.querySelector('[data-event-title]').textContent = event.summary;
    
    // Handle optional calendar name
    const calendarElement = element.querySelector('[data-event-calendar]');
    if (event.calendar) {
      calendarElement.textContent = event.calendar;
    } else {
      calendarElement.remove();
    }

    return element;
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
    
    // Create tasks list container
    const tasksList = document.createElement('div');
    tasksList.className = 'task-list';

    // Clone and populate template for each task
    tasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      tasksList.appendChild(taskElement);
    });

    container.innerHTML = '';
    container.appendChild(tasksList);
  }

  createTaskElement(taskText) {
    const template = this.query('#taskTemplate');
    const element = template.content.cloneNode(true);

    element.querySelector('[data-task-text]').textContent = taskText;

    return element;
  }
}

customElements.define('morning-dashboard', Dashboard);

export { Dashboard };