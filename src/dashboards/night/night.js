/**
 * Night Dashboard Layout
 * Minimal black screen with rotated time and insomnia checklist
 */

import { DashboardComponent } from '../../components/base.js';
import html from './night.html?raw';
import styles from './night.css?raw';

class Dashboard extends DashboardComponent {
  constructor() {
    super();
    this.updateInterval = null;
  }

  connectedCallback() {
    this.setContent(html, styles);
    this.updateTime();
    this.updateInterval = setInterval(() => this.updateTime(), 1000);
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  updateTime() {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const time = timeFormatter.format(now);
    const timeElement = this.query('#nightTime');
    if (timeElement) {
      timeElement.textContent = time;
    }
  }
}

customElements.define('night-dashboard', Dashboard);

export { Dashboard };