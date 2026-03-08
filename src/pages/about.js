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
        <p class="page-desc">Xin chào, tớ là Lilith Ylliz!</p>
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
          <h2>Lilith Ylliz <i data-lucide="sparkles"></i></h2>

          <div class="about-info-grid">
            <div class="about-info-item">
              <span class="info-label"><i data-lucide="paw-print"></i> Chủng loài</span>
              <span class="info-value">Hồ ly — Yêu thú</span>
            </div>
            <div class="about-info-item">
              <span class="info-label"><i data-lucide="hourglass"></i> Tuổi</span>
              <span class="info-value">400 tuổi</span>
            </div>
            <div class="about-info-item">
              <span class="info-label"><i data-lucide="cake"></i> Ngày sinh</span>
              <span class="info-value">27/02</span>
            </div>
            <div class="about-info-item">
              <span class="info-label"><i data-lucide="heart"></i> Giới tính</span>
              <span class="info-value">Nữ</span>
            </div>
          </div>

          <div class="about-personality">
            <h3><i data-lucide="flame"></i> Tính cách</h3>
            <div class="personality-tags">
              <span class="personality-tag">Ham vui</span>
              <span class="personality-tag">Nhát gan</span>
              <span class="personality-tag">Tốt bụng</span>
              <span class="personality-tag">Thích bày trò</span>
              <span class="personality-tag">Hay tò mò</span>
              <span class="personality-tag">Thích điều mới</span>
              <span class="personality-tag">Thích du ngoạn</span>
            </div>
          </div>

          <a href="https://www.facebook.com/profile.php?id=61580142310861" class="btn btn-primary about-contact-btn" target="_blank" rel="noopener noreferrer">
            <i data-lucide="message-circle"></i> Liên hệ qua Facebook
          </a>
        </div>
      </div>

      <!-- Backstory -->
      <div class="about-section">
        <h2 class="about-section-title reveal"><i data-lucide="book-open"></i> Câu chuyện của Lilith Ylliz</h2>
        <div class="backstory-container reveal">
          <div class="backstory-chapter">
            <div class="chapter-marker">
              <span class="chapter-icon"><i data-lucide="trees"></i></span>
              <span class="chapter-line"></span>
            </div>
            <div class="chapter-content">
              <h3>Khu rừng phía Nam</h3>
              <p>
                Lilith Ylliz được sinh ra trong một khu rừng phía Nam lục địa — một nơi nhìn từ ngoài vào chẳng có gì đặc biệt, 
                nhưng đó vừa là nhà, vừa là một phần đẹp đẽ từng sống động trước mắt nàng. 
                Mọi người trong rừng đều cảnh báo nàng về sự nguy hiểm phía bên ngoài khu rừng, 
                nhưng với tính hiếu kỳ bẩm sinh, một đêm nọ nàng quyết định lén rời khỏi rừng 
                để ngắm nhìn phía bên ngoài thế giới.
              </p>
            </div>
          </div>
          <div class="backstory-chapter">
            <div class="chapter-marker">
              <span class="chapter-icon"><i data-lucide="flame"></i></span>
              <span class="chapter-line"></span>
            </div>
            <div class="chapter-content">
              <h3>Biển lửa</h3>
              <p>
                Đến khi trở lại nơi nàng từng gọi là nhà, giờ đang nằm gọn trong biển lửa rực đỏ. 
                Ngọn lửa lấy đi hầu như là tất cả của nàng, nhưng vẫn không thể trở thành ngọn lửa oán hận 
                mà cướp đi bản tính tốt bụng của Lilith Ylliz.
              </p>
            </div>
          </div>
          <div class="backstory-chapter">
            <div class="chapter-marker">
              <span class="chapter-icon"><i data-lucide="sparkles"></i></span>
              <span class="chapter-line"></span>
            </div>
            <div class="chapter-content">
              <h3>Thiếu nữ Yêu hồ</h3>
              <p>
                Nhiều năm sau, cô bé hồ ly năm đó giờ đã là một thiếu nữ Yêu hồ. 
                Nàng vẫn như vậy — vẫn giữ được bản chất của mình, không tranh đoạt, 
                không tìm kiếm sức mạnh để báo thù mà chỉ tận hưởng, khám phá vẻ đẹp của thế giới, 
                sống cuộc đời tự do tự tại.
              </p>
            </div>
          </div>
          <div class="backstory-chapter">
            <div class="chapter-marker">
              <span class="chapter-icon"><i data-lucide="moon"></i></span>
            </div>
            <div class="chapter-content">
              <h3>Người đưa tiễn dịu dàng</h3>
              <p>
                Trên hành trình trăm năm của mình, nàng chứng kiến vô số sinh mệnh mất đi ngay trước mắt 
                nên đã chọn sử dụng sức mạnh của mình để trở thành người đưa tiễn dịu dàng nhất. 
                Khi một ngọn lửa sinh mệnh sắp vụt tắt, nàng sẽ đến bên cạnh, nhẹ nhàng thu nhận 
                chút sinh khí ít ỏi cuối cùng và đổi lại — nàng dùng yêu lực dệt ra Mộng Cảnh đẹp đẽ 
                mà kẻ sắp ra đi muốn thấy nhất, để giúp họ rời đi trong sự yên bình. 
                Đó cũng là sự trao đổi công bằng và nhân từ nhất, xuất phát từ tình yêu nàng dành cho thế giới này.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Lilith Gallery -->
      <div class="about-section">
        <h2 class="about-section-title reveal"><img src="/img/concept/logo.png" alt="" class="section-logo" /> Lilith Ylliz Gallery</h2>
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
          Lilith Ylliz được vẽ lại theo phong cách của các tác phẩm nổi tiếng
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
