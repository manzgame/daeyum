(() => {
  'use strict';
  // v5: semua toast/notifikasi visual dimatikan agar tampilan bersih.

  const CONFIG = {
    apiUrl: '/api/proxy', // DIUBAH: Gunakan local proxy route Vercel
    auth: '20250901majwlqo',
    domain: 'api-ak.vidssave.com',
    storagePrefix: 'yt6767-lite:',
    maxHistory: 60,
    adLinks: [
      'https://www.effectivecpmnetwork.com/ei197f8i?key=7296ce5ce218473810261eabd049ad7d',
      'https://www.effectivecpmnetwork.com/d36pkfnfb?key=98d72eaac9931c3e080dcce9d4d807a0',
      'https://www.effectivecpmnetwork.com/fun79qde?key=f23c4db3393a77a42ef5412b1a75053a',
      'https://www.effectivecpmnetwork.com/uyd5pi1y7g?key=ecda7388108e4bf6b485ab620343f53a',
      'https://www.effectivecpmnetwork.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274'
    ]
  };

  const STORAGE = {
    history: CONFIG.storagePrefix + 'history',
    stats: CONFIG.storagePrefix + 'stats',
    queue: CONFIG.storagePrefix + 'queue',
    adIndex: CONFIG.storagePrefix + 'ad-index'
  };

  const state = {
    activeTab: 'video',
    videoMode: 'video',
    filter: 'ready',
    currentInfo: null,
    currentOutput: 'video',
    selectedFormat: null,
    history: loadJson(STORAGE.history, []),
    stats: loadJson(STORAGE.stats, { processed: 0, downloads: 0, lastType: '-' }),
    queue: loadJson(STORAGE.queue, []),
    busy: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    tabs: $('#mainTabs'),
    tabPill: $('#tabPill'),
    providerBadge: $('#providerBadge'),
    videoUrlInput: $('#videoUrlInput'),
    musicUrlInput: $('#musicUrlInput'),
    processVideoBtn: $('#processVideoBtn'),
    processVideoText: $('#processVideoText'),
    processVideoIcon: $('#processVideoIcon'),
    processMusicBtn: $('#processMusicBtn'),
    processMusicText: $('#processMusicText'),
    processMusicIcon: $('#processMusicIcon'),
    videoResultBox: $('#videoResultBox'),
    musicResultBox: $('#musicResultBox'),
    queueInput: $('#queueInput'),
    queueList: $('#queueList'),
    statProcessed: $('#statProcessed'),
    statDownloads: $('#statDownloads'),
    statLastType: $('#statLastType'),
    statHistory: $('#statHistory'),
    historyList: $('#historyList')
  };

  const icons = {
    loader: '<span class="loader" aria-hidden="true"></span>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"></path></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.7-4 4.4-6 8-6s6.3 2 8 6"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindEvents();
    updatePill();
    renderStats();
    renderHistory();
  }

  function bindEvents() {
    $$('.tab-btn').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab, true)));
    $$('[data-switch-tab]').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.switchTab, true)));
    $$('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
      state.videoMode = btn.dataset.videoMode;
      $$('.seg-btn').forEach(item => item.classList.toggle('active', item === btn));
      if (state.currentInfo && state.currentOutput !== 'music') renderResult('video');
    }));

    $('#pasteVideoBtn').addEventListener('click', () => pasteTo(els.videoUrlInput));
    $('#pasteMusicBtn').addEventListener('click', () => pasteTo(els.musicUrlInput));
    $('#cleanVideoBtn').addEventListener('click', () => cleanInput(els.videoUrlInput));
    $('#cleanMusicBtn').addEventListener('click', () => cleanInput(els.musicUrlInput));
    $('#clearVideoBtn').addEventListener('click', () => clearInput(els.videoUrlInput));
    $('#clearMusicBtn').addEventListener('click', () => clearInput(els.musicUrlInput));
    $('#musicFromVideoBtn').addEventListener('click', () => {
      els.musicUrlInput.value = els.videoUrlInput.value.trim();
    });

    els.processVideoBtn.addEventListener('click', () => processUrl('video'));
    els.processMusicBtn.addEventListener('click', () => processUrl('music'));
    els.videoUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') processUrl('video'); });
    els.musicUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') processUrl('music'); });

    $('#exportHistoryBtn').addEventListener('click', exportHistory);
    $('#clearHistoryBtn').addEventListener('click', clearHistory);

    window.addEventListener('resize', updatePill);
  }

  function showTab(tab, scroll) {
    const target = ['video', 'music', 'promo', 'history'].includes(tab) ? tab : 'video';
    state.activeTab = target;
    $$('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === target));
    $$('.tab-panel').forEach(panel => panel.classList.toggle('hidden', panel.id !== `tab-${target}`));
    updatePill();
    if (scroll) document.querySelector('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updatePill() {
    const active = $('.tab-btn.active');
    if (!active || !els.tabPill) return;
    els.tabPill.style.width = `${active.offsetWidth}px`;
    els.tabPill.style.transform = `translateX(${active.offsetLeft}px)`;
  }


  function openRotatingAd() {
    if (!CONFIG.adLinks.length) return;
    let currentIndex = Number(localStorage.getItem(STORAGE.adIndex) || 0);
    if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= CONFIG.adLinks.length) currentIndex = 0;
    const link = CONFIG.adLinks[currentIndex];
    localStorage.setItem(STORAGE.adIndex, String((currentIndex + 1) % CONFIG.adLinks.length));
    try {
      const popup = window.open(link, '_blank', 'noopener,noreferrer');
      if (!popup) toast('Iklan diblokir', 'Browser memblokir tab iklan, proses tetap lanjut.', 'warn');
      else toast('Iklan dibuka', `Iklan ${currentIndex + 1}/${CONFIG.adLinks.length} dibuka, hasil tetap diproses di halaman ini.`, 'success');
    } catch (_) {
      toast('Iklan gagal dibuka', 'Popup ditolak browser, proses tetap lanjut.', 'warn');
    }
  }

  async function processUrl(output) {
    if (state.busy) return toast('Tunggu dulu', 'Masih ada proses berjalan. Browser juga punya batas sabar.', 'warn');
    const input = output === 'music' ? els.musicUrlInput : els.videoUrlInput;
    const url = cleanYoutubeUrl(input.value.trim());
    if (!url) return toast('Link kosong', 'Masukkan link YouTube dulu.', 'warn');
    if (!isYoutubeUrl(url)) return toast('Link tidak valid', 'Yang ini bukan link YouTube.', 'warn');
    input.value = url;
    openRotatingAd();
    state.currentOutput = output;
    state.selectedFormat = null;
    setLoading(output, true);
    hideResult(output);
    try {
      const raw = await fetchVideoInfo(url);
      const info = normalizeInfo(raw, url);
      state.currentInfo = info;
      state.stats.processed += 1;
      state.stats.lastType = output === 'music' ? 'Musik' : 'Video';
      saveJson(STORAGE.stats, state.stats);
      renderStats();
      renderResult(output);
      scrollToResult(output);
      toast('Info berhasil', `${info.title || 'Video'} berhasil dibaca.`, 'success');
    } catch (error) {
      console.error(error);
      toast('Gagal ambil data', error.message || 'API error. Ya, internet kembali mengecewakan.', 'warn');
    } finally {
      setLoading(output, false);
    }
  }

  // MODIFIED: Changed to use JSON instead of URLSearchParams
  async function fetchVideoInfo(url) {
    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        auth: CONFIG.auth,
        domain: CONFIG.domain,
        origin: 'source'
      })
    });
    
    if (!response.ok) throw new Error(`Server API error ${response.status}.`);
    const json = await response.json();
    if (json.status !== 1 && json.status !== '1' && json.code !== 0 && json.success !== true) {
      throw new Error(json.message || json.msg || 'Provider menolak link ini.');
    }
    return json.data || json.result || json;
  }

  function normalizeInfo(info, sourceUrl) {
    const data = info || {};
    const title = firstValue(data, ['title', 'name', 'videoTitle', 'caption', 'desc']) || 'Untitled YouTube Video';
    const duration = firstValue(data, ['duration', 'length', 'durationText', 'time']) || 'N/A';
    const thumbnail = normalizeUrl(firstValue(data, ['thumbnail', 'thumb', 'cover', 'image', 'poster', 'thumbnail_url']) || findDeep(data, ['thumbnail', 'thumb', 'cover', 'image', 'poster'])) || '';
    const channel = firstValue(data, ['channel', 'channelName', 'author', 'authorName', 'uploader', 'owner']) || findDeep(data, ['channel', 'channelName', 'author', 'authorName', 'uploader', 'owner']) || 'N/A';
    const channelAvatar = normalizeUrl(firstValue(data, ['avatar', 'authorAvatar', 'channelAvatar', 'profilePicture']) || findDeep(data, ['avatar', 'authorAvatar', 'channelAvatar', 'profilePicture'])) || '';
    const views = firstValue(data, ['views', 'view', 'viewCount', 'view_count', 'play_count']) || findDeep(data, ['views', 'viewCount', 'view_count', 'play_count']);
    const likes = firstValue(data, ['likes', 'like', 'likeCount', 'like_count', 'digg_count']) || findDeep(data, ['likes', 'likeCount', 'like_count', 'digg_count']);
    const subscribers = firstValue(data, ['subscribers', 'subscriber', 'subscriberCount', 'subscriber_count', 'channelSubscribers']) || findDeep(data, ['subscribers', 'subscriberCount', 'subscriber_count', 'channelSubscribers']);
    const description = firstValue(data, ['description', 'desc', 'caption', 'content']) || findDeep(data, ['description', 'desc', 'caption', 'content']) || '';
    const uploadDate = firstValue(data, ['uploadDate', 'upload_date', 'uploadedDate', 'date', 'timestamp']) || findDeep(data, ['uploadDate', 'upload_date', 'uploadedDate', 'date', 'timestamp']);
    const videos = Array.isArray(data.formats) ? data.formats : Array.isArray(data.videos) ? data.videos : Array.isArray(data.result) ? data.result : [];
    return {
      title: escapeHtml(title),
      duration: escapeHtml(duration),
      thumbnail: thumbnail,
      channel: escapeHtml(channel),
      channelAvatar: channelAvatar,
      views: formatCount(views),
      likes: formatCount(likes),
      subscribers: formatCount(subscribers),
      description: escapeHtml(String(description || '').slice(0, 200)),
      uploadDate: formatDate(uploadDate),
      videos: uniqueBy(videos, 'url').map(v => ({
        id: cryptoId(),
        quality: extractQuality(v.quality || v.resolution || v.name || ''),
        format: inferExt(v),
        size: formatBytes(v.size || v.filesize),
        type: String(v.type || v.kind || 'video').toLowerCase(),
        url: normalizeUrl(v.url || v.link || v.href),
        name: escapeHtml(v.name || v.quality || v.resolution || v.title || 'Download'),
        ...v
      })),
      raw: data
    };
  }

  function renderResult(output) {
    const info = state.currentInfo;
    if (!info) return;
    const box = output === 'music' ? els.musicResultBox : els.videoResultBox;
    const filteredVideos = output === 'music' ? info.videos.filter(v => v.type === 'audio') : info.videos.filter(v => v.type !== 'audio' && (state.videoMode === 'all' || v.type === state.videoMode));
    const html = `
    <div class="result-container">
      <div class="result-header">
        <img src="${info.thumbnail || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">No Image</text></svg>'}" alt="Thumbnail" class="result-thumbnail">
        <div class="result-meta">
          <h3>${info.title}</h3>
          <p>${icons.user} ${info.channel} ${info.subscribers ? `(${info.subscribers} subs)` : ''}</p>
          <p>${icons.clock} ${info.duration} ${info.uploadDate ? `• ${info.uploadDate}` : ''}</p>
          <p>${icons.eye} ${info.views} views ${info.likes ? `• ${icons.heart} ${info.likes} likes` : ''}</p>
        </div>
      </div>
      ${info.description ? `<p class="result-description">${info.description}</p>` : ''}
      <div class="format-list">
        ${filteredVideos.map((video, idx) => `
          <div class="format-item" data-format-id="${video.id}">
            <div class="format-info">
              <span class="format-badge">${video.quality ? `${video.quality}p` : video.format.toUpperCase()}</span>
              <span>${video.name}</span>
              <span class="format-size">${video.size}</span>
            </div>
            <button class="format-btn" onclick="copyFormatUrl('${escapeAttribute(video.id)}')">
              ${icons.copy} Copy URL
            </button>
          </div>
        `).join('')}
      </div>
      ${filteredVideos.length === 0 ? `<p class="empty-state">Tidak ada format ${output === 'music' ? 'audio' : 'video'} tersedia.</p>` : ''}
    </div>
    `;
    box.classList.remove('hidden');
    box.innerHTML = html;
    window.copyFormatUrl = (id) => {
      const video = info.videos.find(v => v.id === id);
      if (video?.url) copyText(video.url, `Link ${video.name} disalin ke clipboard. Paste di browser untuk download.`);
    };
  }

  function renderHistory() {
    const items = state.history.slice(0, 50);
    const html = items.length > 0
      ? items.map((item, idx) => `
        <div class="history-item">
          <div class="history-info">
            <span>${escapeHtml(item.title || 'Untitled')}</span>
            <small>${item.type === 'music' ? icons.music : icons.download} ${item.type} • ${item.date}</small>
          </div>
          <button class="history-copy" onclick="copyHistoryUrl(${idx})">${icons.copy}</button>
        </div>
      `).join('')
      : '<p class="empty-state">Belum ada history.</p>';
    els.historyList.innerHTML = html;
    window.copyHistoryUrl = (idx) => {
      const item = state.history[idx];
      if (item?.url) copyText(item.url, 'Link history disalin.');
    };
  }

  function scrollToResult(output) {
    const box = output === 'music' ? els.musicResultBox : els.videoResultBox;
    if (box && !box.classList.contains('hidden')) {
      setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }

  function setLoading(output, active) {
    state.busy = active;
    const btn = output === 'music' ? els.processMusicBtn : els.processVideoBtn;
    const icon = output === 'music' ? els.processMusicIcon : els.processVideoIcon;
    btn.disabled = active;
    icon.innerHTML = active ? icons.loader : icons.download;
  }

  function hideResult(output) {
    const box = output === 'music' ? els.musicResultBox : els.videoResultBox;
    box.classList.add('hidden');
    box.innerHTML = '';
  }

  async function pasteTo(input) {
    try {
      const text = await navigator.clipboard.readText();
      input.value = cleanYoutubeUrl(text.trim());
      input.focus();
      toast('Clipboard ditempel', 'Link masuk ke input.', 'success');
    } catch (_) {
      toast('Clipboard ditolak', 'Browser menolak akses clipboard. Paste manual aja.', 'warn');
    }
  }

  function cleanInput(input) {
    const clean = cleanYoutubeUrl(input.value.trim());
    if (!clean) return toast('Kosong', 'Tidak ada link untuk dibersihkan.', 'warn');
    input.value = clean;
    toast('Link dibersihkan', 'Parameter tracking dibuang.', 'success');
  }

  function clearInput(input) {
    input.value = '';
    input.focus();
    toast('Dikosongkan', 'Input bersih.', 'success');
  }

  function cleanYoutubeUrl(url) {
    try {
      if (!url) return '';
      const found = String(url).match(/https?:\/\/[^\s]+/i);
      const raw = found ? found[0] : url;
      const parsed = new URL(raw);
      if (!isYoutubeUrl(parsed.href)) return raw;
      if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.split('/').filter(Boolean)[0];
        return id ? `https://youtu.be/${id}` : parsed.href;
      }
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/watch?v=${id}`;
      return parsed.origin + parsed.pathname;
    } catch (_) {
      return url;
    }
  }

  function isYoutubeUrl(url) {
    return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(String(url || ''));
  }

  function normalizeUrl(value) {
    if (Array.isArray(value)) value = value[0];
    if (value && typeof value === 'object') value = value.url || value.href || value.src || value.link || '';
    const url = String(value || '').trim();
    if (!url || url === 'undefined' || url === 'null' || /^javascript:/i.test(url)) return '';
    return url;
  }

  function firstValue(obj, keys) {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    return '';
  }

  function findDeep(obj, keys, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 4) return '';
    const lower = keys.map(k => k.toLowerCase());
    for (const [key, value] of Object.entries(obj)) {
      if (lower.includes(key.toLowerCase()) && value !== null && value !== undefined && value !== '') return value;
    }
    for (const value of Object.values(obj)) {
      const found = findDeep(value, keys, depth + 1);
      if (found) return found;
    }
    return '';
  }

  function extractQuality(value) {
    const match = String(value || '').match(/(\d{2,4})/);
    return match ? Number(match[1]) : 0;
  }

  function inferExt(item) {
    if (item.type === 'thumbnail') return 'jpg';
    const ext = String(item.format || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ext) return ext;
    return item.type === 'audio' ? 'mp3' : 'mp4';
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!value) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatCount(value) {
    if (value === undefined || value === null || value === '') return 'N/A';
    const num = Number(String(value).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(num) || !String(value).match(/\d/)) return escapeHtml(value);
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
  }

  function formatDate(value) {
    try { return new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }); }
    catch (_) { return '-'; }
  }

  function slugify(value) {
    return String(value || 'file').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70) || 'file';
  }

  function uniqueBy(items, key) {
    const seen = new Set();
    return items.filter(item => {
      const value = item?.[key];
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function cryptoId() {
    return crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function copyText(text, success) {
    if (!text) return toast('Tidak ada yang disalin', 'Nilainya kosong.', 'warn');
    try {
      await navigator.clipboard.writeText(text);
      toast('Disalin', success || 'Berhasil disalin.', 'success');
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      toast('Disalin', success || 'Berhasil disalin.', 'success');
    }
  }

  function toast() {
    // Notifikasi visual dimatikan total sesuai request.
  }

  function renderStats() {
    els.statProcessed.textContent = formatCount(state.stats.processed || 0);
    els.statDownloads.textContent = formatCount(state.stats.downloads || 0);
    els.statLastType.textContent = state.stats.lastType || '-';
    els.statHistory.textContent = formatCount(state.history.length || 0);
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function exportHistory() {
    const data = JSON.stringify(state.history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yt6767-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Exported', 'History sudah didownload.', 'success');
  }

  function clearHistory() {
    if (confirm('Yakin clear semua history?')) {
      state.history = [];
      saveJson(STORAGE.history, state.history);
      renderHistory();
      renderStats();
      toast('Cleared', 'History berhasil dihapus.', 'success');
    }
  }
})();
