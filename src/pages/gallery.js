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

// Quản lý Anime Subcategories Carousel
window.animeGallery = {
  currentIdx: 0,
  totalCats: 0,
  init(total) {
    this.totalCats = total;
    this.currentIdx = 0;
  },
  prev() {
    if (this.totalCats <= 1) return;
    this.currentIdx = (this.currentIdx - 1 + this.totalCats) % this.totalCats;
    this.update();
  },
  next() {
    if (this.totalCats <= 1) return;
    this.currentIdx = (this.currentIdx + 1) % this.totalCats;
    this.update();
  },
  select(idx) {
    this.currentIdx = idx;
    this.update();
    this.toggleDropdown(false);
  },
  toggleDropdown(force) {
    const dropdown = document.querySelector('.anime-carousel-dropdown');
    const display = document.querySelector('.anime-carousel-display');
    if (!dropdown) return;
    if (typeof force === 'boolean') {
      dropdown.classList.toggle('show', force);
      if (display) display.classList.toggle('open', force);
    } else {
      dropdown.classList.toggle('show');
      if (display) display.classList.toggle('open');
    }
  },
  update() {
    // Hide all grids
    document.querySelectorAll('.anime-sub-grid').forEach(g => {
      g.style.display = 'none';
      g.classList.remove('active-grid');
    });
    
    // Deactivate all dropdown items
    document.querySelectorAll('.anime-dropdown-item').forEach(i => i.classList.remove('active'));
    
    // Show current grids (all instances)
    const targetGrids = document.querySelectorAll(`.anime-sub-grid[data-index="${this.currentIdx}"]`);
    targetGrids.forEach(targetGrid => {
      targetGrid.style.display = '';
      targetGrid.classList.add('active-grid');
      targetGrid.querySelectorAll('.gallery-item').forEach((item, i) => {
        item.classList.remove('visible');
        setTimeout(() => item.classList.add('visible'), i * 80);
      });
    });
    
    // Update label text for ALL instances of the carousel on screen
    const activeItems = document.querySelectorAll(`.anime-dropdown-item[data-index="${this.currentIdx}"]`);
    const labels = document.querySelectorAll('#current-anime-subcat-name, .anime-carousel-display span:first-child');
    
    if (activeItems.length > 0) {
      const text = activeItems[0].textContent.trim();
      
      activeItems.forEach(item => item.classList.add('active'));
      
      labels.forEach(label => {
        label.textContent = text;
      });
    }
  }
};

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.anime-carousel-display');
  if (!trigger && window.animeGallery) {
    window.animeGallery.toggleDropdown(false);
  }
});

function buildAnimeSection(subcategories, subImages, overrides, isFirst) {
  const hasSubcats = subcategories && subcategories.length > 0;

  if (!hasSubcats) {
    return `
      <div class="anime-section-wrapper gallery-grid-section" data-category="anime" style="${!isFirst ? 'display:none' : ''}">
        <p class="gallery-empty">Chưa có mục nào trong Anime Style.</p>
      </div>
    `;
  }

  // Khởi tạo state cho JS
  window.animeGallery.totalCats = subcategories.length;
  window.animeGallery.currentIdx = 0;

  const subTabs = `
    <div class="anime-carousel-wrapper">
      <button class="anime-carousel-btn prev-btn" onclick="animeGallery.prev()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      
      <div class="anime-carousel-display" onclick="animeGallery.toggleDropdown()">
        <span id="current-anime-subcat-name">${subcategories[0].name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
        
        <div class="anime-carousel-dropdown">
          ${subcategories.map((sub, i) => `
            <div class="anime-dropdown-item ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="animeGallery.select(${i}); event.stopPropagation();">
              ${sub.name}
            </div>
          `).join('')}
        </div>
      </div>
      
      <button class="anime-carousel-btn next-btn" onclick="animeGallery.next()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>
  `;

  const subGrids = subcategories.map((sub, i) => {
    const imgs = subImages[sub.id] || [];
    if (imgs.length === 0) {
      return `
        <div class="gallery-grid anime-sub-grid" data-index="${i}" data-sub-id="${sub.id}" style="${i !== 0 ? 'display:none' : ''}">
          <p class="gallery-empty">Chưa có ảnh nào trong mục này.</p>
        </div>
      `;
    }
    return `
      <div class="gallery-grid anime-sub-grid" data-index="${i}" data-sub-id="${sub.id}" style="${i !== 0 ? 'display:none' : ''}">
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

// ===== IDB CACHE WRAPPER =====
const IDB_NAME = 'LilithGalleryDB';
const IDB_VERSION = 1;
const STORE_NAME = 'gallery_cache';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return null; }
}

async function idbSet(key, val) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {}
}

async function loadSupabaseData() {
  try {
    // 1. Lấy version hiện tại từ Supabase (rất nhẹ, <50ms)
    const { data: versionData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'gallery_version')
      .maybeSingle();
    
    const serverVersion = versionData?.value || '0';
    const localVersion = await idbGet('gallery_version');
    
    let allData = null;

    // 2. Kiểm tra Cache
    if (serverVersion === localVersion) {
      // Version khớp -> Load siêu tốc từ IndexedDB Local (~10ms)
      console.log('[gallery] Version match. Loading from Local IndexedDB Cache...');
      allData = await idbGet('gallery_data');
    }

    // 3. Nếu chưa có cache hoặc version khác, fetch toàn bộ từ DB
    if (!allData) {
      console.log('[gallery] Fetching full 20MB+ payload from Supabase...');
      const keysToFetch = [
        SUPABASE_KEYS.normal,
        SUPABASE_KEYS.chibi,
        SUPABASE_KEYS.chibiych,
        SUPABASE_KEYS.anime,
        'anime_subcategories'
      ].join(',');

      const { data: dbData, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .or(`key.in.(${keysToFetch}),key.like.img_%,key.like.pos_%,key.like.gallery_images_anime_%`);

      if (error) throw error;
      allData = dbData;

      // Lưu Cache
      await idbSet('gallery_data', allData);
      await idbSet('gallery_version', serverVersion);
    }

    let normal = [], chibi = [], chibiych = [], anime = [];
    let overrides = {};
    let animeSubcategories = [];
    let animeSubImages = {};

    // Phân loại dữ liệu 1 lần duyệt (O(N))
    allData.forEach((row) => {
      const { key, value } = row;
      try {
        if (key === SUPABASE_KEYS.normal) normal = JSON.parse(value) || [];
        else if (key === SUPABASE_KEYS.chibi) chibi = JSON.parse(value) || [];
        else if (key === SUPABASE_KEYS.chibiych) chibiych = JSON.parse(value) || [];
        else if (key === SUPABASE_KEYS.anime) anime = JSON.parse(value) || [];
        else if (key === 'anime_subcategories') animeSubcategories = JSON.parse(value) || [];
        else if (key.startsWith('gallery_images_anime_sub_')) {
          const subId = key.replace('gallery_images_anime_', '');
          animeSubImages[subId] = JSON.parse(value) || [];
        }
        else if (key.startsWith('img_') || key.startsWith('pos_')) {
          overrides[key] = value;
        }
      } catch (e) {
        // Bỏ qua lỗi parse JSON cục bộ
      }
    });

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
    // Hiện thông báo lỗi thay vì skeleton trống trơn
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
