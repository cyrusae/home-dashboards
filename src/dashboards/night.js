/**
 * Night Dashboard Layout
 * Minimal black screen with:
 *   - Large rotated time (90° counterclockwise) on left vertical edge
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
        <!-- Rotated time on left -->
        <div class="time-vertical">
          <div class="time-display" id="nightTime">--:--</div>
        </div>

        <!-- Insomnia checklist on right -->
        <div class="checklist-container">
          <div class="checklist-title">If you're awake:</div>
          <div class="checklist">
            <div class="checklist-item">Can you feel your BLADDER? Go to the BATHROOM!</div>
            <div class="checklist-item">Are you THIRSTY? There's WATER by the bed</div>
            <div class="checklist-item">Are you HUNGRY? Find something to EAT</div>
            <div class="checklist-item">Does it HURT to be awake? Consider MAXALT</div>
            <div class="checklist-item">Are you AFRAID to sleep? Consider HYDROXYZINE</div>
            <div class="checklist-item">Is this screen too BRIGHT? Try a BLINDFOLD</div>
          </div>
          <div class="checklist-title">Remember: You are loved by nerds! They want you to get rest! <3</div>
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
        display: grid;
        grid-template-columns: minmax(15vw, 25vw) 1fr;
        gap: 5vw;
        width: 100vw;
        height: 100vh;
        background: #000000;
        padding: 5vh 5vw;
        box-sizing: border-box;
      }

      /* Rotated time column */
      .time-vertical {
        display: flex;
        align-items: center;
        justify-content: center;
        grid-column: 1;
      }

      .time-display {
        font-size: var(--size-massive);
        font-weight: bold;
        font-family: var(--font-family);
        color: #3d0000;
        line-height: 1;
        letter-spacing: 0.05em;
        transform: rotate(270deg);
        transform-origin: center center;
        white-space: nowrap;
      }

      /* Checklist column */
      .checklist-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 3vh;
        grid-column: 2;
        padding: 2vh 2vw;
      }

      .checklist-title {
        font-size: clamp(2rem, 3vw, 3rem);
        font-weight: bold;
        color: #4a0000;
        font-family: var(--font-family);
        margin-bottom: 2vh;
        letter-spacing: 0.02em;
      }

      .checklist {
        display: flex;
        flex-direction: column;
        gap: 2vh;
      }

      .checklist-item {
        font-size: clamp(2rem, 2vw, 3rem);
        color: #3d0000;
        font-family: var(--font-family);
        line-height: 1.6;
        letter-spacing: 0.01em;
      }

      /* Responsive adjustments */
      @media (max-width: 1200px) {
        .night-container {
          grid-template-columns: minmax(12vw, 20vw) 1fr;
          gap: 4vw;
          padding: 3vh 3vw;
        }

        .time-display {
          font-size: clamp(6rem, 12vw, 15rem);
        }

        .checklist-title {
          font-size: clamp(1.5rem, 2.5vw, 2rem);
        }

        .checklist-item {
          font-size: clamp(1rem, 1.8vw, 1.75rem);
        }
      }

      @media (max-width: 768px) {
        .night-container {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
          gap: 3vh;
          padding: 2vh 4vw;
        }

        .time-vertical {
          grid-column: 1;
          grid-row: 1;
          height: auto;
        }

        .time-display {
          transform: rotate(0deg);
          font-size: clamp(4rem, 10vw, 6rem);
        }

        .checklist-container {
          grid-column: 1;
          grid-row: 2;
          padding: 1vh 2vw;
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