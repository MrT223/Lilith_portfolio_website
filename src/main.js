import { createIcons, icons } from 'lucide';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { renderHome } from './pages/home.js';
import { renderGallery, initAnimeSubTabs } from './pages/gallery.js';
import { renderPrice } from './pages/price.js';
import { renderAbout } from './pages/about.js';
import { initAdminSecret, loadAdminSettings, applyImageOverrides } from './admin.js';

// Initialize Vercel Speed Insights
injectSpeedInsights();

const pages = {
  home: renderHome,
  gallery: renderGallery,
  price: renderPrice,
  about: renderAbout
};

let currentPage = 'home';
let scrollNavCooldown = false;

// ==================== SPA ROUTER ====================
function navigate(page) {
  if (page === currentPage) return;
  const container = document.getElementById('page-container');
  container.classList.add('fade-out');
  scrollNavCooldown = true;
  setTimeout(() => {
    currentPage = page;
    window.location.hash = page;
    renderPage(page);
    container.classList.remove('fade-out');
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => { scrollNavCooldown = false; }, 800);
  }, 400);
}

function renderPage(page) {
  const container = document.getElementById('page-container');
  const renderer = pages[page];
  if (renderer) {
    container.innerHTML = renderer();
    updateActiveNav(page);
    createIcons({ icons });
    applyImageOverrides();
    initPageEffects();
  }
}

function updateActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
}

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '') || 'home';
  return pages[hash] ? hash : 'home';
}

// ==================== NAV EVENTS ====================
function initNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const toggle = document.getElementById('nav-toggle');
  const linksContainer = document.getElementById('nav-links');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.classList.contains('nav-contact')) return;
      e.preventDefault();
      const page = link.dataset.page;
      window.location.hash = page;
      navigate(page);
      linksContainer.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    linksContainer.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#main-nav')) {
      linksContainer.classList.remove('open');
      toggle.classList.remove('active');
    }
  });

  window.addEventListener('scroll', () => {
    document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 30);
  });

  let wheelAccum = 0;
  window.addEventListener('wheel', (e) => {
    if (currentPage !== 'home' || scrollNavCooldown) return;
    if (e.deltaY > 0) {
      wheelAccum += e.deltaY;
      if (wheelAccum > 200) {
        wheelAccum = 0;
        navigate('gallery');
      }
    } else {
      wheelAccum = 0;
    }
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (currentPage === 'home') {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (currentPage !== 'home' || scrollNavCooldown) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    if (diff > 50) {
      navigate('gallery');
    }
  }, { passive: true });
}

// ==================== LIGHTBOX ====================
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      const src = trigger.dataset.lightbox || trigger.src;
      lightboxImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 400);
  }
}

// ==================== SCROLL REVEAL ====================
function initPageEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .price-card, .tos-card, .lilith-card, .alt-art-card').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 0.08, 0.6)}s`;
    observer.observe(el);
  });

  // Gallery items: force reveal with stagger for the active grid
  // (IntersectionObserver doesn't reliably fire during SPA fade transitions)
  const activeGrid = document.querySelector('.gallery-grid-section[style=""], .gallery-grid-section:not([style*="display:none"]):not([style*="display: none"])');
  if (activeGrid) {
    activeGrid.querySelectorAll('.gallery-item').forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 80);
    });
  }

  // Init anime sub-tabs
  initAnimeSubTabs();

  // TOS accordion
  document.querySelectorAll('.tos-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      card.classList.toggle('open');
    });
  });

  // Price collapsible accordion
  document.querySelectorAll('.price-collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const container = header.parentElement;
      const body = container.querySelector('.price-collapsible-body');
      if (container.classList.contains('open')) {
        // Closing
        body.style.maxHeight = body.scrollHeight + 'px';
        body.offsetHeight; // force reflow
        body.style.maxHeight = '0px';
        container.classList.remove('open');
      } else {
        // Opening
        container.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Gallery tabs
  document.querySelectorAll('.gallery-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.dataset.category;
      showGalleryCategory(category);
    });
  });
}

function showGalleryCategory(category) {
  const grids = document.querySelectorAll('.gallery-grid-section');
  grids.forEach(grid => {
    if (grid.dataset.category === category) {
      // For anime section wrapper, show as flex/block
      if (grid.classList.contains('anime-section-wrapper')) {
        grid.style.display = '';
      } else {
        grid.style.display = 'grid';
      }
      // Re-trigger animation for visible items
      const activeSubGrid = grid.querySelector('.anime-sub-grid:not([style*="display:none"]):not([style*="display: none"])');
      const targetGrid = activeSubGrid || grid;
      targetGrid.querySelectorAll('.gallery-item').forEach((item, i) => {
        item.classList.remove('visible');
        setTimeout(() => item.classList.add('visible'), i * 80);
      });
    } else {
      grid.style.display = 'none';
    }
  });
}

// ==================== CHERRY BLOSSOM PARTICLES ====================
class SakuraPetal {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * this.canvas.width;
    this.y = initial ? Math.random() * this.canvas.height : -20;
    this.size = Math.random() * 12 + 6;
    this.speedY = Math.random() * 1.2 + 0.4;
    this.speedX = Math.random() * 1 - 0.5;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.03;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.swayAmplitude = Math.random() * 40 + 20;
    this.swaySpeed = Math.random() * 0.02 + 0.01;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.life = 1;
    this.bursting = false;
    this.burstTimer = 0;
    this.burstChance = Math.random();
    this.hue = Math.random() * 20 + 340; // pink range
    this.saturation = Math.random() * 30 + 60;
    this.lightness = Math.random() * 15 + 80;
  }

  update(time) {
    if (this.bursting) {
      this.burstTimer++;
      this.life -= 0.025;
      this.size *= 0.98;
      this.opacity = this.life * 0.5;
      this.rotationSpeed *= 1.08;
      if (this.life <= 0) {
        this.reset();
        return;
      }
    } else {
      this.y += this.speedY;
      this.x += Math.sin(time * this.swaySpeed + this.swayOffset) * 0.5 + this.speedX;
      this.rotation += this.rotationSpeed;

      // Trigger burst randomly when petal is in middle/lower section
      if (this.y > this.canvas.height * 0.5 && this.burstChance > 0.92 && Math.random() > 0.998) {
        this.bursting = true;
      }

      if (this.y > this.canvas.height + 20) {
        this.reset();
      }
    }
  }

  draw(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;

    // Draw petal shape
    ctx.fillStyle = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      this.size * 0.4, -this.size * 0.5,
      this.size, -this.size * 0.3,
      this.size, 0
    );
    ctx.bezierCurveTo(
      this.size, this.size * 0.3,
      this.size * 0.4, this.size * 0.5,
      0, 0
    );
    ctx.fill();

    // Subtle glow on burst
    if (this.bursting) {
      ctx.globalAlpha = this.opacity * 0.3;
      ctx.fillStyle = `hsl(${this.hue}, 80%, 90%)`;
      ctx.beginPath();
      ctx.arc(this.size * 0.5, 0, this.size * (2 - this.life), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function initSakura() {
  const canvas = document.getElementById('sakura-canvas');
  const ctx = canvas.getContext('2d');
  let petals = [];
  const PETAL_COUNT = 35;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new SakuraPetal(canvas));
  }

  let time = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time++;
    petals.forEach(petal => {
      petal.update(time);
      petal.draw(ctx, time);
    });
    requestAnimationFrame(animate);
  }

  animate();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLightbox();
  initSakura();
  createIcons({ icons });

  const page = getPageFromHash();
  currentPage = page;
  renderPage(page);

  initAdminSecret();
  loadAdminSettings();

  window.addEventListener('hashchange', () => {
    const newPage = getPageFromHash();
    if (newPage !== currentPage) navigate(newPage);
  });
});
