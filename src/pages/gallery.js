import { supabase } from '../supabase.js';

// ===== CẤU HÌNH ẢNH MẶC ĐỊNH =====
const DEFAULT_IMAGES = {
  normal: [
    'normal01.jpg', 'normal02.jpg', 'normal03.jpg',
    'normal04.jpg', 'normal05.jpg', 'normal06.jpg',
    'normal07.jpg', 'normal08.jpg', 'normal09.jpg',
  ],
  chibi: [],
  chibiych: [
    'chibi01.jpg', 'chibi02.jpg', 'chibi03.jpg',
    'chibi04.jpg', 'chibi05.jpg', 'chibi06.jpg',
    'chibi07.jpg', 'chibi08.jpg', 'chibi09.jpg',
  ],
  anime: [],
};

const FOLDER_MAP = {
  normal: 'Normal',
  chibi: 'ChibiNew',
  chibiych: 'Chibi',
  anime: 'AnimeStyle',
};

const SUPABASE_KEYS = {
  normal: 'gallery_images_normal',
  chibi: 'gallery_images_chibi_new',
  chibiych: 'gallery_images_chibi',
  anime: 'gallery_images_anime',
};

const shiftDown = ['normal03.jpg', 'normal06.jpg', 'normal08.jpg', 'normal09.jpg'];

// Cache để tránh gọi Supabase lại mỗi lần render
let cachedImages = null;
let cachedOverrides = null;

function buildGrid(images, folder, category, isFirst, overrides) {
  if (images.length === 0) {
    return `
      <div class="gallery-grid gallery-grid-section" data-category="${category}" style="${!isFirst ? 'display:none' : ''}">
        <p class="gallery-empty">Chưa có ảnh nào trong mục này.</p>
      </div>
    `;
  }
  return `
    <div class="gallery-grid gallery-grid-section" data-category="${category}" style="${!isFirst ? 'display:none' : ''}">
      ${images.map((name, i) => {
        const isCustom = name.startsWith('custom_');
        const originalSrc = isCustom ? name : `/img/Sample/${folder}/${name}`;
        const displaySrc = isCustom
          ? (overrides[`img_${name}`] || '')
          : (overrides[`img_${originalSrc}`] || originalSrc);
        const savedPos = overrides[`pos_${originalSrc}`] || 'center center';
        const shiftStyle = shiftDown.includes(name) ? 'object-position: center 20%;' : `object-position: ${savedPos};`;

        if (isCustom && !displaySrc) return '';

        return `
          <div class="gallery-item stagger-${Math.min(i + 1, 7)}">
            <img
              src="${displaySrc}"
              alt="${category} artwork ${i + 1}"
              data-lightbox="${displaySrc}"
              loading="lazy"
              style="${shiftStyle}"
            />
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildGalleryHTML(normalImages, chibiImages, chibiYchImages, animeImages, overrides) {
  return `
    <section class="gallery-page">
      <div class="page-header reveal">
        <h1 class="page-title">
          <span class="page-title-accent"><img src="/img/concept/logo.png" alt="" class="title-logo" /></span> Gallery
        </h1>
        <p class="page-desc">Tuyển tập các tác phẩm đã thực hiện</p>
      </div>

      <div class="gallery-tabs reveal">
        <button class="gallery-tab active" data-category="normal"><i data-lucide="palette"></i> Normal</button>
        <button class="gallery-tab" data-category="chibi"><i data-lucide="star"></i> Chibi</button>
        <button class="gallery-tab" data-category="chibiych"><i data-lucide="sparkles"></i> Chibi YCH</button>
        <button class="gallery-tab" data-category="anime"><i data-lucide="drama"></i> Anime Style</button>
      </div>

      ${buildGrid(normalImages, 'Normal', 'normal', true, overrides)}
      ${buildGrid(chibiImages, 'ChibiNew', 'chibi', false, overrides)}
      ${buildGrid(chibiYchImages, 'Chibi', 'chibiych', false, overrides)}
      ${buildGrid(animeImages, 'AnimeStyle', 'anime', false, overrides)}
    </section>
  `;
}

// Render đồng bộ với ảnh mặc định (hoặc cache) — KHÔNG giật
export function renderGallery() {
  // Nếu có cache, dùng cache ngay
  if (cachedImages && cachedOverrides) {
    return buildGalleryHTML(
      cachedImages.normal, cachedImages.chibi, cachedImages.chibiych, cachedImages.anime, cachedOverrides
    );
  }

  // Lần đầu: render ảnh mặc định ngay, async load Supabase cập nhật sau
  const html = buildGalleryHTML(
    DEFAULT_IMAGES.normal, DEFAULT_IMAGES.chibi, DEFAULT_IMAGES.chibiych, DEFAULT_IMAGES.anime, {}
  );

  // Load Supabase data ở background, cập nhật nếu có thay đổi
  loadSupabaseData();

  return html;
}

async function loadSupabaseData() {
  try {
    const [normalData, chibiData, chibiYchData, animeData, overridesData] = await Promise.all([
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.normal).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.chibi).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.chibiych).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.anime).maybeSingle(),
      supabase.from('admin_settings').select('key, value').or('key.like.img_%,key.like.pos_%'),
    ]);

    const normal = normalData.data?.value ? JSON.parse(normalData.data.value) : DEFAULT_IMAGES.normal;
    const chibi = chibiData.data?.value ? JSON.parse(chibiData.data.value) : DEFAULT_IMAGES.chibi;
    const chibiych = chibiYchData.data?.value ? JSON.parse(chibiYchData.data.value) : DEFAULT_IMAGES.chibiych;
    const anime = animeData.data?.value ? JSON.parse(animeData.data.value) : DEFAULT_IMAGES.anime;

    const overrides = {};
    if (overridesData.data) overridesData.data.forEach(s => { overrides[s.key] = s.value; });

    cachedImages = { normal, chibi, chibiych, anime };
    cachedOverrides = overrides;

    // Cập nhật từng grid có dữ liệu khác defaults
    const updates = [
      { category: 'normal', images: normal, folder: 'Normal', defaults: DEFAULT_IMAGES.normal },
      { category: 'chibi', images: chibi, folder: 'ChibiNew', defaults: DEFAULT_IMAGES.chibi },
      { category: 'chibiych', images: chibiych, folder: 'Chibi', defaults: DEFAULT_IMAGES.chibiych },
      { category: 'anime', images: anime, folder: 'AnimeStyle', defaults: DEFAULT_IMAGES.anime },
    ];

    for (const { category, images, folder, defaults } of updates) {
      const hasChanges = JSON.stringify(images) !== JSON.stringify(defaults) || Object.keys(overrides).length > 0;
      if (!hasChanges) continue;

      const gridEl = document.querySelector(`.gallery-grid-section[data-category="${category}"]`);
      if (!gridEl) continue;

      const isVisible = gridEl.style.display !== 'none';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = buildGrid(images, folder, category, true, overrides);
      const newGrid = tempDiv.firstElementChild;
      if (newGrid) {
        newGrid.style.display = isVisible ? '' : 'none';
        gridEl.replaceWith(newGrid);
      }
    }
  } catch (e) {
    // Supabase lỗi → giữ nguyên ảnh mặc định
  }
}
