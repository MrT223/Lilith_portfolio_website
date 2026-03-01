import { supabase } from './supabase.js';

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
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || null;
}

async function dbWrite(key, value) {
  const { data } = await supabase.rpc('admin_write', {
    pw_hash: adminPasswordHash,
    setting_key: key,
    setting_value: value
  });
  return data;
}

function resizeImageToBase64(file) {
  return new Promise((resolve) => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target.result;
    };
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

// ==================== ADMIN PANEL ====================
async function showAdminPanel() {
  if (document.getElementById('admin-panel')) return;

  const cmsStatus = (await dbRead('cms_status')) || 'open';
  const panel = document.createElement('div');
  panel.id = 'admin-panel';
  panel.className = 'admin-modal-overlay';

  panel.innerHTML = `
    <div class="admin-panel-content">
      <div class="admin-panel-header">
        <h3>🔧 Quản lý trang</h3>
        <button class="admin-close-btn" id="admin-close">&times;</button>
      </div>

      <div class="admin-panel-body">
        <div class="admin-section">
          <h4>Trạng thái Commission</h4>
          <div class="admin-cms-toggle">
            <button class="admin-btn ${cmsStatus === 'open' ? 'admin-btn-green active' : 'admin-btn-green'}" data-cms="open">
              <span class="cms-dot-lg"></span> OPEN
            </button>
            <button class="admin-btn ${cmsStatus === 'close' ? 'admin-btn-red active' : 'admin-btn-red'}" data-cms="close">
              <span class="cms-dot-lg"></span> CLOSE
            </button>
          </div>
        </div>

        <div class="admin-section">
          <h4>Quản lý ảnh</h4>
          <p class="admin-hint">Chạm 📷 để thay ảnh. Chạm ✋ để chỉnh vị trí focus.</p>
          <div class="admin-img-tabs">
            <button class="admin-tab active" data-tab="gallery">Gallery</button>
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

  renderImageGrid('gallery');
}

// ==================== IMAGE GRID ====================
const IMAGE_MAP = {
  gallery: {
    images: [
      ...Array.from({length: 9}, (_, i) => `/img/Sample/Normal/normal0${i+1}.jpg`),
      ...Array.from({length: 9}, (_, i) => `/img/Sample/Chibi/chibi0${i+1}.jpg`),
    ]
  },
  lilith: {
    images: ['lilith01','lilith02','lilith03','lilith04','lilith05','lilith06','lilith07','lilith08']
      .map(n => `/img/lilith/${n}.jpg`),
  },
  alt: {
    images: [
      '/img/lilith_alternative_style/lilith_gachiakuta.jpg',
      '/img/lilith_alternative_style/lilith_kny.jpg',
      '/img/lilith_alternative_style/lilith_mha.jpg',
      '/img/lilith_alternative_style/lilith_wb.jpg',
    ]
  },
  main: {
    images: ['/img/lilith/lilith_main.jpg']
  }
};

async function renderImageGrid(tab) {
  const grid = document.getElementById('admin-img-grid');
  if (!grid) return;
  grid.innerHTML = '<p class="admin-hint" style="text-align:center;grid-column:1/-1">Đang tải...</p>';

  const { data: allSettings } = await supabase
    .from('admin_settings')
    .select('key, value')
    .or('key.like.img_%,key.like.pos_%');

  const overrides = {};
  if (allSettings) allSettings.forEach(s => { overrides[s.key] = s.value; });

  const data = IMAGE_MAP[tab];
  const cards = data.images.map(src => {
    const savedSrc = overrides[`img_${src}`] || src;
    const savedPos = overrides[`pos_${src}`] || 'center center';
    return `
      <div class="admin-img-card" data-original="${src}">
        <img src="${savedSrc}" style="object-position: ${savedPos};" />
        <div class="admin-img-actions">
          <button class="admin-img-btn admin-img-replace" title="Thay ảnh">📷</button>
          <button class="admin-img-btn admin-img-position" title="Chỉnh vị trí">✋</button>
        </div>
        <div class="admin-img-name">${src.split('/').pop()}</div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cards;

  grid.querySelectorAll('.admin-img-replace').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      replaceImage(card.dataset.original, card);
    });
  });

  grid.querySelectorAll('.admin-img-position').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.admin-img-card');
      openPositionEditor(card.dataset.original);
    });
  });
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
      const dataUrl = await resizeImageToBase64(file);
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
  badge.innerHTML = `<span class="cms-dot"></span> CMS: ${status.toUpperCase()}`;
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
