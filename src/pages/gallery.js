export function renderGallery() {
  const normalImages = Array.from({ length: 7 }, (_, i) => `normal0${i + 1}.jpg`);
  const chibiImages = Array.from({ length: 7 }, (_, i) => `chibi0${i + 1}.jpg`);

  function createGrid(images, folder, category) {
    return `
      <div class="gallery-grid gallery-grid-section" data-category="${category}" style="${category === 'chibi' ? 'display:none' : ''}">
        ${images.map((img, i) => `
          <div class="gallery-item stagger-${Math.min(i + 1, 7)}">
            <img
              src="/img/Sample/${folder}/${img}"
              alt="${category} artwork ${i + 1}"
              data-lightbox="/img/Sample/${folder}/${img}"
              loading="lazy"
            />
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <section class="gallery-page">
      <div class="page-header reveal">
        <h1 class="page-title">
          <span class="page-title-accent"><i data-lucide="flower"></i></span> Gallery
        </h1>
        <p class="page-desc">Tuyển tập các tác phẩm đã thực hiện</p>
      </div>

      <div class="gallery-tabs reveal">
        <button class="gallery-tab active" data-category="normal"><i data-lucide="palette"></i> Normal</button>
        <button class="gallery-tab" data-category="chibi"><i data-lucide="star"></i> Chibi</button>
      </div>

      ${createGrid(normalImages, 'Normal', 'normal')}
      ${createGrid(chibiImages, 'Chibi', 'chibi')}
    </section>
  `;
}
