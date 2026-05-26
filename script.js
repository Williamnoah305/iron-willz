/* ==================================================
   IRON WILLZ — Unified script.js
   - Single storage format for images, music, videos
   - Uploads (file input + drag & drop)
   - Gallery, Music list, Video list rendering
   - Lightweight lightbox and delete functionality
   - Persists to localStorage as data URLs
   ================================================== */

(() => {
  'use strict';

  /* -------------------------
     Storage helpers
     ------------------------- */
  const STORAGE_KEY = 'iron_media';

  function loadMedia() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load media from storage', e);
      return [];
    }
  }

  function saveMedia(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save media to storage', e);
    }
  }

  function addMediaItem(item) {
    const items = loadMedia();
    items.unshift(item); // newest first
    saveMedia(items);
  }

  function removeMediaItem(id) {
    const items = loadMedia().filter(i => i.id !== id);
    saveMedia(items);
  }

  /* -------------------------
     Utilities
     ------------------------- */
  function uid(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  /* -------------------------
     Rendering functions
     ------------------------- */
  function renderGallery(containerId = 'gallery-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const images = loadMedia().filter(m => m.type === 'image');
    if (!images.length) {
      container.innerHTML = '<p class="empty">No images uploaded yet.</p>';
      return;
    }
    container.innerHTML = images.map(img => {
      return `
        <div class="gallery-item" data-id="${img.id}">
          <img src="${img.url}" alt="${escapeHtml(img.name)}" loading="lazy" />
          <div class="media-actions">
            <button class="btn-open" data-id="${img.id}" aria-label="Open">Open</button>
            <button class="btn-delete" data-id="${img.id}" aria-label="Delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderMusic(containerId = 'music-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tracks = loadMedia().filter(m => m.type === 'audio');
    if (!tracks.length) {
      container.innerHTML = '<p class="empty">No music uploaded yet.</p>';
      return;
    }
    container.innerHTML = tracks.map(t => {
      return `
        <div class="music-item" data-id="${t.id}">
          <p class="media-name">${escapeHtml(t.name)}</p>
          <audio controls src="${t.url}"></audio>
          <div class="media-actions">
            <button class="btn-delete" data-id="${t.id}" aria-label="Delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderVideos(containerId = 'videos-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const vids = loadMedia().filter(m => m.type === 'video');
    if (!vids.length) {
      container.innerHTML = '<p class="empty">No videos uploaded yet.</p>';
      return;
    }
    container.innerHTML = vids.map(v => {
      return `
        <div class="video-item" data-id="${v.id}">
          <p class="media-name">${escapeHtml(v.name)}</p>
          <video controls width="320" src="${v.url}"></video>
          <div class="media-actions">
            <button class="btn-delete" data-id="${v.id}" aria-label="Delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* -------------------------
     Lightbox (simple)
     ------------------------- */
  function createLightbox() {
    if (document.getElementById('iron-lightbox')) return;
    const overlay = document.createElement('div');
    overlay.id = 'iron-lightbox';
    overlay.innerHTML = `
      <div class="lb-inner">
        <button class="lb-close" aria-label="Close">×</button>
        <img class="lb-img" src="" alt="Preview" />
        <p class="lb-caption"></p>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lb-close')) {
        overlay.classList.remove('open');
      }
    });
    document.body.appendChild(overlay);
  }

  function openLightbox(item) {
    createLightbox();
    const overlay = document.getElementById('iron-lightbox');
    const img = overlay.querySelector('.lb-img');
    const caption = overlay.querySelector('.lb-caption');
    img.src = item.url;
    caption.textContent = item.name;
    overlay.classList.add('open');
  }

  /* -------------------------
     Upload handling
     - Expects file inputs with IDs:
       - image-upload
       - music-upload
       - video-upload
     - Optional drag & drop container with ID: upload-dropzone
     ------------------------- */
  function handleFileUpload(file, forcedType = null) {
    // Determine type
    const mime = file.type || '';
    let type = forcedType;
    if (!type) {
      if (mime.startsWith('image/')) type = 'image';
      else if (mime.startsWith('audio/')) type = 'audio';
      else if (mime.startsWith('video/')) type = 'video';
      else {
        // fallback by extension
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (['mp3','wav','ogg','m4a'].includes(ext)) type = 'audio';
        else if (['mp4','webm','mov','ogg'].includes(ext)) type = 'video';
        else if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) type = 'image';
        else type = 'other';
      }
    }

    if (type === 'other') {
      alert('Unsupported file type: ' + file.name);
      return;
    }

    // Read file as Data URL for persistence
    fileToDataURL(file).then(dataUrl => {
      const item = {
        id: uid('m_'),
        name: file.name,
        type,
        url: dataUrl,
        createdAt: new Date().toISOString()
      };
      addMediaItem(item);
      // Re-render relevant sections
      renderGallery();
      renderMusic();
      renderVideos();
    }).catch(err => {
      console.error('Upload failed', err);
      alert('Failed to read file: ' + file.name);
    });
  }

  function wireFileInputs() {
    const imageInput = document.getElementById('image-upload');
    const musicInput = document.getElementById('music-upload');
    const videoInput = document.getElementById('video-upload');

    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(f => handleFileUpload(f, 'image'));
        imageInput.value = '';
      });
    }

    if (musicInput) {
      musicInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(f => handleFileUpload(f, 'audio'));
        musicInput.value = '';
      });
    }

    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(f => handleFileUpload(f, 'video'));
        videoInput.value = '';
      });
    }
  }

  function wireDragAndDrop(dropzoneId = 'upload-dropzone') {
    const dz = document.getElementById(dropzoneId);
    if (!dz) return;

    ['dragenter','dragover'].forEach(ev => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add('drag-over');
      });
    });

    ['dragleave','drop'].forEach(ev => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('drag-over');
      });
    });

    dz.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files || []);
      files.forEach(f => handleFileUpload(f));
    });
  }

  /* -------------------------
     Delegated UI actions (open, delete)
     ------------------------- */
  function wireDelegatedActions() {
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('.btn-open');
      if (openBtn) {
        const id = openBtn.dataset.id;
        const item = loadMedia().find(i => i.id === id);
        if (item && item.type === 'image') openLightbox(item);
        else if (item && item.type === 'audio') {
          // scroll to audio and play
          const el = document.querySelector(`.music-item[data-id="${id}"] audio`);
          if (el) { el.scrollIntoView({behavior:'smooth'}); el.play().catch(()=>{}); }
        } else if (item && item.type === 'video') {
          const el = document.querySelector(`.video-item[data-id="${id}"] video`);
          if (el) { el.scrollIntoView({behavior:'smooth'}); el.play().catch(()=>{}); }
        }
        return;
      }

      const delBtn = e.target.closest('.btn-delete');
      if (delBtn) {
        const id = delBtn.dataset.id;
        if (!id) return;
        if (!confirm('Delete this media item?')) return;
        removeMediaItem(id);
        renderGallery();
        renderMusic();
        renderVideos();
        return;
      }
    });
  }

  /* -------------------------
     Small helpers
     ------------------------- */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
    });
  }

  /* -------------------------
     Public init
     ------------------------- */
  function initAll() {
    // Initial render
    renderGallery();
    renderMusic();
    renderVideos();

    // Wire inputs and drag/drop
    wireFileInputs();
    wireDragAndDrop('upload-dropzone');

    // Wire delegated actions and lightbox
    wireDelegatedActions();
    createLightbox();

    // Optional: wire a "clear all" button if present
    const clearBtn = document.getElementById('clear-media');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm('Clear all uploaded media from local storage?')) return;
        localStorage.removeItem(STORAGE_KEY);
        renderGallery();
        renderMusic();
        renderVideos();
      });
    }
  }

  /* -------------------------
     Run on DOM ready
     ------------------------- */
  document.addEventListener('DOMContentLoaded', initAll);

  /* -------------------------
     Expose for debugging (optional)
     ------------------------- */
  window.ironWillzMedia = {
    loadMedia,
    saveMedia,
    addMediaItem,
    removeMediaItem,
    renderGallery,
    renderMusic,
    renderVideos
  };

})();
