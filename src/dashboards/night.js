/**
 * Night Dashboard Layout
 * Minimal black screen with:
 *   - Large rotated time (90° clockwise) on left vertical edge
 *   - Simple insomnia checklist in dark red
 */

import { DashboardComponent } from '../components/base.js';

class Dashboard extends DashboardComponent {
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
      <div class="night-container">
        <!-- Rotated time on left edge -->
        <div class="time-vertical">
          <div class="time-display" id="nightTime">--:--</div>
        </div>

        <!-- Insomnia checklist -->
        <div class="checklist-container">
          <div class="checklist-title">If you're awake:</div>
          <div class="checklist">
            <div class="checklist-item">↦ Have you taken your night meds?</div>
            <div class="checklist-item">↦ Did you eat something in the last 4 hours?</div>
            <div class="checklist-item">↦ When did you last drink water?</div>
            <div class="checklist-item">↦ Do you need to go to the bathroom?</div>
            <div class="checklist-item">↦ Does it hurt to be awake? Maxalt</div>
            <div class="checklist-item">↦ Are you scared to be awake? Hydroxyzine</div>
            <div class="checklist-item">↦ Remember: you are loved by nerds! They want you to get rest!</div>
          </div>
        </div>
      </div>
    `;

    const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: #000000;
      }

      .night-container {
        display: flex;
        width: 100%;
        height: 100vh;
        background: #000000;
        position: relative;
        overflow: hidden;
      }

      /* Rotated time on left vertical edge */
      .time-vertical {
        position: absolute;
        left: 0;
        top: 0;
        height: 100vh;
        width: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .time-display {
        font-size: clamp(120px, 15vw, 180px);
        font-weight: bold;
        font-family: var(--font-family);
        color: #3d0000;
        line-height: 1;
        letter-spacing: 0.05em;
        transform: rotate(90deg);
        transform-origin: center center;
        white-space: nowrap;
      }

      /* Checklist in center-right */
      .checklist-container {
        margin-left: 220px;
        padding: 60px 80px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 40px;
        flex: 1;
      }

      .checklist-title {
        font-size: clamp(28px, 3vw, 36px);
        font-weight: bold;
        color: #4a0000;
        font-family: var(--font-family);
        margin-bottom: 20px;
        letter-spacing: 0.02em;
      }

      .checklist {
        display: flex;
        flex-direction: column;
        gap: 25px;
      }

      .checklist-item {
        font-size: clamp(20px, 2vw, 28px);
        color: #3d0000;
        font-family: var(--font-family);
        line-height: 1.6;
        letter-spacing: 0.01em;
      }

      /* Responsive adjustments */
      @media (max-width: 1200px) {
        .time-display {
          font-size: clamp(80px, 12vw, 120px);
        }

        .time-vertical {
          width: 150px;
        }

        .checklist-container {
          margin-left: 170px;
          padding: 40px 60px;
        }

        .checklist-title {
          font-size: clamp(22px, 2.5vw, 30px);
        }

        .checklist-item {
          font-size: clamp(16px, 1.8vw, 24px);
        }
      }

      @media (max-width: 768px) {
        .night-container {
          flex-direction: column;
        }

        .time-vertical {
          position: relative;
          width: 100%;
          height: 120px;
        }

        .time-display {
          transform: rotate(0deg);
          font-size: clamp(60px, 10vw, 90px);
        }

        .checklist-container {
          margin-left: 0;
          padding: 30px 40px;
        }
      }
    `;

    this.setContent(html, styles);
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