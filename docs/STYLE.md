**Guiding rule:** Code belongs in language-specific files. If an IDE wouldn't know what language to highlight a block of code in, refactor your code. 

**Consequence:** Use imports liberally; give files matching names and differentiate by file type.

**Specific cases:**
* Never use `<style>` blocks in `.js` or `.html` files; extract CSS into a `.css` file and import it.
* Content such as template literals and HTML strings must be 3 lines or fewer. Longer markup belongs in an `.html` file.
* Match files by name, differentiate by suffix: expect `/dashboards/night/night.js`, `./night.css`, `./night.html`. Ask user to disambiguate if multiple files are required.
* One language per visual block; try as much as possible to restrict yourself to one language per file.

**Incorrect:**
```{javascript}
render() {
    const html = `
      <div class="night-container">
        <!-- Rotated time on left -->
        <div class="time-vertical">
          <div class="time-display" id="nightTime">--:--</div>
        </div>
        // ... code ...//
const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: #000000;
      }
``` 

**Correct:**
```
import nightContents from './night.html?raw';
import nightStyles from './night.css?raw';
// ... code ...
render() {
 this.setContent(nightContents, nightStyles);
}
```