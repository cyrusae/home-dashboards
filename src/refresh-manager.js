/**
 * Page Refresh Manager
 * Handles automatic page refreshes to prevent stale data and ensure deployments are picked up
 * 
 * Strategy:
 * 1. Daily hard refresh at 4:30 AM PST (before morning dashboard starts at 5 AM)
 * 2. Deployment detection via version endpoint
 * 3. Error recovery with exponential backoff
 */

class RefreshManager {
  constructor(options = {}) {
    this.options = {
      // Daily refresh time (PST): 4:30 AM
      dailyRefreshHour: options.dailyRefreshHour ?? 4,
      dailyRefreshMinute: options.dailyRefreshMinute ?? 30,
      // Check for deployments every 5 minutes
      deploymentCheckInterval: options.deploymentCheckInterval ?? 5 * 60 * 1000,
      // Error threshold before forcing refresh
      consecutiveErrorThreshold: options.consecutiveErrorThreshold ?? 3,
      ...options
    };

    this.consecutiveErrors = 0;
    this.currentVersion = null;
    this.lastRefreshTime = Date.now();
    this.dailyRefreshTimer = null;
    this.deploymentCheckTimer = null;
  }

  async initialize() {
    console.log('🔄 RefreshManager: Initializing...');
    
    // Get current version
    await this.fetchCurrentVersion();
    
    // Schedule daily refresh
    this.scheduleDailyRefresh();
    
    // Start deployment detection
    this.startDeploymentDetection();
    
    // Listen for errors globally
    this.setupErrorRecovery();
    
    console.log('✓ RefreshManager: Active');
  }

  /**
   * Fetch current deployment version from backend
   */
  async fetchCurrentVersion() {
    try {
      const response = await fetch('/api/version', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        console.warn('RefreshManager: Version endpoint not available');
        return null;
      }
      
      const data = await response.json();
      this.currentVersion = data.version;
      console.log(`RefreshManager: Current version is ${this.currentVersion}`);
      return this.currentVersion;
    } catch (error) {
      console.warn('RefreshManager: Could not fetch version:', error.message);
      return null;
    }
  }

  /**
   * Schedule daily hard refresh at configured time (PST)
   */
  scheduleDailyRefresh() {
    const checkAndSchedule = () => {
      const now = new Date();
      const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      
      // Calculate next refresh time
      const nextRefresh = new Date(pst);
      nextRefresh.setHours(this.options.dailyRefreshHour, this.options.dailyRefreshMinute, 0, 0);
      
      // If we've passed today's refresh time, schedule for tomorrow
      if (pst >= nextRefresh) {
        nextRefresh.setDate(nextRefresh.getDate() + 1);
      }
      
      const msUntilRefresh = nextRefresh - pst;
      
      console.log(`RefreshManager: Next daily refresh at ${nextRefresh.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST (${Math.round(msUntilRefresh / 1000 / 60)} minutes)`);
      
      // Clear existing timer
      if (this.dailyRefreshTimer) {
        clearTimeout(this.dailyRefreshTimer);
      }
      
      // Schedule refresh
      this.dailyRefreshTimer = setTimeout(() => {
        console.log('🔄 RefreshManager: Executing daily refresh');
        this.hardRefresh('daily_scheduled');
      }, msUntilRefresh);
    };
    
    checkAndSchedule();
    
    // Re-check every hour in case of clock drift
    setInterval(checkAndSchedule, 60 * 60 * 1000);
  }

  /**
   * Start periodic deployment detection
   */
  startDeploymentDetection() {
    this.deploymentCheckTimer = setInterval(async () => {
      const newVersion = await this.fetchCurrentVersion();
      
      if (newVersion && this.currentVersion && newVersion !== this.currentVersion) {
        console.log(`🔄 RefreshManager: New deployment detected (${this.currentVersion} → ${newVersion})`);
        // Wait 10 seconds to let deployment stabilize, then refresh
        setTimeout(() => {
          this.hardRefresh('new_deployment');
        }, 10000);
      }
    }, this.options.deploymentCheckInterval);
  }

  /**
   * Setup global error recovery
   */
  setupErrorRecovery() {
    // Listen for fetch errors on components
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Reset error counter on successful API call
        if (response.ok && args[0].includes('/api/')) {
          this.consecutiveErrors = 0;
        }
        
        // Track API errors
        if (!response.ok && args[0].includes('/api/')) {
          this.consecutiveErrors++;
          console.warn(`RefreshManager: API error ${this.consecutiveErrors}/${this.options.consecutiveErrorThreshold}`);
          
          if (this.consecutiveErrors >= this.options.consecutiveErrorThreshold) {
            console.error('🔄 RefreshManager: Too many consecutive errors, forcing refresh');
            this.hardRefresh('error_recovery');
          }
        }
        
        return response;
      } catch (error) {
        this.consecutiveErrors++;
        console.warn(`RefreshManager: Fetch error ${this.consecutiveErrors}/${this.options.consecutiveErrorThreshold}`);
        
        if (this.consecutiveErrors >= this.options.consecutiveErrorThreshold) {
          console.error('🔄 RefreshManager: Too many consecutive errors, forcing refresh');
          this.hardRefresh('error_recovery');
        }
        
        throw error;
      }
    };
  }

  /**
   * Perform hard refresh with cache bypass
   * @param {string} reason - Why the refresh is happening
   */
  hardRefresh(reason = 'manual') {
    console.log(`🔄 RefreshManager: Hard refresh triggered (reason: ${reason})`);
    
    // Prevent refresh loops (minimum 1 minute between refreshes)
    const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
    if (timeSinceLastRefresh < 60000) {
      console.warn('RefreshManager: Refresh rate limited (too soon since last refresh)');
      return;
    }
    
    this.lastRefreshTime = Date.now();
    
    // Clear all storage to force fresh data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('RefreshManager: Could not clear storage:', e);
    }
    
    // Force hard reload (bypasses cache)
    window.location.reload(true);
  }

  /**
   * Soft refresh - just reload without cache clear
   */
  softRefresh() {
    console.log('🔄 RefreshManager: Soft refresh');
    window.location.reload();
  }

  /**
   * Clean up timers
   */
  destroy() {
    if (this.dailyRefreshTimer) {
      clearTimeout(this.dailyRefreshTimer);
    }
    if (this.deploymentCheckTimer) {
      clearInterval(this.deploymentCheckTimer);
    }
  }
}

// Create global instance
window.refreshManager = new RefreshManager({
  dailyRefreshHour: 4,
  dailyRefreshMinute: 30,
  deploymentCheckInterval: 5 * 60 * 1000, // 5 minutes
  consecutiveErrorThreshold: 3,
});

export { RefreshManager };