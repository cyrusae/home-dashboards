/**
 * Dashboard Screensaver Integration
 * 
 * Integrates StarfieldScreensaver with idle detection
 * - Triggers after 3 hours of inactivity
 * - Displays for 30 seconds to prevent burn-in
 * - Only runs when NOT on night dashboard (to avoid interrupting sleep)
 */

import { StarfieldScreensaver } from './screensaver.js';

class DashboardScreensaver {
  constructor(options = {}) {
    this.idleThreshold = options.idleThreshold || 3 * 60 * 60 * 1000; // 3 hours default
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

  /**
   * Check if we're currently on the night dashboard
   * @returns {boolean} True if night dashboard is active
   */
  isNightDashboard() {
    return !!document.querySelector('night-dashboard');
  }

  startIdleCheck() {
    // Check every minute if we've hit the idle threshold
    this.idleCheckInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivityTime;

      // Only trigger if:
      // 1. We've been idle long enough
      // 2. Screensaver isn't already running
      // 3. We're NOT on the night dashboard
      if (
        timeSinceActivity > this.idleThreshold &&
        !this.isScreensaverActive &&
        !this.isNightDashboard()
      ) {
        this.triggerScreensaver();
      }
    }, 60000); // Check every 60 seconds
  }

  async triggerScreensaver() {
    this.isScreensaverActive = true;
    console.log('🌟 Screensaver triggered (burn-in prevention)');

    try {
      await this.screensaver.trigger();
    } catch (e) {
      console.error('Screensaver error:', e);
    } finally {
      this.isScreensaverActive = false;
      // Reset the idle timer for the next cycle
      this.lastActivityTime = Date.now();
      console.log('✓ Screensaver completed');
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

/**
 * Initialize screensaver with options
 * @param {Object} options - Configuration options
 * @param {number} options.idleThreshold - Time in ms before triggering (default: 3 hours)
 * @returns {DashboardScreensaver} Screensaver instance
 */
export function initScreensaver(options = {}) {
  return new DashboardScreensaver(options);
}

export { DashboardScreensaver };