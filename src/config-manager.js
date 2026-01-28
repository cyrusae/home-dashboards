/**
 * Configuration Manager
 * Handles loading config from multiple sources:
 * 1. Production: window.__DASHBOARD_CONFIG__ (injected by K3s init container)
 * 2. Development: /api/config endpoint (served by Express backend reading .env)
 */
// Dynamically inject config.js script tag (prevents Vite from stripping it)
(function injectConfigScript() {
  const script = document.createElement('script');
  script.src = '/config.js';
  script.async = false; // Load synchronously before other scripts
  script.onerror = () => {
    console.warn('⚠️ config.js not found - will try backend endpoint');
  };
  document.head.insertBefore(script, document.head.firstChild);
})();

class ConfigManager {
  constructor() {
    this.config = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // 1. Try production mode: Kubernetes-injected config
      if (window.__DASHBOARD_CONFIG__) {
        console.log('✓ ConfigManager: Using Kubernetes-injected config (production mode)');
        this.config = window.__DASHBOARD_CONFIG__;
        this.isInitialized = true;
        return this.config;
      }

      // 2. Try development mode: Backend endpoint
      console.log('ℹ ConfigManager: No injected config found, trying backend endpoint...');
      const response = await fetch('/api/config');

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Config endpoint not available (production mode without injection)');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.config = await response.json();
      console.log('✓ ConfigManager: Loaded config from backend /api/config (development mode)');
      this.isInitialized = true;
      return this.config;
    } catch (error) {
      console.error('✗ ConfigManager: Failed to load configuration:', error.message);
      throw new Error(
        `Configuration failed to load. Details: ${error.message}\n\n` +
        'Local dev: Did you copy .env.example to .env and fill in credentials?\n' +
        'Production: Did the K3s init container run successfully?'
      );
    }
  }

  /**
   * Get loaded configuration
   * @throws Error if not initialized
   */
  getConfig() {
    if (!this.isInitialized || !this.config) {
      throw new Error('Config not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Get a specific config value
   * @param {string} key - Config key (e.g., 'openWeatherMapApiKey')
   * @param {any} defaultValue - Default if key not found
   */
  get(key, defaultValue = null) {
    if (!this.isInitialized) {
      throw new Error('Config not initialized. Call initialize() first.');
    }
    return this.config?.[key] ?? defaultValue;
  }

  /**
   * Check if config is loaded
   */
  isReady() {
    return this.isInitialized && this.config !== null;
  }

  /**
   * Log config status for debugging (doesn't log sensitive values)
   */
  debugStatus() {
    console.log('ConfigManager Debug Status:');
    console.log('  Initialized:', this.isInitialized);
    console.log('  Has config:', this.config !== null);
    if (this.config) {
      console.log('  Config keys:', Object.keys(this.config).sort());
    }
  }
}

// Global instance
window.configManager = new ConfigManager();

// Initialize immediately on script load
window.configManager.initialize().catch(error => {
  console.error('FATAL: Configuration initialization failed');
  console.error(error);
  document.body.innerHTML = `
    <div style="
      background: #ffe5e5;
      color: #d20f39;
      padding: 40px;
      font-family: monospace;
      font-size: 16px;
      line-height: 1.6;
    ">
      <h1>⚠️ Configuration Error</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <hr style="border: none; border-top: 1px solid #d20f39; margin: 20px 0;">
      <h3>Troubleshooting:</h3>
      <p><strong>Local Development:</strong></p>
      <pre>cp .env.example .env
# Edit .env with your credentials
node server.js</pre>
      <p><strong>Production (K3s):</strong></p>
      <pre>kubectl logs -n dashboards deployment/morning-dashboard
# Check if init container created config.js</pre>
      <p>Check browser console (F12) for more details.</p>
    </div>
  `;
});