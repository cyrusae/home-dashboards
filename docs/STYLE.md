# Style: Dawnfire-friendly webdev conventions

**Guiding rule:** Code belongs in language-specific files. If an IDE wouldn't know what language to highlight a block of code in, refactor your code.

**Consequence:** Use imports liberally; give files matching names and differentiate by file type.

## File Organization

### Reusable Components

```
src/components/{componentName}/
├── {componentName}.js       # Component logic + registration
├── {componentName}.html     # Template with comment header
└── {componentName}.css      # Component styles + theme import
```

### Dashboards

```
src/dashboards/{dashboardName}/
├── {dashboardName}.js       # Layout orchestration
├── {dashboardName}.html     # Grid structure + component composition
└── {dashboardName}.css      # Layout styles
```

### Comment Headers

Every `.html` template file should start with a comment explaining its purpose:
```html
<!-- weather.html
     Used by: src/components/weather/weather.js
     Contains templates for WeatherCurrent and WeatherForecast components
-->
<div class="weather-left">
  ...
</div>
```

## Specific Rules

* **Never** use `<style>` blocks in `.js` files; extract to `.css` and import.
* **Never** use inline `style` attributes for component styling; put them in `.css` files.
* **Import at the top** of `.js` files (no lazy-loading). Explicit imports act as self-documentation.
* **Template strings in `.js`**: Single source line only. Multi-line markup → separate `.html` file.
* **Every component `.css` file** must explicitly `@import '/src/styles/theme.css'` (even though it's redundant, it documents the dependency).
* **Dashboards own the layout containers and section titles**; components are portable data-display units.
* Match files by name, differentiate by suffix: `weather.js`, `weather.html`, `weather.css`.

## CSS Custom Properties & Theming

All color and size variables are defined in `theme.css` using `[data-theme]` selectors:

```css
[data-theme="mocha"] {
  --accent-sky: #89dceb;
  --text-primary: #cdd6f4;
  /* ... */
}

[data-theme="latte"] {
  --accent-sky: #90e1f9;
  --text-primary: #4c4f69;
  /* ... */
}
```

The `data-theme` attribute lives on `<html>` in `index.html`. This enables future theme-switching without refactoring component architecture.

## Examples

### ❌ Incorrect: Multi-line template in JS

```javascript
render() {
  const html = `
    <div class="weather-container">
      <div class="temp">${this.temp}°</div>
      <div class="condition">${this.condition}</div>
      <div class="details">
        <span>Humidity: ${this.humidity}%</span>
        <span>Wind: ${this.wind} mph</span>
      </div>
    </div>
  `;
  const styles = `
    .weather-container { display: flex; ... }
    .temp { font-size: var(--size-large); ... }
  `;
  this.setContent(html, styles);
}
```

### ✅ Correct: Separate files with imports

```javascript
// weather.js
import weatherHtml from './weather.html?raw';
import weatherStyles from './weather.css?raw';

class WeatherCurrent extends DashboardComponent {
  connectedCallback() {
    this.render();
  }

  render() {
    this.setContent(weatherHtml, weatherStyles);
  }
}
```

```html
<!-- weather.html
     Used by: src/components/weather/weather.js
     Displays current weather conditions with details
-->
<div class="weather-container">
  <div class="temp" id="temp">--°</div>
  <div class="condition" id="condition">Loading...</div>
  <div class="details">
    <span>Humidity: <span id="humidity">--</span>%</span>
    <span>Wind: <span id="wind">--</span> mph</span>
  </div>
</div>
```

```css
/* weather.css */
@import '/src/styles/theme.css';

.weather-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.temp {
  font-size: var(--size-large);
  font-weight: bold;
  color: var(--text-primary);
}

.condition {
  font-size: var(--size-body);
  color: var(--text-secondary);
}
```

### ❌ Incorrect: Inline styles in JS

```javascript
showError(message) {
  const error = document.createElement('div');
  error.style.cssText = `
    background-color: rgba(231, 130, 132, 0.1);
    border: 2px solid var(--accent-red);
    color: var(--accent-red);
    padding: 16px;
  `;
  error.textContent = `Error: ${message}`;
}
```

### ✅ Correct: Styles in CSS file

```javascript
// In component.js
showError(message) {
  const error = document.createElement('div');
  error.className = 'error-box';
  error.textContent = `Error: ${message}`;
  this.shadowRoot.appendChild(error);
}
```

```css
/* In component.css */
.error-box {
  background-color: rgba(231, 130, 132, 0.1);
  border: 2px solid var(--accent-red);
  color: var(--accent-red);
  padding: 16px;
  border-radius: 4px;
  font-family: var(--font-family);
}
```