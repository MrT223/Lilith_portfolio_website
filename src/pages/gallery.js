import { supabase } from '../supabase.js';

// ===== Không dùng ảnh local mặc định — load 100% từ Supabase =====

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

// Cache
let cachedImages = null;
let cachedOverrides = null;
let cachedAnimeSubcategories = null;
let cachedAnimeSubImages = {};

function buildGrid(images, folder, category, isFirst, overrides, extraAttrs = '') {
  if (images.length === 0) {
    return `
      <div class="gallery-grid gallery-grid-section" data-category="${category}" ${extraAttrs} style="${!isFirst ? 'display:none' : ''}">
        <p class="gallery-empty">Chưa có ảnh nào trong mục này.</p>
      </div>
    `;
  }
  return `
    <div class="gallery-grid gallery-grid-section" data-category="${category}" ${extraAttrs} style="${!isFirst ? 'display:none' : ''}">
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

function buildAnimeSection(subcategories, subImages, overrides, isFirst) {
  const hasSubcats = subcategories && subcategories.length > 0;

  if (!hasSubcats) {
    return `
      <div class="anime-section-wrapper gallery-grid-section" data-category="anime" style="${!isFirst ? 'display:none' : ''}">
        <p class="gallery-empty">Chưa có mục nào trong Anime Style.</p>
      </div>
    `;
  }

  const subTabs = `
    <div class="anime-sub-tabs-wrapper">
      <div class="anime-sub-tabs-label">
        <span class="anime-sub-tabs-icon">✦</span>
        <span>Thể loại</span>
      </div>
      <div class="anime-sub-tabs">
        ${subcategories.map((sub, i) => `
          <button class="anime-sub-tab ${i === 0 ? 'active' : ''}" data-sub-id="${sub.id}">
            <span class="anime-sub-tab-dot"></span>
            ${sub.name}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const subGrids = subcategories.map((sub, i) => {
    const imgs = subImages[sub.id] || [];
    if (imgs.length === 0) {
      return `
        <div class="gallery-grid anime-sub-grid" data-sub-id="${sub.id}" style="${i !== 0 ? 'display:none' : ''}">
          <p class="gallery-empty">Chưa có ảnh nào trong mục này.</p>
        </div>
      `;
    }
    return `
      <div class="gallery-grid anime-sub-grid" data-sub-id="${sub.id}" style="${i !== 0 ? 'display:none' : ''}">
        ${imgs.map((name, j) => {
          const isCustom = name.startsWith('custom_');
          const originalSrc = isCustom ? name : `/img/Sample/AnimeStyle/${name}`;
          const displaySrc = isCustom
            ? (overrides[`img_${name}`] || '')
            : (overrides[`img_${originalSrc}`] || originalSrc);
          const savedPos = overrides[`pos_${originalSrc}`] || 'center center';
          const shiftStyle = `object-position: ${savedPos};`;

          if (isCustom && !displaySrc) return '';

          return `
            <div class="gallery-item stagger-${Math.min(j + 1, 7)}">
              <img
                src="${displaySrc}"
                alt="anime artwork ${j + 1}"
                data-lightbox="${displaySrc}"
                loading="lazy"
                style="${shiftStyle}"
              />
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  return `
    <div class="anime-section-wrapper gallery-grid-section" data-category="anime" style="${!isFirst ? 'display:none' : ''}">
      ${subTabs}
      ${subGrids}
    </div>
  `;
}

function buildGalleryHTML(normalImages, chibiImages, chibiYchImages, animeImages, overrides, animeSubcategories, animeSubImages) {
  const hasSubcats = animeSubcategories && animeSubcategories.length > 0;

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
      ${hasSubcats
        ? buildAnimeSection(animeSubcategories, animeSubImages, overrides, false)
        : buildGrid(animeImages, 'AnimeStyle', 'anime', false, overrides)
      }
    </section>
  `;
}

// Loading skeleton HTML
function buildLoadingSkeleton() {
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

      <div class="gallery-grid gallery-grid-section" data-category="normal">
        ${Array.from({length: 6}, () => `
          <div class="gallery-item gallery-skeleton visible">
            <div class="skeleton-shimmer"></div>
          </div>
        `).join('')}
      </div>
      <div class="gallery-grid gallery-grid-section" data-category="chibi" style="display:none"></div>
      <div class="gallery-grid gallery-grid-section" data-category="chibiych" style="display:none"></div>
      <div class="gallery-grid gallery-grid-section" data-category="anime" style="display:none"></div>
    </section>
  `;
}

// Render: nếu có cache → render ngay, nếu không → skeleton + load từ DB
export function renderGallery() {
  if (cachedImages && cachedOverrides) {
    return buildGalleryHTML(
      cachedImages.normal, cachedImages.chibi, cachedImages.chibiych, cachedImages.anime,
      cachedOverrides,
      cachedAnimeSubcategories, cachedAnimeSubImages
    );
  }

  // Lần đầu: render skeleton, async load từ Supabase
  loadSupabaseData();
  return buildLoadingSkeleton();
}

async function loadSupabaseData() {
  try {
    const [normalData, chibiData, chibiYchData, animeData, overridesData, subcatData] = await Promise.all([
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.normal).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.chibi).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.chibiych).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', SUPABASE_KEYS.anime).maybeSingle(),
      supabase.from('admin_settings').select('key, value').or('key.like.img_%,key.like.pos_%'),
      supabase.from('admin_settings').select('value').eq('key', 'anime_subcategories').maybeSingle(),
    ]);

    const normal = normalData.data?.value ? JSON.parse(normalData.data.value) : [];
    const chibi = chibiData.data?.value ? JSON.parse(chibiData.data.value) : [];
    const chibiych = chibiYchData.data?.value ? JSON.parse(chibiYchData.data.value) : [];
    const anime = animeData.data?.value ? JSON.parse(animeData.data.value) : [];

    const overrides = {};
    if (overridesData.data) overridesData.data.forEach(s => { overrides[s.key] = s.value; });

    // Load anime subcategories
    let animeSubcategories = [];
    let animeSubImages = {};
    if (subcatData.data?.value) {
      try { animeSubcategories = JSON.parse(subcatData.data.value); } catch(e) { /* ignore */ }
    }

    // Load images for each subcategory
    if (animeSubcategories.length > 0) {
      const subImagePromises = animeSubcategories.map(sub =>
        supabase.from('admin_settings').select('value').eq('key', `gallery_images_anime_${sub.id}`).maybeSingle()
      );
      const subImageResults = await Promise.all(subImagePromises);
      subImageResults.forEach((result, i) => {
        const subId = animeSubcategories[i].id;
        if (result.data?.value) {
          try { animeSubImages[subId] = JSON.parse(result.data.value); } catch(e) { animeSubImages[subId] = []; }
        } else {
          animeSubImages[subId] = [];
        }
      });
    }

    cachedImages = { normal, chibi, chibiych, anime };
    cachedOverrides = overrides;
    cachedAnimeSubcategories = animeSubcategories;
    cachedAnimeSubImages = animeSubImages;

    // Thay thế tất cả grids bằng dữ liệu thật
    const categories = [
      { category: 'normal', images: normal, folder: 'Normal' },
      { category: 'chibi', images: chibi, folder: 'ChibiNew' },
      { category: 'chibiych', images: chibiych, folder: 'Chibi' },
    ];

    for (const { category, images, folder } of categories) {
      const gridEl = document.querySelector(`.gallery-grid-section[data-category="${category}"]`);
      if (!gridEl) continue;

      const isVisible = gridEl.style.display !== 'none';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = buildGrid(images, folder, category, true, overrides);
      const newGrid = tempDiv.firstElementChild;
      if (newGrid) {
        newGrid.style.display = isVisible ? '' : 'none';
        gridEl.replaceWith(newGrid);
        if (isVisible) {
          newGrid.querySelectorAll('.gallery-item').forEach((item, i) => {
            setTimeout(() => item.classList.add('visible'), i * 80);
          });
        }
      }
    }

    // Update anime section
    const animeEl = document.querySelector(`.gallery-grid-section[data-category="anime"]`);
    if (animeEl) {
      const isVisible = animeEl.style.display !== 'none';
      const tempDiv = document.createElement('div');
      if (animeSubcategories.length > 0) {
        tempDiv.innerHTML = buildAnimeSection(animeSubcategories, animeSubImages, overrides, true);
      } else {
        tempDiv.innerHTML = buildGrid(anime, 'AnimeStyle', 'anime', true, overrides);
      }
      const newEl = tempDiv.firstElementChild;
      if (newEl) {
        newEl.style.display = isVisible ? '' : 'none';
        animeEl.replaceWith(newEl);

        if (animeSubcategories.length > 0) {
          initAnimeSubTabs(newEl);
        }

        if (isVisible) {
          const activeGrid = newEl.querySelector('.anime-sub-grid:not([style*="display:none"]):not([style*="display: none"])') || newEl;
          activeGrid.querySelectorAll('.gallery-item').forEach((item, i) => {
            setTimeout(() => item.classList.add('visible'), i * 80);
          });
        }
      }
    }
  } catch (e) {
    console.error('[gallery] loadSupabaseData error:', e);
    // Hiện thông báo lỗi thay vì ảnh cũ
    const gridEl = document.querySelector('.gallery-grid-section[data-category="normal"]');
    if (gridEl) {
      gridEl.innerHTML = '<p class="gallery-empty">Không thể tải ảnh. Vui lòng thử lại sau.</p>';
    }
  }
}

export function initAnimeSubTabs(container) {
  if (!container) container = document.querySelector('.anime-section-wrapper');
  if (!container) return;

  container.querySelectorAll('.anime-sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.anime-sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const subId = tab.dataset.subId;

      container.querySelectorAll('.anime-sub-grid').forEach(grid => {
        if (grid.dataset.subId === subId) {
          grid.style.display = 'grid';
          grid.querySelectorAll('.gallery-item').forEach((item, i) => {
            item.classList.remove('visible');
            setTimeout(() => item.classList.add('visible'), i * 80);
          });
        } else {
          grid.style.display = 'none';
        }
      });
    });
  });
}
