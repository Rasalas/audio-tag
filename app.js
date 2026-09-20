import { detectFormat, isSupportedName, TAG_KEYS } from './formats.js';

/* ---------- i18n ---------- */
const STRINGS = {
  en: {
    dropHere: 'Drop music and images here',
    downloadAll: 'Save all',
    addAudio: 'Add music',
    emptyTitle: 'No tracks yet',
    emptyMobile: 'Tap + to add MP3, M4A, FLAC or OGG files, with cover images if you like. Everything stays on your phone.',
    emptyDesktop: 'Add or drop MP3, M4A, FLAC or OGG files, with cover images if you like. Everything stays in your browser.',
    selectTrack: 'Select a track to add a cover',
    back: 'Back',
    play: 'Play',
    removeTrack: 'Remove from list',
    noCover: 'No cover yet',
    chooseImage: 'Choose image',
    changeImage: 'Change image',
    removeCover: 'Remove cover',
    download: 'Save file',
    changed: 'changed',
    skipped: (names) => `Not supported: ${names}. MP3, M4A, FLAC and OGG/Opus work.`,
    unreadable: (names) => `Could not read: ${names}.`,
    notImage: 'That is not an image.',
    imageFailed: 'Could not read the image.',
    applyAllAsk: (n) => `Use this cover for all ${n} tracks?`,
    applyAllAction: 'Apply',
    dismiss: 'Dismiss',
    pause: 'Pause',
    position: 'Playback position',
    settings: 'Settings',
    more: 'More',
    aboutShort: 'About',
    version: 'Version',
    close: 'Close',
    about: 'About audioTag',
    aboutTitle: 'About audioTag',
    aboutDesc: 'Project, support, legal',
    theme: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    langAuto: 'Auto',
    coverSize: 'Cover size',
    sizeOriginal: 'Original',
    coverSizeHint: 'Larger photos are scaled down to this edge length before embedding. Original keeps the full resolution.',
    tagline: 'Covers and tags for your music',
    aboutText: 'An open-source tool that adds cover images and tags to MP3, M4A, FLAC and OGG files. Everything happens in your browser.',
    secProject: 'Project',
    secSupport: 'Support',
    secLegal: 'Legal',
    githubDesc: 'Source code, issues and contributions',
    coffeeDesc: 'One-time contribution',
    sponsorDesc: 'Recurring support',
    legalLicense: 'Licensed under the',
    legalLicenseName: 'MIT License',
    legalLocal: 'Files are processed entirely in your browser. Nothing is uploaded.',
    legalStorage: "Settings are kept in your browser's local storage. Files are not stored.",
    legalNoExternal: 'No external fonts, scripts or tracking.',
    legalHosted: 'Hosted on',
    applied: (n) => `Cover applied to ${n} tracks`,
    addedWithCover: (n) => `${n} tracks added with cover`,
    matchedByName: (n) => `${n} covers matched by file name`,
    pendingKept: 'Image kept. Add music and it will be applied.',
    pendingRow: 'Waiting for music to apply this image to',
    saved: 'Saved',
    savedAll: (n) => `${n} files saved`,
    droppedTags: 'Old tag format: other tags were not carried over.',
    unknownTitle: 'Unknown title',
    unknownArtist: 'Unknown artist',
    original: 'original',
    resized: 'resized',
    cropped: 'cropped',
    cropTitle: 'Adjust cover',
    cropHint: 'Drag to move. Pinch or use the slider to zoom.',
    cropKeep: 'Keep original',
    cropUse: 'Use crop',
    adjustCrop: 'Adjust crop',
    squareImages: 'Non-square images',
    squareCrop: 'Crop to square',
    squareKeep: 'Keep as is',
    squareHint: 'Photos you pick yourself open a crop view. Imported images are centre-cropped and can be adjusted afterwards.',
    zoom: 'Zoom',
    libraryTitle: 'Choose a cover',
    libraryNew: 'New image',
    libraryNewDesc: 'From your photos or files',
    libraryHint: 'Images from this session',
    libraryAdded: (n) => `${n} images added to the library. Pick them via the cover of a track.`,
    removeImage: 'Remove from library',
    clearSession: 'Clear session',
    sessionCleared: 'Session cleared. Nothing had been saved anyway.',
    resetSettings: 'Reset settings',
    resetSettingsDesc: 'Back to defaults. Tracks and images stay.',
    settingsReset: 'Settings reset',
    fTitle: 'Title',
    fArtist: 'Artist',
    fAlbum: 'Album',
    fYear: 'Year',
    fTrack: 'Track no.',
    fGenre: 'Genre',
    editTags: 'Edit tags',
    done: 'Done',
    applyTagsAsk: (n) => `Use this album and artist for all ${n} tracks?`,
    tagsApplied: (n) => `Album and artist set on ${n} tracks`,
  },
  de: {
    dropHere: 'Musik und Bilder hier ablegen',
    downloadAll: 'Alle speichern',
    addAudio: 'Musik hinzufügen',
    emptyTitle: 'Noch keine Titel',
    emptyMobile: 'Tippe auf +, um MP3-, M4A-, FLAC- oder OGG-Dateien hinzuzufügen, gern zusammen mit Cover-Bildern. Alles bleibt auf deinem Handy.',
    emptyDesktop: 'MP3-, M4A-, FLAC- oder OGG-Dateien hinzufügen oder hierher ziehen, gern zusammen mit Cover-Bildern. Alles bleibt im Browser.',
    selectTrack: 'Wähle einen Titel, um ein Cover hinzuzufügen',
    back: 'Zurück',
    play: 'Abspielen',
    removeTrack: 'Aus der Liste entfernen',
    noCover: 'Noch kein Cover',
    chooseImage: 'Bild wählen',
    changeImage: 'Bild ändern',
    removeCover: 'Cover entfernen',
    download: 'Datei speichern',
    changed: 'geändert',
    skipped: (names) => `Nicht unterstützt: ${names}. MP3, M4A, FLAC und OGG/Opus gehen.`,
    unreadable: (names) => `Konnte nicht gelesen werden: ${names}.`,
    notImage: 'Das ist kein Bild.',
    imageFailed: 'Bild konnte nicht gelesen werden.',
    applyAllAsk: (n) => `Dieses Cover für alle ${n} Titel übernehmen?`,
    applyAllAction: 'Übernehmen',
    dismiss: 'Ausblenden',
    pause: 'Pause',
    position: 'Wiedergabeposition',
    settings: 'Einstellungen',
    more: 'Mehr',
    aboutShort: 'Über',
    version: 'Version',
    close: 'Schließen',
    about: 'Über audioTag',
    aboutTitle: 'Über audioTag',
    aboutDesc: 'Projekt, Unterstützung, Rechtliches',
    theme: 'Darstellung',
    themeSystem: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    language: 'Sprache',
    langAuto: 'Automatisch',
    coverSize: 'Cover-Größe',
    sizeOriginal: 'Original',
    coverSizeHint: 'Größere Fotos werden vor dem Einbetten auf diese Kantenlänge verkleinert. Original behält die volle Auflösung.',
    tagline: 'Cover und Tags für deine Musik',
    aboutText: 'Ein Open-Source-Werkzeug, das Cover-Bilder und Tags in MP3-, M4A-, FLAC- und OGG-Dateien schreibt. Alles passiert in deinem Browser.',
    secProject: 'Projekt',
    secSupport: 'Unterstützen',
    secLegal: 'Rechtliches',
    githubDesc: 'Quellcode, Issues und Beiträge',
    coffeeDesc: 'Einmaliger Beitrag',
    sponsorDesc: 'Regelmäßige Unterstützung',
    legalLicense: 'Lizenziert unter der',
    legalLicenseName: 'MIT-Lizenz',
    legalLocal: 'Dateien werden ausschließlich lokal im Browser verarbeitet. Nichts wird hochgeladen.',
    legalStorage: 'Einstellungen liegen im lokalen Speicher deines Browsers. Dateien werden nicht gespeichert.',
    legalNoExternal: 'Keine externen Schriften, Skripte oder Tracking.',
    legalHosted: 'Gehostet auf',
    applied: (n) => `Cover für ${n} Titel übernommen`,
    addedWithCover: (n) => `${n} Titel mit Cover hinzugefügt`,
    matchedByName: (n) => `${n} Cover per Dateiname zugeordnet`,
    pendingKept: 'Bild gemerkt. Füge Musik hinzu, dann wird es übernommen.',
    pendingRow: 'Wartet auf Musik, um dieses Bild anzuwenden',
    saved: 'Gespeichert',
    savedAll: (n) => `${n} Dateien gespeichert`,
    droppedTags: 'Altes Tag-Format: andere Tags wurden nicht übernommen.',
    unknownTitle: 'Unbekannter Titel',
    unknownArtist: 'Unbekannter Interpret',
    original: 'Original',
    resized: 'verkleinert',
    cropped: 'zugeschnitten',
    cropTitle: 'Cover anpassen',
    cropHint: 'Ziehen zum Verschieben. Zoomen mit zwei Fingern oder dem Regler.',
    cropKeep: 'Original behalten',
    cropUse: 'Zuschnitt verwenden',
    adjustCrop: 'Zuschnitt anpassen',
    squareImages: 'Nicht quadratische Bilder',
    squareCrop: 'Quadratisch zuschneiden',
    squareKeep: 'So lassen',
    squareHint: 'Selbst gewählte Fotos öffnen eine Zuschnitt-Ansicht. Importierte Bilder werden mittig beschnitten und lassen sich nachträglich anpassen.',
    zoom: 'Zoom',
    libraryTitle: 'Cover wählen',
    libraryNew: 'Neues Bild',
    libraryNewDesc: 'Aus Fotos oder Dateien',
    libraryHint: 'Bilder aus dieser Sitzung',
    libraryAdded: (n) => `${n} Bilder in der Mediathek. Wähle sie über das Cover eines Titels.`,
    removeImage: 'Aus der Mediathek entfernen',
    clearSession: 'Sitzung leeren',
    sessionCleared: 'Sitzung geleert. Gespeichert war ohnehin nichts.',
    resetSettings: 'Einstellungen zurücksetzen',
    resetSettingsDesc: 'Zurück auf Standard. Titel und Bilder bleiben.',
    settingsReset: 'Einstellungen zurückgesetzt',
    fTitle: 'Titel',
    fArtist: 'Interpret',
    fAlbum: 'Album',
    fYear: 'Jahr',
    fTrack: 'Titelnummer',
    fGenre: 'Genre',
    editTags: 'Tags bearbeiten',
    done: 'Fertig',
    applyTagsAsk: (n) => `Album und Interpret für alle ${n} Titel übernehmen?`,
    tagsApplied: (n) => `Album und Interpret bei ${n} Titeln gesetzt`,
  },
};
export const APP_VERSION = '1.0.0';

/* ---------- settings ---------- */
const SETTINGS_KEY = 'audioTag.settings';
const DEFAULTS = { theme: 'system', lang: 'auto', maxEdge: 1200, squareCrop: 'crop' };
const settings = { ...DEFAULTS };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
} catch { /* ignore */ }
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && darkQuery.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.getElementById('themeColor').content = dark ? '#121418' : '#f7f8fc';
}
darkQuery.addEventListener('change', applyTheme);

let lang = 'en';
const t = (key, ...args) => {
  const v = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
};
function applyLanguage() {
  const auto = (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
  lang = settings.lang === 'auto' ? auto : settings.lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
}
applyTheme();
applyLanguage();

/* ---------- state ---------- */
const tracks = [];
let selectedId = null;
let nextId = 1;
let suggestFromId = null; // track whose cover we offer to copy to all others
let suggestTagsFromId = null; // track whose album/artist we offer to copy to all others
let pendingCover = null; // image imported before any music; applied to the next import
const library = []; // images seen this session: { key, name, cover }

const $ = (id) => document.getElementById(id);
const els = {
  audioInput: $('audioInput'),
  imageInput: $('imageInput'),
  addFab: $('addFab'),
  addDesktop: $('addDesktop'),
  trackList: $('trackList'),
  notice: $('notice'),
  noticeText: $('noticeText'),
  noticeDismiss: $('noticeDismiss'),
  suggest: $('suggest'),
  suggestThumb: $('suggestThumb'),
  suggestText: $('suggestText'),
  suggestApply: $('suggestApply'),
  suggestDismiss: $('suggestDismiss'),
  emptyHint: $('emptyHint'),
  detail: $('detail'),
  detailPlaceholder: $('detailPlaceholder'),
  detailTitle: $('detailTitle'),
  coverBox: $('coverBox'),
  coverImg: $('coverImg'),
  coverEmpty: $('coverEmpty'),
  coverCtaText: $('coverCtaText'),
  coverInfo: $('coverInfo'),
  pickImageBtn: $('pickImageBtn'),
  removeCoverBtn: $('removeCoverBtn'),
  metaFile: $('metaFile'),
  metaTitle: $('metaTitle'),
  metaArtist: $('metaArtist'),
  metaCard: $('metaCard'),
  tagsSheet: $('tagsSheet'),
  tagsFile: $('tagsFile'),
  tagInputs: [...document.querySelectorAll('input[data-tag]')],
  player: $('player'),
  playerUi: $('playerUi'),
  playBtn: $('playBtn'),
  seek: $('seek'),
  tCur: $('tCur'),
  tDur: $('tDur'),
  downloadBtn: $('downloadBtn'),
  downloadAll: $('downloadAll'),
  removeTrackBtn: $('removeTrackBtn'),
  backBtn: $('backBtn'),
  brandBtn: $('brandBtn'),
  menuBtn: $('menuBtn'),
  menu: $('menu'),
  menuSettings: $('menuSettings'),
  menuAbout: $('menuAbout'),
  menuClear: $('menuClear'),
  resetSettings: $('resetSettings'),
  settingsSheet: $('settingsSheet'),
  aboutSheet: $('aboutSheet'),
  cropSheet: $('cropSheet'),
  librarySheet: $('librarySheet'),
  libraryGrid: $('libraryGrid'),
  libraryNew: $('libraryNew'),
  cropStage: $('cropStage'),
  cropImg: $('cropImg'),
  cropZoom: $('cropZoom'),
  cropKeep: $('cropKeep'),
  cropUse: $('cropUse'),
  adjustCropBtn: $('adjustCropBtn'),
  aboutFromSettings: $('aboutFromSettings'),
  toast: $('toast'),
  toastText: $('toastText'),
  toastAction: $('toastAction'),
};

const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;
const fmtSize = (n) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const isImageFile = (f) => f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(f.name);
const baseName = (n) => n.replace(/\.[^.]+$/, '').toLowerCase();
const fmtTime = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

/* ---------- snackbar ---------- */
let toastTimer;
let toastHandler = null;
function toast(msg, action = null) {
  els.toastText.textContent = msg;
  els.toastAction.hidden = !action;
  els.toast.classList.toggle('has-action', !!action);
  toastHandler = action?.onClick ?? null;
  if (action) els.toastAction.textContent = action.label;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 7000 : 2400);
}
function hideToast() {
  els.toast.classList.remove('is-visible');
  toastHandler = null;
}
els.toastAction.addEventListener('click', () => {
  const h = toastHandler;
  hideToast();
  h?.();
});

/* ---------- covers ---------- */
function makeCover(bytes, mime, note = '', width = 0, height = 0) {
  const blob = new Blob([bytes], { type: mime });
  return { bytes, mime, url: URL.createObjectURL(blob), size: bytes.length, note, width, height };
}

// FLAC stores pixel dimensions in the picture block; fill them in lazily when unknown.
async function ensureDims(cover) {
  if (cover.width && cover.height) return cover;
  await new Promise((res) => {
    const i = new Image();
    i.onload = () => { cover.width = i.naturalWidth; cover.height = i.naturalHeight; res(); };
    i.onerror = res;
    i.src = cover.url;
  });
  return cover;
}
function releaseCover(c) {
  if (c?.url) URL.revokeObjectURL(c.url);
}
function effectiveCover(tr) {
  if (tr.removed) return null;
  return tr.newCover ?? tr.originalCover;
}
const tagsChanged = (tr) => TAG_KEYS.some((k) => (tr.edits[k] ?? '').trim() !== (tr.tags[k] ?? '').trim());
const isChanged = (tr) => !!tr.newCover || (tr.removed && !!tr.originalCover) || tagsChanged(tr);

const MAX_BYTES = 1.5 * 1024 * 1024;

function loadImage(file) {
  const url = URL.createObjectURL(file);
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => { URL.revokeObjectURL(url); rej(new Error(t('imageFailed'))); };
    i.src = url;
  });
}
const isSquare = (w, h) => Math.abs(w - h) / Math.max(w, h) < 0.02;
const centerCrop = (w, h) => { const size = Math.min(w, h); return { x: Math.round((w - size) / 2), y: Math.round((h - size) / 2), size }; };

// crop = {x, y, size} in source pixels; the result keeps a reference to the
// source file so the crop can be adjusted later.
async function processImage(file, crop = null) {
  if (!isImageFile(file)) throw new Error(t('notImage'));
  const img = await loadImage(file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const source = { file, width: w, height: h };
    const maxEdge = Number(settings.maxEdge) || 0;
    const sx = crop ? crop.x : 0, sy = crop ? crop.y : 0;
    const sw = crop ? crop.size : w, sh = crop ? crop.size : h;
    const cropped = !!crop && !(sw === w && sh === h);
    const fits = maxEdge === 0 || Math.max(sw, sh) <= maxEdge;
    const keepOriginal = !cropped && (file.type === 'image/jpeg' || file.type === 'image/png') && fits && (maxEdge === 0 || file.size <= MAX_BYTES);
    let cover;
    if (keepOriginal) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      cover = makeCover(bytes, file.type, `${w}×${h} · ${fmtSize(bytes.length)} · ${t('original')}`, w, h);
    } else {
      const scale = maxEdge === 0 ? 1 : Math.min(1, maxEdge / Math.max(sw, sh));
      const cw = Math.max(1, Math.round(sw * scale));
      const ch = Math.max(1, Math.round(sh * scale));
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.88));
      if (!blob) throw new Error(t('imageFailed'));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      cover = makeCover(bytes, 'image/jpeg', `${cw}×${ch} · ${fmtSize(bytes.length)} · ${t(cropped ? 'cropped' : 'resized')}`, cw, ch);
    }
    cover.source = source;
    cover.crop = crop;
    return cover;
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

// Automatic path (imports): centre-crop non-square images when the setting says so.
async function autoCover(file) {
  if (settings.squareCrop !== 'crop') return processImage(file);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  URL.revokeObjectURL(img.src);
  return processImage(file, isSquare(w, h) ? null : centerCrop(w, h));
}

// Manual path (picked for one track): let the user adjust the square first.
async function pickedCover(file) {
  if (settings.squareCrop !== 'crop') return processImage(file);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  URL.revokeObjectURL(img.src);
  if (isSquare(w, h)) return processImage(file);
  const result = await openCrop(file, w, h, centerCrop(w, h));
  if (!result) return null; // cancelled
  return processImage(file, result.keep ? null : result.crop);
}

/* ---------- tracks ---------- */
async function addFiles(fileList) {
  const files = [...fileList];
  const added = [];
  const skipped = [];
  const unreadable = [];
  let firstId = null;
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const fmt = detectFormat(buf, file.name);
    if (!fmt) {
      skipped.push(file.name);
      continue;
    }
    let meta;
    try {
      meta = fmt.read(buf);
    } catch (err) {
      console.warn('Could not read', file.name, err);
      unreadable.push(file.name);
      continue;
    }
    const cov = meta.cover;
    const tr = {
      id: nextId++,
      file,
      buf,
      fmt,
      tags: Object.fromEntries(TAG_KEYS.map((k) => [k, meta[k] ?? ''])),
      edits: Object.fromEntries(TAG_KEYS.map((k) => [k, meta[k] ?? ''])),
      originalCover: cov ? makeCover(cov.bytes, cov.mime, '', cov.width, cov.height) : null,
      newCover: null,
      removed: false,
      audioUrl: URL.createObjectURL(file),
    };
    tracks.push(tr);
    added.push(tr);
    firstId ??= tr.id;
  }
  renderList();
  renderSuggest();
  if (firstId !== null && selectedId === null && isDesktop()) select(firstId, false);
  const problems = [];
  if (skipped.length) problems.push(t('skipped', skipped.join(', ')));
  if (unreadable.length) problems.push(t('unreadable', unreadable.join(', ')));
  showNotice(problems.join(' '));
  return added;
}

// Persistent, dismissable message for files that could not be imported (toasts get overwritten too easily).
function showNotice(msg) {
  els.noticeText.textContent = msg;
  els.notice.hidden = !msg;
}

/* Mixed import: audio and images together.
 * - images matching an audio file by base name go to that track
 * - one leftover image goes to every track of this import (or all tracks if only images came)
 * - an image without any music is kept until music arrives */
async function importFiles(fileList) {
  const files = [...fileList];
  const images = files.filter(isImageFile);
  const audio = files.filter((f) => !isImageFile(f));
  const added = audio.length ? await addFiles(audio) : [];

  const covers = [];
  for (const file of images) {
    try {
      const cover = await autoCover(file);
      addToLibrary(cover, file.name);
      covers.push({ file, cover });
    } catch (err) { toast(err.message); }
  }
  if (!covers.length) {
    if (added.length && pendingCover) {
      for (const tr of added) setCover(tr, cloneCover(pendingCover));
      releaseCover(pendingCover);
      pendingCover = null;
      toast(t('addedWithCover', added.length));
      renderAll();
    }
    return;
  }

  const targets = added.length ? added : tracks;
  const covered = new Set();
  const leftover = [];
  let matched = 0;
  for (const { file, cover } of covers) {
    const hits = targets.filter((tr) => baseName(tr.file.name) === baseName(file.name));
    if (hits.length) {
      hits.forEach((tr) => { setCover(tr, cloneCover(cover)); covered.add(tr.id); });
      matched += hits.length;
      releaseCover(cover);
    } else leftover.push(cover);
  }

  if (leftover.length === 1) {
    const cover = leftover[0];
    const rest = targets.filter((tr) => !covered.has(tr.id));
    if (rest.length) {
      rest.forEach((tr) => setCover(tr, cloneCover(cover)));
      releaseCover(cover);
      toast(added.length ? t('addedWithCover', added.length) : t('applied', rest.length));
    } else if (!targets.length) {
      releaseCover(pendingCover);
      pendingCover = cover;
      toast(t('pendingKept'));
    } else releaseCover(cover);
  } else if (leftover.length > 1) {
    leftover.forEach(releaseCover); // already in the library
    toast(t('libraryAdded', leftover.length));
  } else if (matched) {
    toast(t('matchedByName', matched));
  }
  suggestFromId = null;
  renderAll();
}

function cloneCover(c) {
  const n = makeCover(c.bytes, c.mime, c.note, c.width, c.height);
  n.source = c.source;
  n.crop = c.crop;
  return n;
}
function renderAll() {
  renderSuggest();
  renderList();
  renderDetail();
}

/* ---------- library ---------- */
const coverKey = (c) => (c.source ? `${c.source.file.name}:${c.source.file.size}` : `${c.mime}:${c.bytes.length}`);
function addToLibrary(cover, name) {
  const key = coverKey(cover);
  let entry = library.find((e) => e.key === key);
  if (!entry) {
    entry = { key, name, cover: cloneCover(cover) };
    library.push(entry);
  }
  return entry;
}
// Library plus any track covers that came with the files themselves.
function libraryItems() {
  const items = [...library].reverse().map((e) => ({ ...e, removable: true })); // newest first
  const seen = new Set(items.map((e) => e.key));
  for (const tr of tracks) {
    const c = tr.originalCover;
    if (!c) continue;
    const key = coverKey(c);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ key, name: tr.edits.title.trim() || tr.file.name, cover: c, removable: false });
  }
  return items;
}
function renderLibrary() {
  const items = libraryItems();
  els.libraryGrid.replaceChildren(
    ...items.map((it) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.innerHTML = `<button class="tile-pick" type="button"><img alt=""></button><span class="tile-label"></span>${it.removable ? '<button class="tile-remove" type="button"><svg><use href="#i-close"/></svg></button>' : ''}`;
      tile.querySelector('img').src = it.cover.url;
      tile.querySelector('.tile-label').textContent = it.name;
      tile.querySelector('.tile-pick').setAttribute('aria-label', it.name);
      tile.querySelector('.tile-pick').addEventListener('click', () => pickFromLibrary(it));
      tile.querySelector('.tile-remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = library.findIndex((e2) => e2.key === it.key);
        if (i >= 0) { releaseCover(library[i].cover); library.splice(i, 1); }
        if (libraryItems().length) renderLibrary(); else closeLayer();
      });
      tile.querySelector('.tile-remove')?.setAttribute('aria-label', t('removeImage'));
      return tile;
    }),
  );
}
function pickFromLibrary(it) {
  const tr = tracks.find((x) => x.id === selectedId);
  if (!tr) return;
  setCover(tr, cloneCover(it.cover));
  suggestFromId = tracks.length > 1 ? tr.id : null;
  closeLayer();
  renderAll();
}

function removeTrack(id) {
  const i = tracks.findIndex((x) => x.id === id);
  if (i < 0) return;
  const tr = tracks[i];
  URL.revokeObjectURL(tr.audioUrl);
  releaseCover(tr.originalCover);
  releaseCover(tr.newCover);
  tracks.splice(i, 1);
  renderSuggest();
  if (selectedId === id) {
    selectedId = null;
    if (layerOf() === 'detail') history.back();
    document.body.classList.remove('show-detail');
    const next = tracks[i] ?? tracks[i - 1];
    if (next && isDesktop()) select(next.id, false);
  }
  renderList();
  renderDetail();
}

/* ---------- layers + browser back ----------
 * Mobile detail view and the sheets push a history entry, so the system
 * back gesture/button closes them instead of leaving the page. */
const layerOf = () => history.state?.layer ?? null;
function pushLayer(layer) {
  if (layerOf() !== layer) history.pushState({ layer }, '');
  showLayer(layer);
}
function closeLayer() {
  if (layerOf()) history.back();
  else showLayer(null);
}
let lastFocus = null;
function showLayer(layer) {
  document.body.classList.toggle('show-detail', layer === 'detail' && selectedId !== null);
  const openSheet = (el, on) => {
    const was = !el.hidden;
    el.hidden = !on;
    if (on && !was) {
      lastFocus = document.activeElement;
      el.querySelector('button, a, [tabindex]')?.focus();
    } else if (!on && was) {
      lastFocus?.focus?.();
    }
  };
  openSheet(els.settingsSheet, layer === 'settings');
  openSheet(els.aboutSheet, layer === 'about');
  openSheet(els.cropSheet, layer === 'crop');
  openSheet(els.librarySheet, layer === 'library');
  openSheet(els.tagsSheet, layer === 'tags');
  if (layer !== 'crop') cropFinish(null);
}
window.addEventListener('popstate', () => showLayer(layerOf()));
if (layerOf()) history.replaceState(null, ''); // fresh load: never start inside a layer

function select(id, openMobile = true) {
  selectedId = id;
  if (openMobile && !isDesktop()) pushLayer('detail');
  renderList();
  renderDetail();
}

function setCover(tr, cover) {
  releaseCover(tr.newCover);
  tr.newCover = cover;
  tr.removed = false;
}

async function applyImageFile(file) {
  const tr = tracks.find((x) => x.id === selectedId);
  if (!file || !tr) return;
  try {
    const cover = await pickedCover(file);
    if (!cover) return;
    addToLibrary(cover, file.name);
    setCover(tr, cover);
    renderList();
    renderDetail();
    suggestFromId = tracks.length > 1 ? tr.id : null;
    renderSuggest();
  } catch (err) {
    toast(err.message);
  }
}

function applyToAll(src) {
  const cov = effectiveCover(src);
  if (!cov) return;
  let n = 0;
  for (const tr of tracks) {
    if (tr === src) continue;
    setCover(tr, makeCover(cov.bytes, cov.mime, cov.note, cov.width, cov.height));
    n++;
  }
  suggestFromId = null;
  renderSuggest();
  renderList();
  renderDetail();
  toast(t('applied', n));
}

function renderSuggest() {
  if (pendingCover && !tracks.length) {
    els.suggestThumb.src = pendingCover.url;
    els.suggestText.textContent = t('pendingRow');
    els.suggestApply.hidden = true;
    els.suggest.hidden = false;
    return;
  }
  els.suggestApply.hidden = false;
  const tagSrc = tracks.find((x) => x.id === suggestTagsFromId);
  if (tagSrc && tracks.length > 1 && (tagSrc.edits.album.trim() || tagSrc.edits.artist.trim())) {
    const cov = effectiveCover(tagSrc);
    els.suggestThumb.src = cov ? cov.url : '';
    els.suggestThumb.hidden = !cov;
    els.suggestText.textContent = t('applyTagsAsk', tracks.length);
    els.suggest.hidden = false;
    return;
  }
  els.suggestThumb.hidden = false;
  const src = tracks.find((x) => x.id === suggestFromId);
  const cov = src && effectiveCover(src);
  if (!cov || tracks.length < 2) {
    suggestFromId = null;
    els.suggest.hidden = true;
    return;
  }
  els.suggestThumb.src = cov.url;
  els.suggestText.textContent = t('applyAllAsk', tracks.length);
  els.suggest.hidden = false;
}

/* ---------- render ---------- */
function renderList() {
  els.trackList.replaceChildren(
    ...tracks.map((tr) => {
      const li = document.createElement('li');
      li.className = 'track' + (tr.id === selectedId ? ' is-selected' : '');
      const cov = effectiveCover(tr);
      li.innerHTML = `
        <div class="track-thumb">${cov ? `<img alt="" src="${cov.url}">` : '<svg><use href="#i-note"/></svg>'}</div>
        <div class="track-body">
          <div class="track-title">${isChanged(tr) ? `<span class="dot" aria-hidden="true"></span><span class="sr-only">${t('changed')} </span>` : ''}<span class="track-title-text"></span></div>
          <div class="track-sub"></div>
        </div>`;
      li.querySelector('.track-title-text').textContent = tr.edits.title.trim() || tr.file.name.replace(/\.[^.]+$/, '');
      li.querySelector('.track-sub').textContent = `${tr.edits.artist.trim() || t('unknownArtist')} · ${fmtSize(tr.file.size)}`;
      li.addEventListener('click', () => select(tr.id));
      return li;
    }),
  );
  els.emptyHint.hidden = tracks.length > 0;
  els.downloadAll.hidden = tracks.length === 0;
}

function renderDetail() {
  const tr = tracks.find((x) => x.id === selectedId);
  els.detail.hidden = !tr;
  els.detailPlaceholder.hidden = !!tr;
  if (!tr) {
    els.player.pause();
    return;
  }

  const cov = effectiveCover(tr);
  els.detailTitle.textContent = tr.edits.title.trim() || tr.file.name;
  els.coverImg.hidden = !cov;
  els.coverEmpty.hidden = !!cov;
  els.removeCoverBtn.hidden = !cov;
  if (cov) els.coverImg.src = cov.url;
  else els.coverImg.removeAttribute('src');
  els.coverCtaText.textContent = cov ? t('changeImage') : t('chooseImage');
  els.coverInfo.textContent = cov?.note || (cov ? `${cov.mime.replace('image/', '')} · ${fmtSize(cov.size)}` : '');

  for (const input of els.tagInputs) {
    if (document.activeElement !== input) input.value = tr.edits[input.dataset.tag] ?? '';
  }
  els.metaTitle.textContent = tr.edits.title.trim() || t('unknownTitle');
  els.metaArtist.textContent = [tr.edits.artist.trim() || t('unknownArtist'), tr.edits.album.trim()].filter(Boolean).join(' · ');
  els.metaFile.textContent = `${tr.file.name} · ${fmtSize(tr.file.size)}`;
  els.tagsFile.textContent = els.metaFile.textContent;

  if (els.player.dataset.id !== String(tr.id)) {
    els.player.pause();
    els.player.src = tr.audioUrl;
    els.player.dataset.id = tr.id;
    updateSeek();
  }

  els.adjustCropBtn.hidden = !cov?.source;
  els.downloadBtn.disabled = !isChanged(tr);
}

/* ---------- player ---------- */
function updateSeek() {
  const d = els.player.duration;
  const c = els.player.currentTime;
  const p = d ? (c / d) * 100 : 0;
  els.seek.value = Math.round(p * 10);
  els.seek.style.setProperty('--p', `${p}%`);
  els.tCur.textContent = fmtTime(c);
  els.tDur.textContent = fmtTime(d);
  els.seek.setAttribute('aria-valuetext', `${fmtTime(c)} / ${fmtTime(d)}`);
}
els.playBtn.addEventListener('click', () => (els.player.paused ? els.player.play() : els.player.pause()));
function setPlaying(on) {
  els.playerUi.classList.toggle('is-playing', on);
  const label = on ? t('pause') : t('play');
  els.playBtn.title = label;
  els.playBtn.setAttribute('aria-label', label);
}
els.player.addEventListener('play', () => setPlaying(true));
els.player.addEventListener('pause', () => setPlaying(false));
els.player.addEventListener('ended', () => setPlaying(false));
els.player.addEventListener('timeupdate', updateSeek);
els.player.addEventListener('loadedmetadata', updateSeek);
els.seek.addEventListener('input', () => {
  const d = els.player.duration;
  if (d) els.player.currentTime = (els.seek.value / 1000) * d;
  els.seek.style.setProperty('--p', `${els.seek.value / 10}%`);
});

/* ---------- tag editing ---------- */
els.metaCard.addEventListener('click', () => pushLayer('tags'));
for (const input of els.tagInputs) {
  input.addEventListener('input', () => {
    const tr = tracks.find((x) => x.id === selectedId);
    if (!tr) return;
    tr.edits[input.dataset.tag] = input.value;
    renderList();
    renderDetail();
  });
  input.addEventListener('change', () => {
    const tr = tracks.find((x) => x.id === selectedId);
    if (!tr) return;
    if ((input.dataset.tag === 'album' || input.dataset.tag === 'artist') && tracks.length > 1 && input.value.trim()) {
      suggestTagsFromId = tr.id;
      renderSuggest();
    }
  });
}

/* ---------- download ---------- */
async function download(tr) {
  const cov = effectiveCover(tr);
  if (cov) await ensureDims(cov);
  const { blob, droppedTags } = tr.fmt.write(tr.buf, cov, tagsChanged(tr) ? tr.edits : null);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = tr.file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return droppedTags;
}

/* ---------- events ---------- */
const openAudioPicker = () => els.audioInput.click();
els.addFab.addEventListener('click', openAudioPicker);
els.addDesktop.addEventListener('click', openAudioPicker);
els.pickImageBtn.addEventListener('click', () => {
  if (libraryItems().length) {
    renderLibrary();
    pushLayer('library');
  } else els.imageInput.click();
});
els.libraryNew.addEventListener('click', () => {
  els.imageInput.click(); // must stay inside the user gesture
  closeLayer();
});

els.audioInput.addEventListener('change', async (e) => {
  await importFiles(e.target.files);
  e.target.value = '';
});

els.imageInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  await applyImageFile(file);
});

els.removeCoverBtn.addEventListener('click', () => {
  const tr = tracks.find((x) => x.id === selectedId);
  if (!tr) return;
  releaseCover(tr.newCover);
  tr.newCover = null;
  tr.removed = true;
  if (suggestFromId === tr.id) suggestFromId = null;
  renderSuggest();
  renderList();
  renderDetail();
});

els.suggestApply.addEventListener('click', () => {
  const tagSrc = tracks.find((x) => x.id === suggestTagsFromId);
  if (tagSrc) {
    let n = 0;
    for (const tr of tracks) {
      if (tr === tagSrc) continue;
      tr.edits.album = tagSrc.edits.album;
      tr.edits.artist = tagSrc.edits.artist;
      n++;
    }
    suggestTagsFromId = null;
    renderAll();
    toast(t('tagsApplied', n));
    return;
  }
  const src = tracks.find((x) => x.id === suggestFromId);
  if (src) applyToAll(src);
});
els.noticeDismiss.addEventListener('click', () => showNotice(''));
els.suggestDismiss.addEventListener('click', () => {
  suggestFromId = null;
  suggestTagsFromId = null;
  if (pendingCover) { releaseCover(pendingCover); pendingCover = null; }
  renderSuggest();
});

els.downloadBtn.addEventListener('click', async () => {
  const tr = tracks.find((x) => x.id === selectedId);
  if (!tr) return;
  try {
    const dropped = await download(tr);
    toast(dropped ? t('droppedTags') : t('saved'));
  } catch (err) {
    toast(err.message);
  }
});

els.downloadAll.addEventListener('click', async () => {
  const todo = tracks.filter(isChanged);
  const list = todo.length ? todo : tracks;
  for (const tr of list) {
    await download(tr);
    await new Promise((r) => setTimeout(r, 400)); // browsers throttle rapid downloads
  }
  toast(t('savedAll', list.length));
});

els.removeTrackBtn.addEventListener('click', () => removeTrack(selectedId));
els.backBtn.addEventListener('click', closeLayer);

/* ---------- crop sheet ----------
 * Square viewport; the image is panned/zoomed underneath. All maths in stage px,
 * converted back to source px when the user confirms. */
const cropState = { S: 0, w: 0, h: 0, s0: 1, z: 1, ox: 0, oy: 0, resolve: null, url: null };
const pointers = new Map();
let pinchStart = null;

function cropScale() { return cropState.s0 * cropState.z; }
function cropApply() {
  const st = cropState, sc = cropScale();
  st.ox = Math.min(0, Math.max(st.S - st.w * sc, st.ox));
  st.oy = Math.min(0, Math.max(st.S - st.h * sc, st.oy));
  els.cropImg.style.transform = `translate(${st.ox}px, ${st.oy}px) scale(${sc})`;
  els.cropZoom.value = String(Math.round(st.z * 100));
}
function cropZoomTo(z, cx, cy) {
  const st = cropState, before = cropScale();
  st.z = Math.min(4, Math.max(1, z));
  const after = cropScale();
  st.ox = cx - (cx - st.ox) * (after / before);
  st.oy = cy - (cy - st.oy) * (after / before);
  cropApply();
}
function cropFromRect(crop) {
  const st = cropState, sc = st.S / crop.size;
  st.z = sc / st.s0;
  st.ox = -crop.x * sc;
  st.oy = -crop.y * sc;
  cropApply();
}
function cropToRect() {
  const st = cropState, sc = cropScale();
  const size = Math.round(st.S / sc);
  return { x: Math.round(-st.ox / sc), y: Math.round(-st.oy / sc), size: Math.min(size, st.w, st.h) };
}

function openCrop(file, w, h, initial) {
  return new Promise((resolve) => {
    cropFinish(null);
    const st = cropState;
    st.resolve = resolve;
    st.w = w; st.h = h;
    st.url = URL.createObjectURL(file);
    els.cropImg.src = st.url;
    els.cropImg.style.width = `${w}px`;
    els.cropImg.style.height = `${h}px`;
    pushLayer('crop');
    requestAnimationFrame(() => {
      st.S = els.cropStage.clientWidth;
      st.s0 = st.S / Math.min(w, h);
      cropFromRect(initial);
    });
  });
}
function cropFinish(result) {
  const st = cropState;
  if (!st.resolve) return;
  const r = st.resolve;
  st.resolve = null;
  if (st.url) { URL.revokeObjectURL(st.url); st.url = null; }
  els.cropImg.removeAttribute('src');
  r(result);
}
els.cropUse.addEventListener('click', () => { const crop = cropToRect(); cropFinish({ crop }); closeLayer(); });
els.cropKeep.addEventListener('click', () => { cropFinish({ keep: true }); closeLayer(); });
els.cropZoom.addEventListener('input', () => cropZoomTo(Number(els.cropZoom.value) / 100, cropState.S / 2, cropState.S / 2));
els.cropStage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const r = els.cropStage.getBoundingClientRect();
  cropZoomTo(cropState.z * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
els.cropStage.addEventListener('pointerdown', (e) => {
  els.cropStage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), z: cropState.z };
  }
});
els.cropStage.addEventListener('pointermove', (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const cur = { x: e.clientX, y: e.clientY };
  pointers.set(e.pointerId, cur);
  if (pointers.size === 1) {
    cropState.ox += cur.x - prev.x;
    cropState.oy += cur.y - prev.y;
    cropApply();
  } else if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const r = els.cropStage.getBoundingClientRect();
    const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
    cropZoomTo(pinchStart.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.dist), mid.x, mid.y);
  }
});
const endPointer = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchStart = null; };
els.cropStage.addEventListener('pointerup', endPointer);
els.cropStage.addEventListener('pointercancel', endPointer);
// Keep the sheet's swipe-to-dismiss from reacting to drags on the stage.
['touchstart', 'touchmove', 'touchend'].forEach((ev) => els.cropStage.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));

els.adjustCropBtn.addEventListener('click', async () => {
  const tr = tracks.find((x) => x.id === selectedId);
  const cov = tr && effectiveCover(tr);
  if (!cov?.source) return;
  const { file, width, height } = cov.source;
  const result = await openCrop(file, width, height, cov.crop ?? centerCrop(width, height));
  if (!result) return;
  try {
    setCover(tr, await processImage(file, result.keep ? null : result.crop));
    renderAll();
  } catch (err) {
    toast(err.message);
  }
});

/* ---------- overflow menu ---------- */
document.getElementById('aboutVersion').textContent = APP_VERSION;
function setMenu(open) {
  els.menu.hidden = !open;
  els.menuBtn.setAttribute('aria-expanded', String(open));
  if (open) els.menuSettings.focus();
}
els.menuBtn.addEventListener('click', () => setMenu(els.menu.hidden));
document.addEventListener('pointerdown', (e) => {
  if (!els.menu.hidden && !els.menu.contains(e.target) && !els.menuBtn.contains(e.target)) setMenu(false);
});
els.menu.addEventListener('keydown', (e) => {
  const items = [els.menuSettings, els.menuAbout, els.menuClear];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
  }
});
els.menuSettings.addEventListener('click', () => { setMenu(false); pushLayer('settings'); });
els.menuAbout.addEventListener('click', () => { setMenu(false); pushLayer('about'); });
els.menuClear.addEventListener('click', () => {
  setMenu(false);
  clearSession();
});

// Drops everything held in memory. There is no persistent copy of tracks or images.
function clearSession() {
  els.player.pause();
  els.player.removeAttribute('src');
  delete els.player.dataset.id;
  for (const tr of tracks) {
    URL.revokeObjectURL(tr.audioUrl);
    releaseCover(tr.originalCover);
    releaseCover(tr.newCover);
  }
  tracks.length = 0;
  library.forEach((e) => releaseCover(e.cover));
  library.length = 0;
  releaseCover(pendingCover);
  pendingCover = null;
  suggestFromId = null;
  selectedId = null;
  showNotice('');
  if (layerOf()) history.back();
  document.body.classList.remove('show-detail');
  renderAll();
  toast(t('sessionCleared'));
}

els.resetSettings.addEventListener('click', () => {
  Object.assign(settings, DEFAULTS);
  saveSettings();
  applyTheme();
  applyLanguage();
  renderSettings();
  renderAll();
  setPlaying(!els.player.paused);
  toast(t('settingsReset'));
});

/* ---------- settings + about sheets ---------- */
els.brandBtn.addEventListener('click', () => pushLayer('about'));
els.aboutFromSettings.addEventListener('click', () => {
  // replace the settings entry so back returns to the app, not to settings
  history.replaceState({ layer: 'about' }, '');
  showLayer('about');
});
document.querySelectorAll('.sheet [data-close]').forEach((el) => el.addEventListener('click', closeLayer));

/* Swipe down anywhere on a bottom sheet to dismiss it (phones only).
 * The drag only starts when the sheet's own scroll is at the top, so
 * scrolling long content still works. */
document.querySelectorAll('.sheet').forEach((sheet) => {
  const panel = sheet.querySelector('.sheet-panel');
  const backdrop = sheet.querySelector('.sheet-backdrop');
  let startY = 0, startT = 0, dy = 0, dragging = false;
  const reset = () => {
    panel.style.transition = '';
    panel.style.transform = '';
    backdrop.style.opacity = '';
  };
  panel.addEventListener('touchstart', (e) => {
    if (isDesktop()) return;
    startY = e.touches[0].clientY;
    startT = Date.now();
    dy = 0;
    dragging = false;
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (isDesktop()) return;
    const d = e.touches[0].clientY - startY;
    if (!dragging) {
      // an inner scroller (e.g. the library grid) that is not at its top keeps its scroll
      let el = e.target;
      let innerScrolled = false;
      while (el && el !== panel) {
        if (el.scrollTop > 0 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) { innerScrolled = true; break; }
        el = el.parentElement;
      }
      if (d > 8 && panel.scrollTop <= 0 && !innerScrolled) {
        dragging = true;
        panel.style.transition = 'none';
        backdrop.style.transition = 'none';
      } else return;
    }
    e.preventDefault();
    dy = Math.max(0, d);
    panel.style.transform = `translateY(${dy}px)`;
    backdrop.style.opacity = String(Math.max(0.2, 1 - dy / panel.offsetHeight));
  }, { passive: false });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    const fast = dy / Math.max(80, Date.now() - startT) > 0.6; // px per ms, ignores sub-80ms jitter
    if (dy > panel.offsetHeight * 0.3 || (fast && dy > 80)) {
      panel.style.transition = 'transform 0.2s ease-in';
      panel.style.transform = 'translateY(110%)';
      setTimeout(() => { closeLayer(); reset(); backdrop.style.transition = ''; }, 190);
    } else {
      panel.style.transition = 'transform 0.35s var(--spring)';
      backdrop.style.transition = '';
      panel.style.transform = '';
      backdrop.style.opacity = '';
    }
  };
  panel.addEventListener('touchend', end);
  panel.addEventListener('touchcancel', end);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!els.menu.hidden) {
    setMenu(false);
    els.menuBtn.focus();
  } else if (layerOf()) closeLayer();
});

function renderSettings() {
  document.querySelectorAll('.seg[data-setting]').forEach((seg) => {
    const key = seg.dataset.setting;
    seg.querySelectorAll('button').forEach((b) => {
      const on = String(settings[key]) === b.dataset.value;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
  });
}
document.querySelectorAll('.seg[data-setting] button').forEach((b) => {
  b.addEventListener('click', () => {
    const key = b.closest('.seg').dataset.setting;
    settings[key] = key === 'maxEdge' ? Number(b.dataset.value) : b.dataset.value;
    saveSettings();
    if (key === 'theme') applyTheme();
    if (key === 'lang') {
      applyLanguage();
      renderList();
      renderDetail();
      renderSuggest();
      setPlaying(!els.player.paused);
    }
    renderSettings();
  });
});
renderSettings();

/* drag & drop: audio anywhere, images onto the cover */
let dragDepth = 0;
document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (++dragDepth === 1) document.body.classList.add('is-dragging');
});
document.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) {
    dragDepth = 0;
    document.body.classList.remove('is-dragging');
  }
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('is-dragging');
  const files = [...(e.dataTransfer?.files ?? [])];
  if (!files.length) return;
  // Dropping onto the cover targets the selected track; anywhere else goes through the import rules.
  if (els.coverBox.contains(e.target) && files.some(isImageFile)) {
    await applyImageFile(files.find(isImageFile));
    const rest = files.filter((f) => !isImageFile(f));
    if (rest.length) await importFiles(rest);
    return;
  }
  await importFiles(files);
});
els.coverBox.addEventListener('dragenter', () => els.coverBox.classList.add('is-over'));
els.coverBox.addEventListener('dragleave', () => els.coverBox.classList.remove('is-over'));
els.coverBox.addEventListener('drop', () => els.coverBox.classList.remove('is-over'));

renderList();
renderDetail();
