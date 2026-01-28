/**
 * Dashboard Screensaver Integration
 * 
 * Complete example of using the StarfieldScreensaver with idle detection
 * Add this to your dashboard page or adapt as needed
 */

import { Dashboard } from "../../dashboards/night/night.js";
import { StarfieldScreensaver } from "./screensaver.js";

class DashboardScreensaver {
  constructor(options = {}) {
    this.idleThreshold = options.idleThreshold || 3 * 60 * 60 * 1000; // 3 hours
    this.lastActivityTime = Date.now();
    this.idleCheckInterval = null;
    this.screensaver = null;
    this.isScreensaverActive = false;

    // Initialize screensaver
    this.screensaver = new StarfieldScreensaver({
      duration: 30000, // 30 seconds display time
      fadeInDuration: 1500, // 1.5 second fade in
      fadeOutDuration: 1500, // 1.5 second fade out
      particleCount: 800,
      scanLineOpacity: 0.03,
      scanLineSpacing: 3,
    });

    this.init();
  }

  init() {
    // Listen for user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, () => this.recordActivity(), {
        passive: true,
      });
    });

    // Start idle check loop
    this.startIdleCheck();
  }

  recordActivity() {
    this.lastActivityTime = Date.now();
    // If screensaver is active, reset it
    if (this.isScreensaverActive) {
      this.resetIdleCheck();
    }
  }

  startIdleCheck() {
    // Check every minute if we've hit the idle threshold
    this.idleCheckInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivityTime;

      if (
        timeSinceActivity > this.idleThreshold &&
        !this.isScreensaverActive
      ) {
        this.triggerScreensaver();
      }
    }, 60000); // Check every 60 seconds
  }

  async triggerScreensaver() {
    this.isScreensaverActive = true;
    console.log('Screensaver triggered');

    try {
      await this.screensaver.trigger();
    } catch (e) {
      console.error('Screensaver error:', e);
    } finally {
      this.isScreensaverActive = false;
      // Reset the idle timer for the next cycle
      this.lastActivityTime = Date.now();
    }
  }

  resetIdleCheck() {
    this.lastActivityTime = Date.now();
  }

  destroy() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
    if (this.screensaver) {
      this.screensaver.destroy();
    }
  }
}

// Initialize when DOM is ready
let dashboardScreensaver;

//if (document.readyState === 'loading') {
//  document.addEventListener('DOMContentLoaded', () => {
//    dashboardScreensaver = new DashboardScreensaver({
//      idleThreshold: 3 * 60 * 60 * 1000, // 3 hours
//    });
//  });
//} else {
  // DOM already loaded
//  dashboardScreensaver = new DashboardScreensaver({
//    idleThreshold: 3 * 60 * 60 * 1000, // 3 hours
//  });
//}

// For testing: uncomment to trigger immediately
// setTimeout(() => dashboardScreensaver.triggerScreensaver(), 2000);

export function initScreensaver(options = {}) {
 return new DashboardScreensaver(options);
}

export { DashboardScreensaver };