// ===== LIQUID GLASS EFFECTS =====
// Implements interactive glass effects with refraction simulation

class LiquidGlassEffect {
  constructor() {
    this.cursor = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.rafId = null;
    this.glassElements = [];
    this.isTouch = 'ontouchstart' in window;
    
    this.init();
  }
  
  init() {
    // Create glass cursor element
    this.createGlassCursor();
    
    // Initialize glass elements
    this.initGlassElements();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start animation loop
    this.animate();
    
    // Add intersection observer for scroll animations
    this.setupScrollAnimations();
  }
  
  createGlassCursor() {
    if (this.isTouch) return; // Skip on touch devices
    
    this.cursor = document.createElement('div');
    this.cursor.className = 'glass-cursor-effect';
    this.cursor.innerHTML = `
      <svg viewBox="0 0 200 200" class="glass-cursor-svg">
        <defs>
          <radialGradient id="glassGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:rgba(0,255,136,0.15);stop-opacity:1" />
            <stop offset="40%" style="stop-color:rgba(0,255,136,0.08);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,255,136,0);stop-opacity:1" />
          </radialGradient>
          <filter id="glassBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#glassGradient)" filter="url(#glassBlur)" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0,255,136,0.1)" stroke-width="1" />
      </svg>
    `;
    
    // Style the cursor
    Object.assign(this.cursor.style, {
      position: 'fixed',
      width: '200px',
      height: '200px',
      pointerEvents: 'none',
      zIndex: '9998',
      opacity: '0',
      transform: 'translate(-50%, -50%)',
      transition: 'opacity 0.3s ease',
      mixBlendMode: 'screen'
    });
    
    document.body.appendChild(this.cursor);
  }
  
  initGlassElements() {
    // Add glass effects to specific elements
    const selectors = [
      '.floating-badge',
      '.stat',
      '.skill-block',
      '.project-card',
      '.edu-card',
      '.contact-link',
      '.exp-item'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        this.glassElements.push(el);
        el.classList.add('glass-interactive');
      });
    });
  }
  
  setupEventListeners() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      this.targetX = e.clientX;
      this.targetY = e.clientY;
      
      if (this.cursor) {
        this.cursor.style.opacity = '1';
      }
      
      // Update glass elements based on mouse position
      this.updateGlassElements(e.clientX, e.clientY);
    });
    
    // Mouse leave
    document.addEventListener('mouseleave', () => {
      if (this.cursor) {
        this.cursor.style.opacity = '0';
      }
    });
    
    // Touch events for mobile
    if (this.isTouch) {
      document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        this.updateGlassElements(touch.clientX, touch.clientY);
      });
    }
    
    // Add hover effects to glass elements
    this.glassElements.forEach(el => {
      el.addEventListener('mouseenter', () => this.onGlassEnter(el));
      el.addEventListener('mouseleave', () => this.onGlassLeave(el));
      el.addEventListener('mousemove', (e) => this.onGlassMove(el, e));
    });
  }
  
  updateGlassElements(mouseX, mouseY) {
    this.glassElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (mouseX - centerX) / window.innerWidth;
      const deltaY = (mouseY - centerY) / window.innerHeight;
      
      // Calculate distance for intensity
      const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) + 
        Math.pow(mouseY - centerY, 2)
      );
      
      const maxDistance = 400;
      const intensity = Math.max(0, 1 - distance / maxDistance);
      
      // Apply subtle transform based on mouse position
      if (intensity > 0 && el.classList.contains('glass-interactive')) {
        const rotateX = deltaY * 5 * intensity;
        const rotateY = -deltaX * 5 * intensity;
        
        el.style.setProperty('--glass-rotateX', `${rotateX}deg`);
        el.style.setProperty('--glass-rotateY', `${rotateY}deg`);
        el.style.setProperty('--glass-intensity', intensity);
      }
    });
  }
  
  onGlassEnter(el) {
    el.classList.add('glass-hover');
    
    // Add chromatic aberration class
    el.setAttribute('data-chromatic', 'true');
  }
  
  onGlassLeave(el) {
    el.classList.remove('glass-hover');
    el.removeAttribute('data-chromatic');
    
    // Reset transforms
    el.style.setProperty('--glass-rotateX', '0deg');
    el.style.setProperty('--glass-rotateY', '0deg');
    el.style.setProperty('--glass-intensity', '0');
  }
  
  onGlassMove(el, e) {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Update specular highlight position
    el.style.setProperty('--specular-x', `${x * 100}%`);
    el.style.setProperty('--specular-y', `${y * 100}%`);
  }
  
  animate() {
    // Smooth cursor follow with elastic feel
    const elasticity = 0.15;
    
    this.mouseX += (this.targetX - this.mouseX) * elasticity;
    this.mouseY += (this.targetY - this.mouseY) * elasticity;
    
    if (this.cursor) {
      this.cursor.style.left = `${this.mouseX}px`;
      this.cursor.style.top = `${this.mouseY}px`;
    }
    
    this.rafId = requestAnimationFrame(() => this.animate());
  }
  
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('glass-visible');
          
          // Animate skill bars if present
          const skillBar = entry.target.querySelector('.skill-bar-fill');
          if (skillBar) {
            const progress = skillBar.dataset.progress;
            skillBar.style.width = `${progress}%`;
          }
        }
      });
    }, observerOptions);
    
    // Observe glass elements
    document.querySelectorAll('.glass-interactive, .skill-block, .project-card').forEach(el => {
      observer.observe(el);
    });
  }
  
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.cursor && this.cursor.parentNode) {
      this.cursor.parentNode.removeChild(this.cursor);
    }
  }
}

// ===== LIQUID GLASS NAVIGATION =====
class GlassNavigation {
  constructor() {
    this.nav = document.querySelector('nav');
    this.lastScrollY = 0;
    this.ticking = false;
    
    this.init();
  }
  
  init() {
    if (!this.nav) return;
    
    // Add glass class to nav
    this.nav.classList.add('nav-glass');
    
    // Set up scroll listener
    window.addEventListener('scroll', () => this.onScroll());
  }
  
  onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateNav();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
  
  updateNav() {
    const scrollY = window.scrollY;
    
    // Increase glass blur on scroll
    const scrollProgress = Math.min(scrollY / 200, 1);
    const blurAmount = 20 + scrollProgress * 10;
    
    this.nav.style.setProperty('--nav-blur', `${blurAmount}px`);
    
    // Add/remove scrolled class
    if (scrollY > 50) {
      this.nav.classList.add('nav-scrolled');
    } else {
      this.nav.classList.remove('nav-scrolled');
    }
    
    this.lastScrollY = scrollY;
  }
}

// ===== GLASS MODAL ENHANCEMENTS =====
class GlassModal {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.modal = document.getElementById('modal');
    
    this.init();
  }
  
  init() {
    if (!this.modal) return;
    
    // Add glass class to modal
    this.modal.classList.add('modal-glass');
    
    // Add backdrop blur to overlay
    if (this.overlay) {
      this.overlay.style.backdropFilter = 'blur(5px)';
      this.overlay.style.webkitBackdropFilter = 'blur(5px)';
    }
  }
}

// ===== GLASS RIPPLE EFFECT =====
class GlassRipple {
  constructor() {
    this.init();
  }
  
  init() {
    // Add ripple to clickable glass elements
    document.querySelectorAll('.btn-glass, .cta-btn, .contact-link').forEach(el => {
      el.addEventListener('click', (e) => this.createRipple(e, el));
    });
  }
  
  createRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'glass-ripple';
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(0,255,136,0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: rippleExpand 0.6s ease-out forwards;
    `;
    
    // Ensure el has relative positioning
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    
    el.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }
}

// ===== GLASS PARTICLES =====
class GlassParticles {
  constructor(container) {
    this.container = container || document.querySelector('.hero');
    this.particles = [];
    this.particleCount = 15;
    
    this.init();
  }
  
  init() {
    if (!this.container) return;
    
    // Create particle container
    this.particleContainer = document.createElement('div');
    this.particleContainer.className = 'glass-particles';
    this.particleContainer.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    `;
    
    this.container.style.position = 'relative';
    this.container.appendChild(this.particleContainer);
    
    // Create particles
    for (let i = 0; i < this.particleCount; i++) {
      this.createParticle(i);
    }
  }
  
  createParticle(index) {
    const particle = document.createElement('div');
    const size = 4 + Math.random() * 8;
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * -20;
    const x = Math.random() * 100;
    
    particle.className = 'glass-particle';
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      bottom: -20px;
      background: radial-gradient(circle, rgba(0,255,136,0.4) 0%, transparent 70%);
      border-radius: 50%;
      animation: particleRise ${duration}s linear ${delay}s infinite;
      opacity: ${0.3 + Math.random() * 0.4};
    `;
    
    this.particleContainer.appendChild(particle);
    this.particles.push(particle);
  }
}

// ===== ADD REQUIRED STYLES =====
function addGlassStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Ripple animation */
    @keyframes rippleExpand {
      to {
        width: 300px;
        height: 300px;
        opacity: 0;
      }
    }
    
    /* Particle rise animation */
    @keyframes particleRise {
      0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
      }
      10% {
        opacity: 0.5;
      }
      90% {
        opacity: 0.3;
      }
      100% {
        transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}50px) scale(0.5);
        opacity: 0;
      }
    }
    
    /* Glass interactive transforms */
    .glass-interactive {
      transform-style: preserve-3d;
      transition: transform 0.3s ease;
    }
    
    .glass-interactive.glass-hover {
      transform: 
        perspective(1000px)
        rotateX(var(--glass-rotateX, 0deg))
        rotateY(var(--glass-rotateY, 0deg))
        translateZ(10px);
    }
    
    /* Dynamic specular highlight */
    .glass-hover::before {
      background: radial-gradient(
        circle at var(--specular-x, 50%) var(--specular-y, 0%),
        rgba(255, 255, 255, 0.3) 0%,
        transparent 50%
      ) !important;
    }
    
    /* Nav scroll state */
    .nav-scrolled {
      background: linear-gradient(
        180deg,
        rgba(10, 10, 10, 0.95) 0%,
        rgba(10, 10, 10, 0.85) 100%
      ) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }
    
    /* Glass visible animation */
    .glass-visible {
      animation: glassReveal 0.6s ease forwards;
    }
    
    @keyframes glassReveal {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Glass cursor SVG */
    .glass-cursor-svg {
      width: 100%;
      height: 100%;
    }
  `;
  
  document.head.appendChild(style);
}

// ===== INITIALIZE =====
let liquidGlass = null;
let glassNav = null;
let glassModal = null;
let glassRipple = null;
let glassParticles = null;

function initLiquidGlass() {
  // Add base styles
  addGlassStyles();
  
  // Initialize effects
  liquidGlass = new LiquidGlassEffect();
  glassNav = new GlassNavigation();
  glassModal = new GlassModal();
  glassRipple = new GlassRipple();
  
  // Add particles to hero section (optional - can be resource intensive)
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    glassParticles = new GlassParticles(heroSection);
  }
  
  console.log('✨ Liquid Glass effects initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to render
    setTimeout(initLiquidGlass, 100);
  });
} else {
  setTimeout(initLiquidGlass, 100);
}

// Re-initialize after app renders (for dynamic content)
const originalRenderApp = window.renderApp;
if (typeof originalRenderApp === 'function') {
  window.renderApp = function() {
    originalRenderApp.apply(this, arguments);
    setTimeout(initLiquidGlass, 100);
  };
}

// Export for manual initialization
window.LiquidGlass = {
  init: initLiquidGlass,
  Effect: LiquidGlassEffect,
  Navigation: GlassNavigation,
  Modal: GlassModal,
  Ripple: GlassRipple,
  Particles: GlassParticles
};