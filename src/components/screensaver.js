/**
 * Starfield Screensaver Component
 * 
 * Usage:
 * 1. Import or include this script
 * 2. Call initScreensaver() once on page load
 * 3. Call triggerScreensaver() to start the effect
 * 
 * Color scheme: Catppuccin Mocha
 * - Base: #1e1e2e (dark background)
 * - Text/light: #cdd6f4 (lavender text)
 * - Accent 1: #b4befe (lavender)
 * - Accent 2: #89b4fa (sapphire)
 * - Bright: #f5f5f5 (near white)
 */

class StarfieldScreensaver {
  constructor(options = {}) {
    this.options = {
      duration: options.duration || 30000, // 30 seconds
      fadeInDuration: options.fadeInDuration || 1500, // 1.5 seconds
      fadeOutDuration: options.fadeOutDuration || 1500,
      particleCount: options.particleCount || 800,
      scanLineOpacity: options.scanLineOpacity || 0.03,
      scanLineSpacing: options.scanLineSpacing || 3,
      minDepth: options.minDepth || 0.1,
      maxDepth: options.maxDepth || 1,
      ...options
    };

    this.isRunning = false;
    this.animationFrameId = null;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.startTime = null;
    this.screensaverStartTime = null;

    // Catppuccin Mocha colors
    this.colors = {
      base: '#1e1e2e',
      brightGray: '#f5f5f5',
      lavender: '#b4befe',
      sapphire: '#89b4fa',
      text: '#cdd6f4',
      surface: '#313244',
    };

    this.init();
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'starfield-screensaver-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 9998;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'starfield-canvas';
    this.canvas.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
    `;
    this.container.appendChild(this.canvas);

    // Create scan-line overlay
    const scanlineOverlay = document.createElement('div');
    scanlineOverlay.id = 'scanline-overlay';
    scanlineOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, ${this.options.scanLineOpacity}),
        rgba(0, 0, 0, ${this.options.scanLineOpacity}) ${this.options.scanLineSpacing}px,
        transparent ${this.options.scanLineSpacing}px,
        transparent ${this.options.scanLineSpacing * 2}px
      );
      pointer-events: none;
    `;
    this.container.appendChild(scanlineOverlay);

    document.body.appendChild(this.container);

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.resizeCanvas();
    this.createParticles();

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * (this.options.maxDepth - this.options.minDepth) +
          this.options.minDepth,
        originalZ: 0, // Stored to preserve parallax
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        vz: Math.random() * 0.01 + 0.005,
        size: Math.random() * 1.5 + 0.5,
        colorType: Math.random() > 0.85 ? 'accent' : 'neutral', // 15% accent colors
        accentColor: Math.random() > 0.5 ? 'lavender' : 'sapphire',
      });
    }
  }

  getParticleColor(particle) {
    if (particle.colorType === 'accent') {
      const color =
        particle.accentColor === 'lavender'
          ? this.colors.lavender
          : this.colors.sapphire;
      // Opacity varies with depth (closer = brighter)
      const opacity = Math.min(particle.z, 1);
      return color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
    }

    // Neutral stars: vary between text and bright gray based on depth
    const opacity = particle.z * 0.8 + 0.2; // Range: 0.2 to 1.0
    return `rgba(245, 245, 245, ${opacity})`; // brightGray
  }

  updateParticles() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2; //why do these exist without being used?

    for (let particle of this.particles) {
      // Move particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;

      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      // Reset depth for 3D effect
      if (particle.z > this.options.maxDepth) {
        particle.z = this.options.minDepth;
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
      }
    }
  }

  drawParticles() {
    // Clear background
    this.ctx.fillStyle = this.colors.base;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort particles by depth (draw far ones first)
    this.particles.sort((a, b) => a.z - b.z);

    // Draw each particle
    for (let particle of this.particles) {
      const scale = particle.z;
      const size = particle.size * scale;

      this.ctx.fillStyle = this.getParticleColor(particle);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, Math.max(size, 0.5), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  animationLoop() {
    if (!this.isRunning) return;

    this.updateParticles();
    this.drawParticles();

    this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
  }

  async trigger() {
    return new Promise((resolve) => {
      const fadeInStart = Date.now();
      const fadeInEnd = fadeInStart + this.options.fadeInDuration;
      const screensaverEnd = fadeInEnd + this.options.duration;
      const fadeOutEnd = screensaverEnd + this.options.fadeOutDuration;

      this.isRunning = true;
      this.animationLoop();

      const fadeLoop = () => {
        const now = Date.now();

        if (now < fadeInEnd) {
          // Fade in phase
          const progress = (now - fadeInStart) / this.options.fadeInDuration;
          this.container.style.opacity = Math.min(progress, 1);
          requestAnimationFrame(fadeLoop);
        } else if (now < screensaverEnd) {
          // Full opacity phase
          this.container.style.opacity = '1';
          requestAnimationFrame(fadeLoop);
        } else if (now < fadeOutEnd) {
          // Fade out phase
          const progress = (now - screensaverEnd) / this.options.fadeOutDuration;
          this.container.style.opacity = Math.max(1 - progress, 0);
          requestAnimationFrame(fadeLoop);
        } else {
          // Complete
          this.container.style.opacity = '0';
          this.isRunning = false;
          resolve();
        }
      };

      fadeLoop();
    });
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isRunning = false;
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Export for use
//if (typeof module !== 'undefined' && module.exports) {
//  module.exports = StarfieldScreensaver;
//}

export { StarfieldScreensaver };