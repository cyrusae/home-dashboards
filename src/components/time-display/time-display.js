/**
 * Time Display Component
 * Shows PST time (large, primary) and EST time (small, reference)
 */

import { DashboardComponent } from '../base.js';
import html from './time-display.html?raw';
import styles from './time-display.css?raw';

class TimeDisplay extends DashboardComponent {
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

    // PST Time
    const pstFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const pstTime = pstFormatter.format(now);
    const pstElement = this.query('#timePST');
    if (pstElement) pstElement.textContent = pstTime;

    // PST Date
    const pstDateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
      month: 'short',
      day: '2-digit',
    });
    const pstDate = pstDateFormatter.format(now);
    const dateElement = this.query('#datePST');
    if (dateElement) dateElement.textContent = pstDate;

    // EST Time
    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const estTime = estFormatter.format(now);
    const estElement = this.query('#timeEST');
    if (estElement) estElement.textContent = estTime;
  }
}

customElements.define('time-display', TimeDisplay);

export { TimeDisplay };