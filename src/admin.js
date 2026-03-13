import { supabase } from './supabase.js';
import { createIcons, icons } from 'lucide';

const ADMIN_HASH = 'f817f67b76c9206025474f3cbdccb7cc5e3c04970c88d7ef4f56b1551e45548d';
const TIMEOUT_MS = 15 * 60 * 1000;

let adminMode = false;
let logoutTimer = null;
let adminPasswordHash = null;

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== SUPABASE HELPERS ====================
async function dbRead(key) {
  // Nếu admin panel đang mở và có cache, đọc cực nhanh từ RAM
  if (adminMode && adminCache[key] !== undefined) {
    return adminCache[key];
  }

  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value || null;
}

async function dbWrite(key, value) {
  const { data, error } = await supabase.rpc('admin_write', {
    pw_hash: adminPasswordHash,
    setting_key: key,
    setting_value: value
  });
  if (error) {
    console.error(`[dbWrite] error writing key "${key}":`, error);
    alert(`Lỗi lưu dữ liệu: ${error.message || 'Không xác định'}`);
  } else {
    // Cập nhật RAM cache ngay lập tức để admin panel không bao giờ cần load lại trang
    if (adminMode) {
      adminCache[key] = value;
    }
  }

  // Nếu là dữ liệu gallery, cập nhật version để xóa cache client
  if (!error && (key.includes('gallery_') || key.includes('img_') || key.includes('pos_') || key === 'anime_subcategories')) {
    supabase.rpc('admin_write', {
      pw_hash: adminPasswordHash,
      setting_key: 'gallery_version',
      setting_value: Date.now().toString()
    }).then(() => { /* silent update */ });
  }

  return data;
}

async function processAndUploadImageToStorage(file, fileName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1000;
        let w = img.width, h = img.height;
        if (w > maxW) { h = (maxW / w) * h; w = maxW; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        
        // Chuyển sang file Binary siêu nhẹ thay vì DataURL Base64 khổng lồ
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          
          const { data, error } = await supabase.storage
            .from('gallery')
            .upload(fileName, blob, { upsert: true, contentType: file.type || 'image/jpeg' });
            
          if (error) {
            console.error('[upload] Supabase Storage error:', error);
            console.warn('[upload] Kích hoạt Fallback: Trả về chuỗi Base64 dài vì Storage Bucket lỗi (Chưa tạo hoặc RLS chặn).');
            alert('Lỗi Upload lên Supabase: ' + (error.message || JSON.stringify(error)) + '\n\nWeb sẽ tạm thời tự động hạ cấp xuống lưu file Base64 cũ để không bị lỗi.');
            // Nếu lỗi bucket (vd: user chưa tạo), dùng lại code cũ (base64 string) để web không bị crash
            resolve(canvas.toDataURL('image/jpeg', 0.7));
            return;
          }
          
          // Lấy URL Public cực ngắn để lưu vào DB
          const { data: publicData } = supabase.storage
            .from('gallery')
            .getPublicUrl(fileName);
            
          resolve(publicData.publicUrl);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

// ==================== SECRET BUTTON ====================
export function initAdminSecret() {
  let clicks = 0;
  let timer = null;
  const blossom = document.querySelector('.footer-blossom');
  if (!blossom) return;

  blossom.style.cursor = 'pointer';
  blossom.addEventListener('click', (e) => {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    if (clicks >= 3) {
      clicks = 0;
      showPasswordModal();
    }
    timer = setTimeout(() => { clicks = 0; }, 1500);
  });
}

// ==================== PASSWORD MODAL ====================
function showPasswordModal() {
  if (document.getElementById('admin-pw-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'admin-pw-modal';
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-icon"><img src="/img/concept/logo.png" alt="" /></div>
      <h3>Admin Access</h3>
      <input type="password" id="admin-pw-input" placeholder="Nhập mật khẩu" autocomplete="off" />
      <div class="admin-modal-error" id="admin-pw-error"></div>
      <div class="admin-modal-btns">
        <button id="admin-pw-cancel" class="admin-btn admin-btn-ghost">Hủy</button>
        <button id="admin-pw-submit" class="admin-btn admin-btn-primary">Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));

  const input = document.getElementById('admin-pw-input');
  const error = document.getElementById('admin-pw-error');
  input.focus();

  const submit = async () => {
    const hash = await sha256(input.value);
    if (hash === ADMIN_HASH) {
      adminPasswordHash = hash;
      closeModal(modal);
      enterAdminMode();
    } else {
      error.textContent = 'Sai mật khẩu';
      input.value = '';
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
    }
  };

  document.getElementById('admin-pw-submit').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  document.getElementById('admin-pw-cancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
}

function closeModal(el) {
  el.classList.remove('active');
  setTimeout(() => el.remove(), 300);
}

// ==================== ADMIN MODE ====================
function enterAdminMode() {
  adminMode = true;
  resetLogoutTimer();
  showAdminPanel();
}

function exitAdminMode() {
  adminMode = false;
  adminPasswordHash = null;
  clearTimeout(logoutTimer);
  const panel = document.getElementById('admin-panel');
  if (panel) closeModal(panel);
}

function resetLogoutTimer() {
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(exitAdminMode, TIMEOUT_MS);
}

// ==================== ADMIN PANEL CACHE ====================
let adminCache = {};

async function loadAllAdminCache() {
  const { data } = await supabase
    .from('admin_settings')
    .select('key, value');
  adminCache = {};
  if (data) {
    data.forEach(row => { adminCache[row.key] = row.value; });
  }
}

// ==================== ADMIN PANEL ====================
async function showAdminPanel() {
  if (document.getElementById('admin-panel')) return;

  // Load all settings once to prevent N+1 queries when switching tabs
  await loadAllAdminCache();

  // Đọc từ cache thay vì dbRead để tăng tốc
  const cmsStatus = adminCache['cms_status'] || 'open';
  
  const panel = document.createElement('div');
  panel.id = 'admin-panel';
  panel.className = 'admin-modal-overlay';

  panel.innerHTML = `
    <div class="admin-panel-content">
      <div class="admin-panel-header">
        <h3><i data-lucide="settings"></i> Quản lý trang</h3>
        <button class="admin-close-btn" id="admin-close">&times;</button>
      </div>

      <div class="admin-panel-body">
        <div class="admin-section">
          <h4>Trạng thái Commission</h4>
          <div class="admin-cms-toggle">
            <button class="admin-btn ${cmsStatus === 'open' ? 'admin-btn-green active' : 'admin-btn-green'}" data-cms="open">
              <span class="cms-dot-lg"></span> OPEN
            </button>
            <button class="admin-btn ${cmsStatus === 'waitlist' ? 'admin-btn-yellow active' : 'admin-btn-yellow'}" data-cms="waitlist">
              <span class="cms-dot-lg"></span> NHẬN WL
            </button>
            <button class="admin-btn ${cmsStatus === 'close' ? 'admin-btn-red active' : 'admin-btn-red'}" data-cms="close">
              <span class="cms-dot-lg"></span> CLOSE
            </button>
          </div>
        </div>

        <div class="admin-section">
          <h4>Quản lý ảnh</h4>
          <p class="admin-hint">Chạm <i data-lucide="camera"></i> để thay ảnh. Chạm <i data-lucide="move"></i> để chỉnh vị trí focus. Chạm <i data-lucide="plus"></i> để thêm ảnh mới.</p>
          <div class="admin-img-tabs">
            <button class="admin-tab active" data-tab="gallery-normal">Normal</button>
            <button class="admin-tab" data-tab="gallery-chibi">Chibi</button>
            <button class="admin-tab" data-tab="gallery-chibi-ych">Chibi YCH</button>
            <button class="admin-tab" data-tab="gallery-anime">Anime Style</button>
            <button class="admin-tab" data-tab="lilith">Lilith</button>
            <button class="admin-tab" data-tab="alt">Alt Style</button>
            <button class="admin-tab" data-tab="main">Home/About</button>
          </div>
          <div class="admin-img-grid" id="admin-img-grid"></div>
        </div>
      </div>

      <div class="admin-panel-footer">
        <button class="admin-btn admin-btn-ghost" id="admin-logout">Đăng xuất</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('active'));
  createIcons({ icons });

  panel.querySelectorAll('[data-cms]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.cms;
      await dbWrite('cms_status', status);
      applyCmsStatus(status);
      panel.querySelectorAll('[data-cms]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      resetLogoutTimer();
    });
  });

  panel.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderImageGrid(tab.dataset.tab);
      resetLogoutTimer();
    });
  });

  document.getElementById('admin-close').addEventListener('click', () => closeModal(panel));
  document.getElementById('admin-logout').addEventListener('click', exitAdminMode);

  renderImageGrid('gallery-normal');
}

// ==================== IMAGE GRID ====================
// Categories that support adding/deleting images
const GALLERY_CATEGORIES = {
  'gallery-normal': { folder: 'Normal', supabaseKey: 'gallery_images_normal', basePath: '/img/Sample/Normal/' },
  'gallery-chibi': { folder: 'ChibiNew', supabaseKey: 'gallery_images_chibi_new', basePath: '/img/Sample/ChibiNew/' },
  'gallery-chibi-ych': { folder: 'Chibi', supabaseKey: 'gallery_images_chibi', basePath: '/img/Sample/Chibi/' },
  'gallery-anime': { folder: 'AnimeStyle', supabaseKey: 'gallery_images_anime', basePath: '/img/Sample/AnimeStyle/' },
  'lilith': { folder: 'lilith', supabaseKey: 'gallery_images_lilith', basePath: '/img/lilith/' },
  'alt': { folder: 'lilith_alternative_style', supabaseKey: 'gallery_images_alt', basePath: '/img/lilith_alternative_style/' },
};

const DEFAULT_IMAGES = {
  'gallery-normal': [],
  'gallery-chibi': [],
  'gallery-chibi-ych': [],
  'gallery-anime': [],
  'lilith': [],
  'alt': [],
};

const STATIC_IMAGE_MAP = {
  main: {
    images: ['/img/lilith/lilith_main.jpg']
  }
};

async function getGalleryImageList(category) {
  const cat = GALLERY_CATEGORIES[category];
  if (!cat) return [];
  const saved = await dbRead(cat.supabaseKey);
  if (saved) {
    try { return JSON.parse(saved); } catch(e) { /* fallback */ }
  }
  return DEFAULT_IMAGES[category] || [];
}

async function saveGalleryImageList(category, list) {
  const cat = GALLERY_CATEGORIES[category];
  if (!cat) return;
  await dbWrite(cat.supabaseKey, JSON.stringify(list));
}

async function renderImageGrid(tab) {
  const grid = document.getElementById('admin-img-grid');
  if (!grid) return;

  // Special handling for anime tab — show subcategory manager
  if (tab === 'gallery-anime') {
    await renderAnimeSubcategoryManager(grid);
    return;
  }

  grid.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1">Đang tải...</p>';

  // Đọc overrides từ RAM thay vì từ DB (siêu nhanh)
  const overrides = {};
  for (const key in adminCache) {
    if (key.startsWith('img_') || key.startsWith('pos_')) {
      overrides[key] = adminCache[key];
    }
  }

  const isGalleryTab = !!GALLERY_CATEGORIES[tab];
  let images;

  if (isGalleryTab) {
    const cat = GALLERY_CATEGORIES[tab];
    const imageList = await getGalleryImageList(tab);
    images = imageList.map(name => {
      const isCustom = name.startsWith('custom_');
      const src = isCustom ? name : `${cat.basePath}${name}`;
      return { src, name, isCustom };
    });
  } else {
    const data = STATIC_IMAGE_MAP[tab];
    if (!data) { grid.innerHTML = ''; return; }
    images = data.images.map(src => ({ src, name: src.split('/').pop(), isCustom: false }));
  }

  const cards = images.map(({ src, name, isCustom }) => {
    const savedSrc = overrides[`img_${src}`] || (isCustom ? overrides[`img_${src}`] || '' : src);
    const displaySrc = isCustom ? (overrides[`img_${name}`] || '') : savedSrc;
    const savedPos = overrides[`pos_${src}`] || 'center center';
    return `
      <div class="admin-img-card" data-original="${src}" data-name="${name}" data-custom="${isCustom}">
        <img src="${displaySrc || src}" style="object-position: ${savedPos};" />
        <div class="admin-img-actions">
          <button class="admin-img-btn admin-img-replace" title="Thay ảnh"><i data-lucide="camera"></i></button>
          <button class="admin-img-btn admin-img-position" title="Chỉnh vị trí"><i data-lucide="move"></i></button>
          ${isCustom ? '<button class="admin-img-btn admin-img-delete" title="Xóa ảnh"><i data-lucide="trash-2"></i></button>' : ''}
        </div>
        <div class="admin-img-name">${isCustom ? '<i data-lucide="sparkles"></i> ' + name.replace('custom_', '').slice(0,12) + '...' : name}</div>
      </div>
    `;
  }).join('');

  const addCard = isGalleryTab ? `
    <div class="admin-img-card admin-img-add" id="admin-add-img">
      <div class="admin-add-icon"><i data-lucide="plus"></i></div>
      <div class="admin-img-name">Thêm ảnh</div>
    </div>
  ` : '';

  grid.innerHTML = cards + addCard;
  createIcons({ icons });

  // Replace image handlers
  grid.querySelectorAll('.admin-img-replace').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      replaceImage(card.dataset.original, card);
    });
  });

  // Position editor handlers
  grid.querySelectorAll('.admin-img-position').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      openPositionEditor(card.dataset.original);
    });
  });

  // Delete handlers
  grid.querySelectorAll('.admin-img-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      const name = card.dataset.name;
      if (!confirm('Xóa ảnh này?')) return;
      await deleteGalleryImage(tab, name);
      renderImageGrid(tab);
      resetLogoutTimer();
    });
  });

  // Add image handler
  const addBtn = document.getElementById('admin-add-img');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addGalleryImage(tab);
    });
  }
}

// ==================== ANIME SUBCATEGORY MANAGER ====================
async function loadAnimeSubcategories() {
  try {
    const saved = await dbRead('anime_subcategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch(e) {
    console.error('[loadAnimeSubcategories] parse error:', e);
  }
  return [];
}

async function saveAnimeSubcategories(list) {
  const result = await dbWrite('anime_subcategories', JSON.stringify(list));
  console.log('[saveAnimeSubcategories] result:', result, 'list:', list);
  return result;
}

async function renderAnimeSubcategoryManager(grid) {
  grid.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1"><i data-lucide="loader" class="spin-icon"></i> Đang tải...</p>';
  createIcons({ icons });

  let subcategories;
  try {
    subcategories = await loadAnimeSubcategories();
  } catch (err) {
    console.error('[renderAnimeSubcategoryManager] load error:', err);
    grid.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1;color:red">Lỗi tải dữ liệu!</p>';
    return;
  }

  const emptyMsg = subcategories.length === 0
    ? `<div class="admin-subcat-empty">
        <i data-lucide="folder-plus" style="width:32px;height:32px;color:var(--pink-300);margin-bottom:0.5rem"></i>
        <p>Chưa có mục nào</p>
        <p style="font-size:0.8rem;color:var(--text-light)">Bấm nút <strong>+ Thêm mục</strong> để bắt đầu</p>
      </div>`
    : '';

  const subcatCards = subcategories.map((sub, i) => `
    <div class="admin-subcat-item" data-sub-id="${sub.id}">
      <div class="admin-subcat-info">
        <span class="admin-subcat-number">${i + 1}</span>
        <span class="admin-subcat-name">${sub.name}</span>
      </div>
      <div class="admin-subcat-actions">
        <button class="admin-img-btn admin-subcat-rename" title="Sửa tên"><i data-lucide="pencil"></i></button>
        <button class="admin-img-btn admin-subcat-delete" title="Xóa mục"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `).join('');

  const subtabs = subcategories.length > 0 ? `
    <div class="admin-anime-subtabs-section">
      <p class="admin-hint" style="margin:0 0 0.5rem 0;font-size:0.82rem">Chọn mục để quản lý ảnh:</p>
      <div class="admin-anime-subtabs">
        ${subcategories.map((sub, i) => `
          <button class="admin-tab admin-anime-sub-tab ${i === 0 ? 'active' : ''}" data-subtab="${sub.id}">
            <i data-lucide="image" style="width:12px;height:12px"></i> ${sub.name}
          </button>
        `).join('')}
      </div>
    </div>
  ` : '';

  const html = `
    <div class="admin-anime-manager" style="grid-column:1/-1">
      <div class="admin-anime-header">
        <div class="admin-anime-title-row">
          <i data-lucide="layers" style="width:18px;height:18px;color:var(--pink-400)"></i>
          <h4 style="margin:0;color:var(--pink-600);font-family:var(--font-display)">Quản lý mục Anime Style</h4>
          <span class="admin-subcat-count">${subcategories.length} mục</span>
        </div>
        <button class="admin-btn admin-btn-primary admin-add-subcat-btn" id="admin-add-subcat">
          <i data-lucide="plus" style="width:14px;height:14px"></i> Thêm mục
        </button>
      </div>

      ${emptyMsg}

      <div class="admin-subcat-list">
        ${subcatCards}
      </div>

      ${subtabs}
    </div>
  `;

  grid.innerHTML = html;

  // Image grid below subcategory manager
  if (subcategories.length > 0) {
    const imgGridWrap = document.createElement('div');
    imgGridWrap.id = 'admin-anime-sub-img-grid';
    imgGridWrap.style.cssText = 'grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.8rem;margin-top:0.5rem';
    grid.appendChild(imgGridWrap);

    try {
      const firstSub = subcategories[0];
      await renderAnimeSubImages(firstSub.id, imgGridWrap);
    } catch (err) {
      console.error('[renderAnimeSubcategoryManager] renderAnimeSubImages error:', err);
      imgGridWrap.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1;color:red">Lỗi tải ảnh</p>';
    }
  }

  createIcons({ icons });

  // === Add subcategory ===
  const addBtn = document.getElementById('admin-add-subcat');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const name = prompt('Nhập tên mục mới (ví dụ: Original, Fanart...):');
      if (!name || !name.trim()) return;

      // Show loading
      addBtn.disabled = true;
      addBtn.innerHTML = '<i data-lucide="loader" class="spin-icon" style="width:14px;height:14px"></i> Đang lưu...';
      createIcons({ icons });

      try {
        const subId = `sub_${Date.now()}`;
        subcategories.push({ id: subId, name: name.trim() });
        await saveAnimeSubcategories(subcategories);
        await renderAnimeSubcategoryManager(grid);
      } catch (err) {
        console.error('[addSubcategory] error:', err);
        alert('Lỗi khi thêm mục: ' + (err.message || 'Không xác định'));
        addBtn.disabled = false;
        addBtn.innerHTML = '<i data-lucide="plus" style="width:14px;height:14px"></i> Thêm mục';
        createIcons({ icons });
      }
      resetLogoutTimer();
    });
  }

  // === Rename subcategory ===
  grid.querySelectorAll('.admin-subcat-rename').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const item = btn.closest('.admin-subcat-item');
      const subId = item.dataset.subId;
      const sub = subcategories.find(s => s.id === subId);
      if (!sub) return;
      const newName = prompt('Nhập tên mới:', sub.name);
      if (!newName || !newName.trim() || newName.trim() === sub.name) return;

      try {
        sub.name = newName.trim();
        await saveAnimeSubcategories(subcategories);
        await renderAnimeSubcategoryManager(grid);
      } catch (err) {
        console.error('[renameSubcategory] error:', err);
        alert('Lỗi khi đổi tên: ' + (err.message || 'Không xác định'));
      }
      resetLogoutTimer();
    });
  });

  // === Delete subcategory ===
  grid.querySelectorAll('.admin-subcat-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const item = btn.closest('.admin-subcat-item');
      const subId = item.dataset.subId;
      const sub = subcategories.find(s => s.id === subId);
      if (!sub) return;
      if (!confirm(`Xóa mục "${sub.name}" và tất cả ảnh trong mục này?`)) return;

      try {
        // Delete images for this subcategory
        await dbWrite(`gallery_images_anime_${subId}`, '[]');
        const idx = subcategories.indexOf(sub);
        if (idx > -1) subcategories.splice(idx, 1);
        await saveAnimeSubcategories(subcategories);
        await renderAnimeSubcategoryManager(grid);
      } catch (err) {
        console.error('[deleteSubcategory] error:', err);
        alert('Lỗi khi xóa: ' + (err.message || 'Không xác định'));
      }
      resetLogoutTimer();
    });
  });

  // === Sub-tab switching ===
  grid.querySelectorAll('.admin-anime-sub-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      grid.querySelectorAll('.admin-anime-sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const subId = tab.dataset.subtab;
      const imgGridWrap = document.getElementById('admin-anime-sub-img-grid');
      if (imgGridWrap) {
        try {
          await renderAnimeSubImages(subId, imgGridWrap);
        } catch (err) {
          console.error('[subtab switch] error:', err);
          imgGridWrap.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1;color:red">Lỗi tải ảnh</p>';
        }
      }
      resetLogoutTimer();
    });
  });
}

async function renderAnimeSubImages(subId, container) {
  container.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1"><i data-lucide="loader" class="spin-icon"></i> Đang tải ảnh...</p>';
  createIcons({ icons });

  // Dynamic category key
  const catKey = `anime-sub-${subId}`;
  // Register dynamic category
  GALLERY_CATEGORIES[catKey] = {
    folder: 'AnimeStyle',
    supabaseKey: `gallery_images_anime_${subId}`,
    basePath: '/img/Sample/AnimeStyle/'
  };
  if (!DEFAULT_IMAGES[catKey]) DEFAULT_IMAGES[catKey] = [];

  // Đọc overrides từ RAM thay vì từ DB
  const overrides = {};
  for (const key in adminCache) {
    if (key.startsWith('img_') || key.startsWith('pos_')) {
      overrides[key] = adminCache[key];
    }
  }

  const imageList = await getGalleryImageList(catKey);
  const cat = GALLERY_CATEGORIES[catKey];

  const images = imageList.map(name => {
    const isCustom = name.startsWith('custom_');
    const src = isCustom ? name : `${cat.basePath}${name}`;
    return { src, name, isCustom };
  });

  const cards = images.map(({ src, name, isCustom }) => {
    const savedSrc = overrides[`img_${src}`] || (isCustom ? overrides[`img_${src}`] || '' : src);
    const displaySrc = isCustom ? (overrides[`img_${name}`] || '') : savedSrc;
    const savedPos = overrides[`pos_${src}`] || 'center center';
    return `
      <div class="admin-img-card" data-original="${src}" data-name="${name}" data-custom="${isCustom}">
        <img src="${displaySrc || src}" style="object-position: ${savedPos};" />
        <div class="admin-img-actions">
          <button class="admin-img-btn admin-img-replace" title="Thay ảnh"><i data-lucide="camera"></i></button>
          <button class="admin-img-btn admin-img-position" title="Chỉnh vị trí"><i data-lucide="move"></i></button>
          ${isCustom ? '<button class="admin-img-btn admin-img-delete" title="Xóa ảnh"><i data-lucide="trash-2"></i></button>' : ''}
        </div>
        <div class="admin-img-name">${isCustom ? '<i data-lucide="sparkles"></i> ' + name.replace('custom_', '').slice(0,12) + '...' : name}</div>
      </div>
    `;
  }).join('');

  const addCard = `
    <div class="admin-img-card admin-img-add" id="admin-add-anime-sub-img">
      <div class="admin-add-icon"><i data-lucide="plus"></i></div>
      <div class="admin-img-name">Thêm ảnh</div>
    </div>
  `;

  if (images.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:1.5rem 0">
        <i data-lucide="image-plus" style="width:28px;height:28px;color:var(--pink-300);margin-bottom:0.3rem"></i>
        <p class="admin-hint" style="margin:0.3rem 0 0">Chưa có ảnh nào trong mục này</p>
      </div>
    ` + addCard;
  } else {
    container.innerHTML = cards + addCard;
  }
  createIcons({ icons });

  // Replace image handlers
  container.querySelectorAll('.admin-img-replace').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      replaceImage(card.dataset.original, card);
    });
  });

  // Position editor handlers
  container.querySelectorAll('.admin-img-position').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      openPositionEditor(card.dataset.original);
    });
  });

  // Delete handlers
  container.querySelectorAll('.admin-img-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      const name = card.dataset.name;
      if (!confirm('Xóa ảnh này?')) return;
      try {
        await deleteGalleryImage(catKey, name);
        await renderAnimeSubImages(subId, container);
      } catch (err) {
        console.error('[deleteAnimeSubImage] error:', err);
      }
      resetLogoutTimer();
    });
  });

  // Add image handler
  const addImgBtn = document.getElementById('admin-add-anime-sub-img');
  if (addImgBtn) {
    addImgBtn.addEventListener('click', () => {
      addGalleryImageToContainer(catKey, subId, container);
    });
  }
}

function addGalleryImageToContainer(category, subId, container) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(input);

  input.onchange = async (e) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;

    const addBtn = document.getElementById('admin-add-anime-sub-img');
    if (addBtn) addBtn.querySelector('.admin-img-name').textContent = 'Đang xử lý...';

    try {
      const customName = `custom_${Date.now()}`;
      // Lưu với phần đuôi .jpg để Storage nhận dạng
      const storedFileName = `${customName}.jpg`;
      const dataUrl = await processAndUploadImageToStorage(file, storedFileName);
      await dbWrite(`img_${customName}`, dataUrl);

      const imageList = await getGalleryImageList(category);
      imageList.push(customName);
      await saveGalleryImageList(category, imageList);

      await renderAnimeSubImages(subId, container);
      resetLogoutTimer();
    } catch (err) {
      console.error('[addGalleryImageToContainer] error:', err);
      if (addBtn) addBtn.querySelector('.admin-img-name').textContent = 'Lỗi!';
    }
  };

  setTimeout(() => input.click(), 50);
}

// ==================== ADD / DELETE GALLERY IMAGE ====================
function addGalleryImage(category) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(input);

  input.onchange = async (e) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;

    const addBtn = document.getElementById('admin-add-img');
    if (addBtn) addBtn.querySelector('.admin-img-name').textContent = 'Đang xử lý...';

    try {
      const customName = `custom_${Date.now()}`;
      const storedFileName = `${customName}.jpg`;
      const dataUrl = await processAndUploadImageToStorage(file, storedFileName);
      await dbWrite(`img_${customName}`, dataUrl);

      const imageList = await getGalleryImageList(category);
      imageList.push(customName);
      await saveGalleryImageList(category, imageList);

      renderImageGrid(category);
      resetLogoutTimer();
    } catch (err) {
      console.error('Add image error:', err);
      if (addBtn) addBtn.querySelector('.admin-img-name').textContent = 'Lỗi!';
    }
  };

  setTimeout(() => input.click(), 50);
}

async function deleteGalleryImage(category, name) {
  try {
    // Check if current image is stored on Supabase Storage Bucket to delete the physical file
    const currentImgUrl = await dbRead(`img_${name}`);
    if (currentImgUrl && currentImgUrl.includes('supabase.co/storage')) {
      const urlParts = currentImgUrl.split('/gallery/');
      if (urlParts.length > 1) { // Extract filename from URL
        const fileName = urlParts[1].split('?')[0]; // Remove query params if any
        await supabase.storage.from('gallery').remove([fileName]);
      }
    }

    // Remove DB reference
    await dbWrite(`img_${name}`, '');
    // Remove from list
    const imageList = await getGalleryImageList(category);
    const newList = imageList.filter(n => n !== name);
    await saveGalleryImageList(category, newList);
  } catch (err) {
    console.error('Delete image error:', err);
  }
}

// ==================== REPLACE IMAGE ====================
function replaceImage(originalPath, card) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.style.top = '0';
  input.style.left = '0';
  document.body.appendChild(input);

  input.onchange = async (e) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;

    card.querySelector('.admin-img-name').textContent = 'Đang xử lý...';

    try {
      // Check if current image is in Storage Bucket to overwrite it physically to save space
      const currentImgUrl = await dbRead(`img_${originalPath}`);
      let storedFileName = `replace_${Date.now()}.jpg`;
      if (currentImgUrl && currentImgUrl.includes('supabase.co/storage')) {
        const urlParts = currentImgUrl.split('/gallery/');
        if (urlParts.length > 1) {
          storedFileName = urlParts[1].split('?')[0];
        }
      }

      const dataUrl = await processAndUploadImageToStorage(file, storedFileName);
      await dbWrite(`img_${originalPath}`, dataUrl);
      card.querySelector('img').src = dataUrl;
      card.querySelector('.admin-img-name').textContent = originalPath.split('/').pop();
      applyImageOverrides();
      resetLogoutTimer();
    } catch (err) {
      card.querySelector('.admin-img-name').textContent = 'Lỗi!';
      console.error(err);
    }
  };

  setTimeout(() => input.click(), 50);
}

// ==================== POSITION EDITOR ====================
async function openPositionEditor(originalPath) {
  const savedSrc = (await dbRead(`img_${originalPath}`)) || originalPath;
  const savedPos = (await dbRead(`pos_${originalPath}`)) || '50% 50%';
  const [initX, initY] = savedPos.split(' ').map(v => parseInt(v) || 50);

  const editor = document.createElement('div');
  editor.id = 'admin-pos-editor';
  editor.className = 'admin-modal-overlay';
  editor.innerHTML = `
    <div class="admin-pos-content">
      <div class="admin-panel-header">
        <h3>Chỉnh vị trí focus</h3>
        <button class="admin-close-btn" id="pos-close">&times;</button>
      </div>
      <p class="admin-hint">Kéo trên ảnh để chỉnh vị trí hiển thị</p>
      <div class="admin-pos-preview-wrap">
        <div class="admin-pos-preview">
          <img id="pos-preview-img" src="${savedSrc}" style="object-position: ${savedPos};" />
          <div class="admin-pos-crosshair" id="pos-crosshair"></div>
        </div>
      </div>
      <div class="admin-pos-info">
        <span id="pos-value">${savedPos}</span>
      </div>
      <div class="admin-modal-btns">
        <button class="admin-btn admin-btn-ghost" id="pos-reset">Reset</button>
        <button class="admin-btn admin-btn-primary" id="pos-save">Lưu</button>
      </div>
    </div>
  `;

  document.body.appendChild(editor);
  requestAnimationFrame(() => editor.classList.add('active'));

  const img = document.getElementById('pos-preview-img');
  const crosshair = document.getElementById('pos-crosshair');
  const valueEl = document.getElementById('pos-value');
  let posX = initX, posY = initY;

  crosshair.style.left = posX + '%';
  crosshair.style.top = posY + '%';

  function updatePos(clientX, clientY, rect) {
    posX = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    posY = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
    const pos = `${posX}% ${posY}%`;
    img.style.objectPosition = pos;
    crosshair.style.left = posX + '%';
    crosshair.style.top = posY + '%';
    valueEl.textContent = pos;
  }

  const previewWrap = editor.querySelector('.admin-pos-preview');
  let dragging = false;

  previewWrap.addEventListener('mousedown', (e) => {
    dragging = true;
    updatePos(e.clientX, e.clientY, previewWrap.getBoundingClientRect());
  });
  document.addEventListener('mousemove', (e) => {
    if (dragging) updatePos(e.clientX, e.clientY, previewWrap.getBoundingClientRect());
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  previewWrap.addEventListener('touchstart', (e) => {
    dragging = true;
    const t = e.touches[0];
    updatePos(t.clientX, t.clientY, previewWrap.getBoundingClientRect());
  }, { passive: true });
  previewWrap.addEventListener('touchmove', (e) => {
    if (dragging) {
      const t = e.touches[0];
      updatePos(t.clientX, t.clientY, previewWrap.getBoundingClientRect());
    }
  }, { passive: true });
  previewWrap.addEventListener('touchend', () => { dragging = false; }, { passive: true });

  document.getElementById('pos-save').addEventListener('click', async () => {
    const pos = `${posX}% ${posY}%`;
    await dbWrite(`pos_${originalPath}`, pos);
    applyImageOverrides();
    closeModal(editor);
    const activeTab = document.querySelector('.admin-tab.active');
    if (activeTab) renderImageGrid(activeTab.dataset.tab);
    resetLogoutTimer();
  });

  document.getElementById('pos-reset').addEventListener('click', () => {
    posX = 50; posY = 50;
    const pos = '50% 50%';
    img.style.objectPosition = pos;
    crosshair.style.left = '50%';
    crosshair.style.top = '50%';
    valueEl.textContent = pos;
  });

  document.getElementById('pos-close').addEventListener('click', () => closeModal(editor));
}

// ==================== APPLY OVERRIDES ====================
export function applyCmsStatus(status) {
  const badge = document.querySelector('.cms-status');
  if (!badge) return;
  badge.dataset.status = status;
  const labels = { open: 'OPEN', waitlist: 'NHẬN WL', close: 'CLOSE' };
  badge.innerHTML = `<span class="cms-dot"></span> CMS: ${labels[status] || status.toUpperCase()}`;
}

export async function applyImageOverrides() {
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('key, value')
    .or('key.like.img_%,key.like.pos_%');

  if (!settings) return;

  const overrides = {};
  settings.forEach(s => { overrides[s.key] = s.value; });

  document.querySelectorAll('img[src], img[data-lightbox]').forEach(img => {
    const src = img.getAttribute('data-lightbox') || img.getAttribute('src');
    if (!src) return;

    const savedSrc = overrides[`img_${src}`];
    const savedPos = overrides[`pos_${src}`];

    if (savedSrc) {
      img.src = savedSrc;
      if (img.dataset.lightbox) img.dataset.lightbox = savedSrc;
    }
    if (savedPos) {
      img.style.objectPosition = savedPos;
    }
  });
}

export async function loadAdminSettings() {
  const cmsStatus = await dbRead('cms_status');
  if (cmsStatus) applyCmsStatus(cmsStatus);
  await applyImageOverrides();
}
