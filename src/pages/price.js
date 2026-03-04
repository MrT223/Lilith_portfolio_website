export function renderPrice() {
  return `
    <section class="price-page">
      <div class="page-header reveal">
        <h1 class="page-title">
          <span class="page-title-accent"><img src="/img/concept/logo.png" alt="" class="title-logo" /></span> Bảng Giá & Điều Khoản
        </h1>
        <p class="page-desc">Commission pricing & terms of service</p>
      </div>

      <!-- PRICE SECTION -->
      <div class="price-section">
        <!-- Normal Price Table -->
        <div class="price-card">
          <h2 class="price-card-title"><i data-lucide="palette"></i> Normal</h2>
          <table class="price-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Sketch</th>
                <th>Line</th>
                <th>Full</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Headshot</td>
                <td>85.000₫</td>
                <td>120.000₫</td>
                <td>280.000₫</td>
              </tr>
              <tr>
                <td>Chest-up</td>
                <td>130.000₫</td>
                <td>170.000₫</td>
                <td>350.000₫</td>
              </tr>
              <tr>
                <td>Half-body</td>
                <td>165.000₫</td>
                <td>230.000₫</td>
                <td>480.000₫</td>
              </tr>
              <tr>
                <td>Knee-up</td>
                <td>200.000₫</td>
                <td>300.000₫</td>
                <td>600.000₫</td>
              </tr>
              <tr>
                <td>Full-body</td>
                <td>240.000₫</td>
                <td>370.000₫</td>
                <td>750.000₫</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Chibi Price Table -->
        <div class="price-card">
          <h2 class="price-card-title"><i data-lucide="star"></i> Chibi</h2>
          <table class="price-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Sketch</th>
                <th>Line</th>
                <th>Full</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Headshot</td>
                <td>80.000₫</td>
                <td>120.000₫</td>
                <td>180.000₫</td>
              </tr>
              <tr>
                <td>Half-body</td>
                <td>120.000₫</td>
                <td>170.000₫</td>
                <td>300.000₫</td>
              </tr>
              <tr>
                <td>Full-body</td>
                <td>150.000₫</td>
                <td>250.000₫</td>
                <td>500.000₫</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Emote / Chibi YCH -->
        <div class="price-card">
          <h2 class="price-card-title"><i data-lucide="sparkles"></i> Emote & Chibi YCH</h2>
          <table class="price-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Giá / 1</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Emote</td>
                <td>50.000₫</td>
                <td>×2 theo số lượng</td>
              </tr>
              <tr>
                <td>Chibi YCH</td>
                <td>60.000₫</td>
                <td>×2 theo số lượng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ALTERNATIVE STYLE PRICE -->
      <h2 class="page-title reveal" style="margin-top: 3rem; margin-bottom: 1.5rem;">
        <span class="page-title-accent"><img src="/img/concept/logo.png" alt="" class="title-logo" /></span> Anime-Manga Style
      </h2>
      <div class="price-section">
        <!-- Alt Normal -->
        <div class="price-card">
          <h2 class="price-card-title"><i data-lucide="palette"></i> Normal</h2>
          <table class="price-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Sketch</th>
                <th>Line</th>
                <th>Full</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Head</td>
                <td>70.000₫</td>
                <td>100.000₫</td>
                <td>150.000₫</td>
              </tr>
              <tr>
                <td>Chest-up</td>
                <td>110.000₫</td>
                <td>140.000₫</td>
                <td>210.000₫</td>
              </tr>
              <tr>
                <td>Half-body</td>
                <td>150.000₫</td>
                <td>200.000₫</td>
                <td>270.000₫</td>
              </tr>
              <tr>
                <td>Knee-up</td>
                <td>180.000₫</td>
                <td>260.000₫</td>
                <td>350.000₫</td>
              </tr>
              <tr>
                <td>Full-body</td>
                <td>230.000₫</td>
                <td>300.000₫</td>
                <td>470.000₫</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Alt Manga -->
        <div class="price-card">
          <h2 class="price-card-title"><i data-lucide="book-open"></i> Manga</h2>
          <table class="price-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Line</th>
                <th>Inking</th>
                <th>Color</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Head</td>
                <td>90.000₫</td>
                <td>130.000₫</td>
                <td>150.000₫</td>
              </tr>
              <tr>
                <td>Chest-up</td>
                <td>120.000₫</td>
                <td>150.000₫</td>
                <td>200.000₫</td>
              </tr>
              <tr>
                <td>Half-body</td>
                <td>160.000₫</td>
                <td>200.000₫</td>
                <td>250.000₫</td>
              </tr>
              <tr>
                <td>Knee-up</td>
                <td>190.000₫</td>
                <td>250.000₫</td>
                <td>300.000₫</td>
              </tr>
              <tr>
                <td>Full-body</td>
                <td>240.000₫</td>
                <td>310.000₫</td>
                <td>400.000₫</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Alt Chibi -->
        <div class="price-card">
          <h2 class="price-card-title"><i data-lucide="star"></i> Chibi</h2>
          <table class="price-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Sketch</th>
                <th>Line</th>
                <th>Color</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Full-body</td>
                <td>100.000₫</td>
                <td>150.000₫</td>
                <td>200.000₫</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TERMS OF SERVICE -->
      <div class="tos-section">
        <h2 class="page-title reveal" style="margin-bottom: 1.5rem;">
          <span class="page-title-accent"><img src="/img/concept/logo.png" alt="" class="title-logo" /></span> Điều Khoản Dịch Vụ
        </h2>

        <!-- I. Về Commission -->
        <div class="tos-card open">
          <div class="tos-header">
            <h3><i data-lucide="clipboard-list"></i> I. Về Commission</h3>
            <span class="tos-toggle"><i data-lucide="flower"></i></span>
          </div>
          <div class="tos-body">
            <div class="tos-body-inner">
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="credit-card"></i></span>
                <span>CỌC <strong>30%</strong> sau khi chốt slot, <strong>THANH TOÁN full</strong> tiền comm sau khi nhận được sketch.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="users"></i></span>
                <span>Thêm character: <strong>+100%</strong> giá gốc.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="landmark"></i></span>
                <span>Phương thức thanh toán: <strong>Bank / Momo / Card GAME</strong> (card game sẽ lấy thêm phí chiết xuất).</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="clock"></i></span>
                <span>Deadline từ <strong>1 tuần đến 3 tuần</strong>, có thể lâu hơn nếu xảy ra vấn đề phát sinh.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="zap"></i></span>
                <span>Có nhận <strong>rush</strong> nhưng giá sẽ tùy thuộc vào deadline mà khách đưa, dao động từ <strong>50.000 - 300.000₫</strong>.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="pencil"></i></span>
                <span>Phí sửa <strong>hoàn toàn miễn phí</strong> trước khi chốt sketch. Sửa sau sketch (line) và final sẽ <strong>tính thêm phí</strong> (hoặc không nếu lỗi nằm ở artist).</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="ban"></i></span>
                <span><strong>Không nhận vẽ:</strong> background, pose quá khó, người già, người thật, furry, mecha, mật độ chi tiết cao.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="gem"></i></span>
                <span>Phí details sẽ được thương lượng giữa artist và khách hàng.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="building"></i></span>
                <span>Phí thương mại: <strong>×3</strong> | Private: <strong>×2</strong>.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- II. Về Khách -->
        <div class="tos-card">
          <div class="tos-header">
            <h3><i data-lucide="user"></i> II. Về Khách Hàng</h3>
            <span class="tos-toggle"><i data-lucide="flower"></i></span>
          </div>
          <div class="tos-body">
            <div class="tos-body-inner">
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="file-text"></i></span>
                <span>Gửi đầy đủ brief. Có thể tả nhưng vui lòng kèm <strong>hình ảnh chi tiết</strong>.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="wallet"></i></span>
                <span>Được phép trì hoãn tiền comm trong <strong>2 tuần</strong>. Nếu quá 2 tuần, artist có quyền lên bài cân nhắc giao dịch.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="image"></i></span>
                <span>Được phép sửa trực tiếp lên tranh, <strong>không cần hỏi lại artist</strong>.</span>
              </div>
              <div class="tos-warning">
                <span><i data-lucide="alert-triangle"></i></span>
                <span><strong>NGHIÊM CẤM FEED CHO A.I</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- III. Về Artist -->
        <div class="tos-card">
          <div class="tos-header">
            <h3><i data-lucide="brush"></i> III. Về Artist</h3>
            <span class="tos-toggle"><i data-lucide="flower"></i></span>
          </div>
          <div class="tos-body">
            <div class="tos-body-inner">
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="camera"></i></span>
                <span>Được phép mang tranh CMS làm sample <strong>trừ khi</strong> khách đã trả phí <strong>private</strong>.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="shield-x"></i></span>
                <span>Có quyền <strong>từ chối</strong> nếu đơn quá khả năng.</span>
              </div>
              <div class="tos-item">
                <span class="tos-item-icon"><i data-lucide="rotate-ccw"></i></span>
                <span>CMS nếu quá deadline nhưng vẫn chưa có sketch, sẽ phải <strong>refund 100%</strong> tiền cọc cho khách.</span>
              </div>
            </div>
          </div>
        </div>

        <p class="reveal" style="text-align: center; margin-top: 2rem; color: var(--pink-500); font-weight: 600; font-size: 1.1rem;">
          <img src="/img/concept/logo.png" alt="" class="subtitle-logo" /> Vui lòng đọc thật kĩ trước khi đặt commission <img src="/img/concept/logo.png" alt="" class="subtitle-logo" />
        </p>
      </div>
    </section>
  `;
}
