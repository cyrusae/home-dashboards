/**
 * Base Web Component Class
 * Provides common functionality for all dashboard components
 */

export class DashboardComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Set the component's HTML content and styling
   * @param {string} html - HTML template
   * @param {string} styles - CSS scoped to this component
   */
  setContent(html, styles = '') {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        /* Inherit CSS variables from root */
        :host {
          --latte-base: #eff1f5;
          --latte-mantle: #e6e9ef;
          --latte-crust: #dce0e8;
          --bg-soft: #e6e9ef;
          --text-primary: #4c4f69;
          --text-secondary: #6c6f85;
          --text-light: #9ca0b0;
          --accent-sky: #04a5e5;
          --accent-teal: #179299;
          --accent-lavender: #7287fd;
          --accent-maroon: #e64553;
          --accent-flamingo: #dd7878;
          --accent-red: #d20f39;
          --accent-peach: #fe640b;
          --accent-green: #40a02f;
          --accent-yellow: #df8e1d;
          --accent-mauve: #8839ef;
          --pst-accent: #8839ef;
          --aqi-good: #40a02f;
          --aqi-moderate: #df8e1d;
          --aqi-unhealthy-sensitive: #fe640b;
          --aqi-unhealthy: #d20f39;
          --aqi-very-unhealthy: #8839ef;
          --aqi-hazardous: #1a1a1a;
          --pressure-rising: #dd7878;
          --pressure-steady: #9ca0b0;
          --pressure-falling: #fe640b;
          --size-tiny: clamp(14px, 1vw, 20px);
          --size-small: clamp(18px, 1.5vw, 24px);
          --size-body: clamp(24px, 2vw, 32px);
          --size-heading: clamp(32px, 4vw, 48px);
          --size-large: clamp(100px, 15vw, 200px);
          --size-huge: clamp(200px, 30vw, 400px);
          --size-massive: clamp(300px, 40vw, 500px);
          --font-family: 'Courier New', monospace;
          --line-height-tight: 1.2;
          --line-height-normal: 1.5;
          --line-height-loose: 1.8;
        }
        
        ${styles}
      </style>
      ${html}
    `;

    // Clear existing shadow DOM first
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  /**
   * Query an element within shadow DOM
   */
  query(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Query all elements within shadow DOM
   */
  queryAll(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }

  /**
   * Set innerHTML on an element within shadow DOM
   */
  setHTML(selector, html) {
    const element = this.query(selector);
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Add event listener to element within shadow DOM
   */
  on(selector, event, handler) {
    const element = this.query(selector);
    if (element) {
      element.addEventListener(event, handler.bind(this));
    }
  }

  /**
   * Show error state (red box with error message)
   */
  showError(message) {
    const error = document.createElement('div');
    error.style.cssText = `
      background-color: rgba(210, 15, 57, 0.1);
      border: 2px solid #d20f39;
      color: #d20f39;
      padding: 16px;
      border-radius: 4px;
      font-size: var(--size-body);
      font-family: var(--font-family);
    `;
    error.textContent = `Error: ${message}`;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(error);
  }

  /**
   * Show loading state
   */
  showLoading() {
    const loading = document.createElement('div');
    loading.style.cssText = `
      color: var(--text-light);
      font-style: italic;
      padding: 16px;
      font-size: var(--size-body);
      font-family: var(--font-family);
    `;
    loading.textContent = 'Loading...';
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(loading);
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