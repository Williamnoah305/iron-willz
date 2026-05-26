/* ================================
   IRON WILLZ — FULL JS FUNCTIONALITY
   Gallery • Music Upload • Video Upload
=================================== */

// ---------- Utility: Save & Load ----------
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// ---------- IMAGE GALLERY ----------
function initGallery() {
    const galleryContainer = document.getElementById("gallery-container");
    if (!galleryContainer) return;

    const images = loadFromStorage("iron_gallery");

    galleryContainer.innerHTML = images.length
        ? images.map(src => `<div class="gallery-item"><img src="${src}" /></div>`).join("")
        : "<p>No images uploaded yet.</p>";
}

// ---------- MUSIC UPLOAD ----------
function initMusicUpload() {
    const input = document.getElementById("music-upload");
    const list = document.getElementById("music-list");
    if (!input || !list) return;

    const tracks = loadFromStorage("iron_music");

    function renderMusic() {
        list.innerHTML = tracks.length
            ? tracks.map(t => `
                <div class="music-item">
                    <p>${t.name}</p>
                    <audio controls src="${t.url}"></audio>
                </div>
            `).join("")
            : "<p>No music uploaded yet.</p>";
    }

    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        tracks.push({ name: file.name, url });

        saveToStorage("iron_music", tracks);
        renderMusic();
    });

    renderMusic();
}

// ---------- VIDEO UPLOAD ----------
function initVideoUpload() {
    const input = document.getElementById("video-upload");
    const list = document.getElementById("video-list");
    if (!input || !list) return;

    const videos = loadFromStorage("iron_videos");

    function renderVideos() {
        list.innerHTML = videos.length
            ? videos.map(v => `
                <div class="video-item">
                    <p>${v.name}</p>
                    <video controls width="300" src="${v.url}"></video>
                </div>
            `).join("")
            : "<p>No videos uploaded yet.</p>";
    }

    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        videos.push({ name: file.name, url });

        saveToStorage("iron_videos", videos);
        renderVideos();
    });

    renderVideos();
}

// ---------- GLOBAL INIT ----------
document.addEventListener("DOMContentLoaded", () => {
    initGallery();
    initMusicUpload();
    initVideoUpload();
});
