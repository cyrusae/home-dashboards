/**
 * Time Display Component
 * Shows PST time (large, primary) and EST time (small, reference)
 */

import { DashboardComponent } from '../components/base.js';

class TimeDisplay extends DashboardComponent {
  constructor() {
    super();
    this.updateInterval = null;
  }

  connectedCallback() {
    this.render();
    this.updateTime();
    this.updateInterval = setInterval(() => this.updateTime(), 1000);
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  render() {
    const html = `
      <div class="time-container">
        <div class="row-1-left">
          <div class="date-box">
            <div class="date-display" id="datePST">Loading...</div>
          </div>
          <div class="est-box">
            <div class="time-est-display">EST: <span id="timeEST">--:--</span></div>
          </div>
        </div>
        <div class="row-1-right">
          <div class="time-pst" id="timePST">--:--</div>
        </div>
      </div>
    `;

    const styles = `
      .time-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        grid-row: 1;
        height: auto;
      }

      .row-1-left {
        display: grid;
        grid-template-rows: 1fr 1fr;
        gap: 30px;
      }

      .date-box {
        border: 3px solid var(--accent-maroon);
        background: rgba(230, 69, 83, 0.05);
        padding: 30px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .est-box {
        border: 3px solid var(--accent-flamingo);
        background: rgba(221, 120, 120, 0.05);
        padding: 30px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .row-1-right {
        border: none;
        background: transparent;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .date-display {
        font-size: clamp(40px, 6vw, 60px);
        font-weight: bold;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 2px;
        text-align: center;
        font-family: var(--font-family);
      }

      .time-est-display {
        font-size: clamp(32px, 5vw, 48px);
        font-weight: bold;
        color: var(--text-primary);
        text-align: center;
        font-family: var(--font-family);
      }

      .time-pst {
        font-size: var(--size-huge);
        font-weight: bold;
        font-family: var(--font-family);
        color: var(--pst-accent);
        line-height: var(--line-height-tight);
        text-shadow: 2px 2px 0px rgba(255, 255, 255, 0.3);
      }
    `;

    this.setContent(html, styles);
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