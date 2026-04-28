import { supabase } from '../supabase.js';

// ===== Không dùng ảnh local mặc định — load 100% từ Supabase =====

const FOLDER_MAP = {
  normal: 'Normal',
  chibi: 'ChibiNew',
  chibiych: 'Chibi',
};

const SUPABASE_KEYS = {
  normal: 'gallery_images_normal',
  chibi: 'gallery_images_chibi_new',
  chibiych: 'gallery_images_chibi',
};

const shiftDown = ['normal03.jpg', 'normal06.jpg', 'normal08.jpg', 'normal09.jpg'];

// Cache
let cachedImages = null;
let cachedOverrides = null;

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




function buildGalleryHTML(normalImages, chibiImages, chibiYchImages, overrides) {
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
      </div>

      ${buildGrid(normalImages, 'Normal', 'normal', true, overrides)}
      ${buildGrid(chibiImages, 'ChibiNew', 'chibi', false, overrides)}
      ${buildGrid(chibiYchImages, 'Chibi', 'chibiych', false, overrides)}
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
    </section>
  `;
}

// Render: nếu có cache → render ngay, nếu không → skeleton + load từ DB
export function renderGallery() {
  if (cachedImages && cachedOverrides) {
    return buildGalleryHTML(
      cachedImages.normal, cachedImages.chibi, cachedImages.chibiych,
      cachedOverrides
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

// === HELPER: Parse raw DB data and update DOM ===
function renderGalleryFromData(allData) {
  let normal = [], chibi = [], chibiych = [];
  let overrides = {};

  allData.forEach((row) => {
    const { key, value } = row;
    try {
      if (key === SUPABASE_KEYS.normal) normal = JSON.parse(value) || [];
      else if (key === SUPABASE_KEYS.chibi) chibi = JSON.parse(value) || [];
      else if (key === SUPABASE_KEYS.chibiych) chibiych = JSON.parse(value) || [];
      else if (key.startsWith('img_') || key.startsWith('pos_')) {
        overrides[key] = value;
      }
    } catch (e) { /* skip parse errors */ }
  });

  cachedImages = { normal, chibi, chibiych };
  cachedOverrides = overrides;

  // Replace skeleton/old grids with real data
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


}

// === HELPER: Fetch full gallery payload from Supabase ===
async function fetchGalleryPayload() {
  // Production: use Vercel Edge cached API route
  if (import.meta.env.PROD) {
    const res = await fetch('/api/gallery-data');
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json(); // { version, data }
  }

  // Dev: direct Supabase queries (parallel)
  const keysToFetch = [
    SUPABASE_KEYS.normal,
    SUPABASE_KEYS.chibi,
    SUPABASE_KEYS.chibiych
  ].join(',');

  const [vRes, dRes] = await Promise.all([
    supabase.from('admin_settings').select('value').eq('key', 'gallery_version').maybeSingle(),
    supabase.from('admin_settings').select('key, value')
      .or(`key.in.(${keysToFetch}),key.like.img_%,key.like.pos_%`)
  ]);

  if (dRes.error) throw dRes.error;
  return { version: vRes.data?.value || '0', data: dRes.data };
}

// === MAIN: Stale-While-Revalidate loading strategy ===
async function loadSupabaseData() {
  try {
    // Step 1: Try IndexedDB cache first → instant render for returning visitors
    const cachedData = await idbGet('gallery_data');

    if (cachedData) {
      console.log('[gallery] ⚡ Instant render from IndexedDB cache');
      renderGalleryFromData(cachedData);

      // Step 2: Background revalidation — check version, update cache silently
      (async () => {
        try {
          const result = await fetchGalleryPayload();
          const serverVersion = result.version;
          const localVersion = await idbGet('gallery_version');

          if (serverVersion !== localVersion) {
            console.log('[gallery] Cache stale — updating in background...');
            await idbSet('gallery_data', result.data);
            await idbSet('gallery_version', serverVersion);
            console.log('[gallery] ✓ Background cache updated for next visit');
          } else {
            console.log('[gallery] ✓ Cache is fresh');
          }
        } catch (e) {
          console.warn('[gallery] Background revalidation failed:', e);
        }
      })();
      return;
    }

    // Step 3: No cache (first visit) — must fetch
    console.log('[gallery] First visit — fetching from Supabase...');

    const result = await fetchGalleryPayload();

    if (result.data) {
      await idbSet('gallery_data', result.data);
      await idbSet('gallery_version', result.version);
      renderGalleryFromData(result.data);
    }
  } catch (e) {
    console.error('[gallery] loadSupabaseData error:', e);
    const gridEl = document.querySelector('.gallery-grid-section[data-category="normal"]');
    if (gridEl) {
      gridEl.innerHTML = '<p class="gallery-empty">Không thể tải ảnh. Vui lòng thử lại sau.</p>';
    }
  }
}


