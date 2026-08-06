/**
 * Griff Translate — Neumorphic Web Translator
 * Powered by DeepL API
 */

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  const API_KEY = '25f9e843-9882-4573-839f-0dbf2dd4d76c:fx';
  const DEEPL_TRANSLATE_URL = 'https://api-free.deepl.com/v2/translate';
  const DEEPL_LANGUAGES_URL = 'https://api.deepl.com/v2/languages';
  const MAX_CHARS = 5000;
  const AUTO_TRANSLATE_DELAY = 1000; // 1 second debounce

  // CORS proxy fallback list — tried in order until one succeeds
  const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    (url) => url  // direct (works if CORS headers are present)
  ];

  /**
   * Fetch with CORS-proxy fallback.
   * Tries each proxy in order; returns the first successful Response.
   */
  async function fetchWithProxy(targetUrl, options = {}) {
    let lastError;
    for (const proxyFn of CORS_PROXIES) {
      const proxiedUrl = proxyFn(targetUrl);
      try {
        const res = await fetch(proxiedUrl, options);
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          // Success or client-error (API key issues, etc.) — return as-is
          return res;
        }
        lastError = new Error(`Proxy returned ${res.status}`);
      } catch (err) {
        lastError = err;
        // Network error / DNS failure — try next proxy
      }
    }
    throw lastError || new Error('All CORS proxies failed');
  }

  // Fallback languages from languages.json
  const FALLBACK_LANGUAGES = [
    { language: "AR", name: "Arabic" }, { language: "BG", name: "Bulgarian" },
    { language: "CS", name: "Czech" }, { language: "DA", name: "Danish" },
    { language: "DE", name: "German" }, { language: "EL", name: "Greek" },
    { language: "EN", name: "English" }, { language: "ES", name: "Spanish" },
    { language: "ET", name: "Estonian" }, { language: "FI", name: "Finnish" },
    { language: "FR", name: "French" }, { language: "HE", name: "Hebrew" },
    { language: "HU", name: "Hungarian" }, { language: "ID", name: "Indonesian" },
    { language: "IT", name: "Italian" }, { language: "JA", name: "Japanese" },
    { language: "KO", name: "Korean" }, { language: "LT", name: "Lithuanian" },
    { language: "LV", name: "Latvian" }, { language: "NB", name: "Norwegian" },
    { language: "NL", name: "Dutch" }, { language: "PL", name: "Polish" },
    { language: "PT", name: "Portuguese" }, { language: "RO", name: "Romanian" },
    { language: "RU", name: "Russian" }, { language: "SK", name: "Slovak" },
    { language: "SL", name: "Slovenian" }, { language: "SV", name: "Swedish" },
    { language: "TH", name: "Thai" }, { language: "TR", name: "Turkish" },
    { language: "UK", name: "Ukrainian" }, { language: "VI", name: "Vietnamese" },
    { language: "ZH", name: "Chinese" }
  ];

  // ── DOM Refs ────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const sourceDropdown = $('#source-dropdown');
  const targetDropdown = $('#target-dropdown');
  const sourceText = $('#source-text');
  const targetText = $('#target-text');
  const translateBtn = $('#translate-btn');
  const swapBtn = $('#swap-languages');
  const clearBtn = $('#clear-source');
  const copyBtn = $('#copy-translation');
  const charCount = $('#char-count');
  const detectedLang = $('#detected-lang');
  const detectedLangText = $('#detected-lang-text');
  const loadingIndicator = $('#loading-indicator');
  const themeToggle = $('#theme-toggle');
  const langCountEl = $('#lang-count');
  const toastContainer = $('#toast-container');

  let languages = [];
  let isTranslating = false;
  let autoTranslateTimer = null;

  // ── Dropdown Helpers ────────────────────────────────────
  function getDropdownValue(dropdown) {
    return dropdown.dataset.value;
  }

  function setDropdownValue(dropdown, value, label) {
    dropdown.dataset.value = value;
    dropdown.querySelector('.dropdown-display').textContent = label;
    // Update selected state in list
    dropdown.querySelectorAll('.dropdown-item').forEach((item) => {
      item.classList.toggle('selected', item.dataset.value === value);
    });
  }

  function openDropdown(dropdown) {
    // Close any other open dropdowns
    document.querySelectorAll('.searchable-dropdown.open').forEach((d) => {
      if (d !== dropdown) d.classList.remove('open');
    });
    dropdown.classList.add('open');
    const search = dropdown.querySelector('.dropdown-search');
    search.value = '';
    filterDropdownItems(dropdown, '');
    setTimeout(() => search.focus(), 50);
  }

  function closeDropdown(dropdown) {
    dropdown.classList.remove('open');
  }

  function filterDropdownItems(dropdown, query) {
    const items = dropdown.querySelectorAll('.dropdown-item');
    const q = query.toLowerCase();
    let hasVisible = false;
    items.forEach((item) => {
      const match = item.textContent.toLowerCase().includes(q);
      item.classList.toggle('hidden', !match);
      if (match) hasVisible = true;
    });
    // Show/hide empty message
    let emptyMsg = dropdown.querySelector('.dropdown-empty');
    if (!hasVisible) {
      if (!emptyMsg) {
        emptyMsg = document.createElement('li');
        emptyMsg.className = 'dropdown-empty';
        emptyMsg.textContent = 'No languages found';
        dropdown.querySelector('.dropdown-list').appendChild(emptyMsg);
      }
      emptyMsg.style.display = '';
    } else if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  }

  function initDropdown(dropdown) {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const search = dropdown.querySelector('.dropdown-search');
    const list = dropdown.querySelector('.dropdown-list');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('open')) {
        closeDropdown(dropdown);
      } else {
        openDropdown(dropdown);
      }
    });

    search.addEventListener('input', () => {
      filterDropdownItems(dropdown, search.value);
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown(dropdown);
    });

    list.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;
      const value = item.dataset.value;
      const label = item.textContent;
      setDropdownValue(dropdown, value, label);
      closeDropdown(dropdown);
      // Trigger auto-translate if text exists
      if (sourceText.value.trim()) scheduleAutoTranslate();
    });
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    loadTheme();
    initDropdown(sourceDropdown);
    initDropdown(targetDropdown);
    loadLanguages();
    bindEvents();
  }

  // ── Theme ───────────────────────────────────────────────
  function loadTheme() {
    const saved = localStorage.getItem('grif-theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('grif-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('grif-theme', 'dark');
    }
  }

  // ── Languages ───────────────────────────────────────────
  async function loadLanguages() {
    try {
      const res = await fetchWithProxy(DEEPL_LANGUAGES_URL, {
        headers: { 'Authorization': `DeepL-Auth-Key ${API_KEY}` }
      });
      if (!res.ok) throw new Error('API error');
      languages = await res.json();
    } catch {
      languages = FALLBACK_LANGUAGES;
    }
    populateDropdowns();
    langCountEl.textContent = languages.length + '+';
  }

  function populateDropdowns() {
    const srcList = $('#source-lang-list');
    const tgtList = $('#target-lang-list');
    srcList.innerHTML = '';
    tgtList.innerHTML = '';

    // Source: add "Auto Detect" first
    const autoItem = document.createElement('li');
    autoItem.className = 'dropdown-item selected';
    autoItem.dataset.value = 'auto';
    autoItem.textContent = 'Auto Detect';
    srcList.appendChild(autoItem);

    languages.forEach((lang) => {
      const code = lang.language;
      const name = lang.name;

      const srcItem = document.createElement('li');
      srcItem.className = 'dropdown-item';
      srcItem.dataset.value = code;
      srcItem.textContent = name;
      srcList.appendChild(srcItem);

      const tgtItem = document.createElement('li');
      tgtItem.className = 'dropdown-item';
      tgtItem.dataset.value = code;
      tgtItem.textContent = name;
      if (code === 'EN') tgtItem.classList.add('selected');
      tgtList.appendChild(tgtItem);
    });
  }

  // ── Auto-translate with debounce ────────────────────────
  function scheduleAutoTranslate() {
    clearTimeout(autoTranslateTimer);
    const text = sourceText.value.trim();
    if (!text) {
      targetText.innerHTML = '<span class="placeholder-text">Translation will appear here...</span>';
      detectedLang.style.display = 'none';
      return;
    }
    autoTranslateTimer = setTimeout(() => translate(), AUTO_TRANSLATE_DELAY);
  }

  // ── Translate ───────────────────────────────────────────
  async function translate() {
    const text = sourceText.value.trim();
    if (!text) return;
    if (isTranslating) return;

    const targetLang = getDropdownValue(targetDropdown);
    if (!targetLang) {
      showToast('Please select a target language.', 'error');
      return;
    }

    isTranslating = true;
    translateBtn.disabled = true;
    loadingIndicator.style.display = 'flex';
    targetText.innerHTML = '';

    const body = { text: [text], target_lang: targetLang };

    const sourceLang = getDropdownValue(sourceDropdown);
    if (sourceLang !== 'auto') {
      body.source_lang = sourceLang;
    }

    try {
      const res = await fetchWithProxy(DEEPL_TRANSLATE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${res.status}`);
      }

      const data = await res.json();
      const translation = data.translations[0];

      // Show translated text only
      targetText.textContent = translation.text;

      // Show detected language
      if (translation.detected_source_language) {
        const detectedCode = translation.detected_source_language;
        const detectedName = languages.find(
          (l) => l.language === detectedCode
        )?.name || detectedCode;
        detectedLangText.textContent = `Detected: ${detectedName}`;
        detectedLang.style.display = 'flex';
      }

      showToast('Translation complete!', 'success');
    } catch (err) {
      targetText.innerHTML = `<span class="placeholder-text">Translation failed. Please try again.</span>`;
      showToast(err.message || 'Translation failed.', 'error');
    } finally {
      isTranslating = false;
      translateBtn.disabled = false;
      loadingIndicator.style.display = 'none';
    }
  }

  // ── Swap Languages ──────────────────────────────────────
  function swapLanguages() {
    const srcVal = getDropdownValue(sourceDropdown);
    const tgtVal = getDropdownValue(targetDropdown);

    if (srcVal === 'auto') {
      showToast('Cannot swap when source is Auto Detect.', 'error');
      return;
    }

    const srcLabel = sourceDropdown.querySelector('.dropdown-display').textContent;
    const tgtLabel = targetDropdown.querySelector('.dropdown-display').textContent;

    setDropdownValue(sourceDropdown, tgtVal, tgtLabel);
    setDropdownValue(targetDropdown, srcVal, srcLabel);

    // Swap text content
    const srcText = sourceText.value;
    const tgtText = targetText.textContent;
    if (tgtText && !targetText.querySelector('.placeholder-text')) {
      sourceText.value = tgtText;
      targetText.textContent = srcText;
      updateCharCount();
    }
  }

  // ── Char Count ──────────────────────────────────────────
  function updateCharCount() {
    const len = sourceText.value.length;
    charCount.textContent = `${len.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`;
  }

  // ── Clear ───────────────────────────────────────────────
  function clearSource() {
    sourceText.value = '';
    targetText.innerHTML = '<span class="placeholder-text">Translation will appear here...</span>';
    detectedLang.style.display = 'none';
    updateCharCount();
    sourceText.focus();
  }

  // ── Copy ────────────────────────────────────────────────
  async function copyTranslation() {
    const text = targetText.textContent;
    if (!text || targetText.querySelector('.placeholder-text')) {
      showToast('Nothing to copy.', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy.', 'error');
    }
  }

  // ── Quick Chips ─────────────────────────────────────────
  function handleChip(e) {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    const code = chip.dataset.target;
    const name = languages.find((l) => l.language === code)?.name || code;
    setDropdownValue(targetDropdown, code, name);

    // Visual feedback
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');

    // Auto-translate if there's text
    if (sourceText.value.trim()) translate();
  }

  // ── Toast ───────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 2800);
  }

  // ── Keyboard Shortcut ──────────────────────────────────
  function handleKeyboard(e) {
    // Ctrl/Cmd + Enter to translate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      translate();
    }
  }

  // ── Bind Events ─────────────────────────────────────────
  function bindEvents() {
    translateBtn.addEventListener('click', translate);
    swapBtn.addEventListener('click', swapLanguages);
    clearBtn.addEventListener('click', clearSource);
    copyBtn.addEventListener('click', copyTranslation);
    sourceText.addEventListener('input', () => { updateCharCount(); scheduleAutoTranslate(); });
    sourceText.addEventListener('keydown', handleKeyboard);
    themeToggle.addEventListener('click', toggleTheme);
    $('#quick-actions').addEventListener('click', handleChip);

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.searchable-dropdown.open').forEach((d) => {
        if (!d.contains(e.target)) closeDropdown(d);
      });
    });
  }

  // ── Start ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
