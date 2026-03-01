export function renderAbout() {
  const lilithImages = [
    'lilith01.jpg', 'lilith02.jpg', 'lilith03.jpg',
    'lilith04.jpg', 'lilith05.jpg', 'lilith06.jpg', 'lilith07.jpg', 'lilith08.jpg'
  ];

  const altArt = [
    { file: 'lilith_gachiakuta.jpg', label: 'Gachiakuta Style' },
    { file: 'lilith_kny.jpg', label: 'Kimetsu no Yaiba Style' },
    { file: 'lilith_mha.jpg', label: 'My Hero Academia Style' },
    { file: 'lilith_wb.jpg', label: 'Wind Breaker Style' },
  ];

  return `
    <section class="about-page">
      <div class="page-header reveal">
        <h1 class="page-title">
          <span class="page-title-accent"><img src="/img/concept/logo.png" alt="" class="title-logo" /></span> About Me
        </h1>
        <p class="page-desc">Xin chào, mình là Lilith!</p>
      </div>

      <div class="about-intro reveal">
        <div class="about-avatar-section">
          <img
            class="about-avatar"
            src="/img/lilith/lilith_main.jpg"
            alt="Lilith"
            data-lightbox="/img/lilith/lilith_main.jpg"
          />
        </div>
        <div class="about-text">
          <h2>Lilith <i data-lucide="sparkles"></i></h2>
          <p>
            Mình là một artist chuyên vẽ anime và chibi. Mình yêu thích việc sáng tạo nhân vật
            với phong cách màu sắc tươi sáng, nét vẽ mềm mại và đáng yêu.
          </p>
          <p>
            Ngoài phong cách chính, mình cũng thích thử sức với nhiều art style khác nhau
            lấy cảm hứng từ các manga/anime nổi tiếng.
          </p>
          <p>
            Cảm ơn bạn đã ghé thăm portfolio của mình! Nếu bạn thích art style của mình,
            đừng ngần ngại liên hệ để đặt commission nhé <img src="/img/concept/logo.png" alt="" class="subtitle-logo" />
          </p>
        </div>
      </div>

      <!-- Lilith Gallery -->
      <div class="about-section">
        <h2 class="about-section-title reveal"><img src="/img/concept/logo.png" alt="" class="section-logo" /> Lilith Gallery</h2>
        <div class="lilith-gallery">
          ${lilithImages.map((img, i) => `
            <div class="lilith-card stagger-${Math.min(i + 1, 7)}">
              <img
                src="/img/lilith/${img}"
                alt="Lilith artwork ${i + 1}"
                data-lightbox="/img/lilith/${img}"
                loading="lazy"
                ${img === 'lilith01.jpg' ? 'style="object-position: 90% center;"' : ''}
              />
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Alternative Art Styles -->
      <div class="about-section">
        <h2 class="about-section-title reveal"><i data-lucide="drama"></i> Alternative Art Styles</h2>
        <p class="page-desc reveal" style="text-align: center; margin-bottom: 2rem;">
          Lilith được vẽ lại theo phong cách của các tác phẩm nổi tiếng
        </p>
        <div class="alt-art-grid">
          ${altArt.map((art, i) => `
            <div class="alt-art-card stagger-${Math.min(i + 1, 7)}">
              <img
                src="/img/lilith_alternative_style/${art.file}"
                alt="${art.label}"
                data-lightbox="/img/lilith_alternative_style/${art.file}"
                loading="lazy"
              />
              <div class="alt-art-label">${art.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
