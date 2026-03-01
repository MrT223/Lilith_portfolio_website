export function renderHome() {
  return `
    <section class="home-page">
      <div class="hero-avatar-wrapper reveal">
        <div class="avatar-ring"></div>
        <img
          class="hero-avatar"
          src="/img/lilith/lilith_main.jpg"
          alt="Lilith Avatar"
          data-lightbox="/img/lilith/lilith_main.jpg"
        />
      </div>
      <h1 class="hero-title">Lilith</h1>
      <p class="hero-subtitle"><i data-lucide="sparkles"></i> Anime & Chibi Artist <i data-lucide="sparkles"></i></p>
      <div class="hero-cta">
        <a href="#gallery" class="btn btn-primary" data-page="gallery" onclick="event.preventDefault(); window.location.hash='gallery';">
          <i data-lucide="palette"></i> Xem Gallery
        </a>
        <a href="#price" class="btn btn-outline" data-page="price" onclick="event.preventDefault(); window.location.hash='price';">
          <i data-lucide="coins"></i> Bảng Giá
        </a>
      </div>
      <div class="scroll-indicator">
        <span></span>
      </div>
    </section>
  `;
}
