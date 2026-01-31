/**
 * Base Web Component Class
 * Provides common functionality for all dashboard components
 * Enhanced with null-safety and network resilience
 */

export class DashboardComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Set the component's HTML content and styling
   * @param {string} html - HTML template
   * @param {string} styles - CSS scoped to this component
   */
  setContent(html, styles = '') {
    const template = document.createElement('template');
    template.innerHTML = `
      <link rel="stylesheet" href="/src/styles/theme.css">
      <style>
        :host {
          display: block;
        }
        
        /* Component styles inherit CSS variables from root theme.css */
        ${styles}
      </style>
      ${html}
    `;

    // Clear existing shadow DOM first
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  /**
   * Query an element within shadow DOM (null-safe)
   */
  query(selector) {
    if (!this.shadowRoot) return null;
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Query all elements within shadow DOM (null-safe)
   */
  queryAll(selector) {
    if (!this.shadowRoot) return [];
    return this.shadowRoot.querySelectorAll(selector);
  }

  /**
   * Set innerHTML on an element within shadow DOM (null-safe)
   */
  setHTML(selector, html) {
    const element = this.query(selector);
    if (element) {
      element.innerHTML = html;
      return true;
    }
    return false;
  }

  /**
   * Set text content on an element (null-safe)
   */
  setText(selector, text) {
    const element = this.query(selector);
    if (element) {
      element.textContent = text;
      return true;
    }
    return false;
  }

  /**
   * Add event listener to element within shadow DOM (null-safe)
   */
  on(selector, event, handler) {
    const element = this.query(selector);
    if (element) {
      element.addEventListener(event, handler.bind(this));
      return true;
    }
    return false;
  }

  /**
   * Show error state (red box with error message)
   * Enhanced with null-safety
   */
  showError(message) {
    if (!this.shadowRoot) return;

    const error = document.createElement('div');
    error.className = 'error-box';
    error.style.cssText = `
      background-color: rgba(231, 130, 132, 0.1);
      border: 2px solid var(--accent-red);
      color: var(--accent-red);
      padding: 16px;
      border-radius: 4px;
      font-size: var(--size-body);
      font-family: var(--font-family);
    `;
    error.textContent = `Error: ${message}`;
    
    try {
      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(error);
    } catch (e) {
      console.error('Failed to show error UI:', e);
    }
  }

  /**
   * Show loading state
   * Enhanced with null-safety
   */
  showLoading() {
    if (!this.shadowRoot) return;

    const loading = document.createElement('div');
    loading.className = 'loading-box';
    loading.style.cssText = `
      color: var(--text-light);
      font-style: italic;
      padding: 16px;
      font-size: var(--size-body);
      font-family: var(--font-family);
    `;
    loading.textContent = 'Loading...';
    
    try {
      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(loading);
    } catch (e) {
      console.error('Failed to show loading UI:', e);
    }
  }

  /**
   * Fetch with retry logic and error handling
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Response>}
   */
  async fetchWithRetry(url, options = {}, retryCount = 0) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Reset retry counter on success
      this.retryAttempts = 0;
      return response;
      
    } catch (error) {
      console.error(`Fetch failed (attempt ${retryCount + 1}/${this.maxRetries}):`, error.message);
      
      // Check if we should retry
      if (retryCount < this.maxRetries) {
        console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        
        // Show transient error state
        this.showTransientError(`Connection issue. Retrying... (${retryCount + 1}/${this.maxRetries})`);
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        
        // Retry
        return this.fetchWithRetry(url, options, retryCount + 1);
      } else {
        // Max retries exceeded
        throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  /**
   * Show transient error (doesn't destroy component state)
   */
  showTransientError(message) {
    const errorElement = this.query('.transient-error');
    
    if (errorElement) {
      // Update existing error
      errorElement.textContent = message;
    } else {
      // Create new transient error element
      const error = document.createElement('div');
      error.className = 'transient-error';
      error.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(231, 130, 132, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: var(--size-small);
        font-family: var(--font-family);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      `;
      error.textContent = message;
      
      if (this.shadowRoot) {
        this.shadowRoot.appendChild(error);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (error.parentNode) {
            error.remove();
          }
        }, 5000);
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date for display
   */
  formatTime(date, includeDate = false) {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    if (includeDate) {
      options.month = 'short';
      options.day = '2-digit';
    }
    return new Date(date).toLocaleString('en-US', options);
  }
}

// Register base class
if (!customElements.get('dashboard-component')) {
  customElements.define('dashboard-component', DashboardComponent);
}