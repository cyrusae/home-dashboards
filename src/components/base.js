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
        
        /* Component styles inherit CSS variables from root theme.css */
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
      background-color: rgba(231, 130, 132, 0.1);
      border: 2px solid var(--accent-red);
      color: var(--accent-red);
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